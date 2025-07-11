const Oferta = require('../models/Oferta');
const Producto = require('../models/producto');
const Categoria = require('../models/categoria.model');

// Funciones CRUD y de Negocio

/**
 * @route POST /api/ofertas
 * @desc Crea una nueva oferta
 * @access Admin
 */
exports.crearOferta = async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      porcentajeDescuento,
      fechaInicio, 
      fechaFin, 
      tipoOferta,
      productosAplicables, 
      categoriasAplicables 
    } = req.body;

    // Validar tipo de oferta
    if (!tipoOferta || !['producto', 'categoria'].includes(tipoOferta)) {
      return res.status(400).json({ mensaje: 'El tipo de oferta debe ser "producto" o "categoria".' });
    }

    // Validar productos si es oferta de producto
    if (tipoOferta === 'producto') {
      if (!productosAplicables || productosAplicables.length === 0) {
        return res.status(400).json({ mensaje: 'Para ofertas de producto, debe especificar al menos un producto.' });
      }
      const productosExistentes = await Producto.countDocuments({ _id: { $in: productosAplicables } });
      if (productosExistentes !== productosAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de productos aplicables no son válidos.' });
      }
    }

    // Validar categorías si es oferta de categoría
    if (tipoOferta === 'categoria') {
      if (!categoriasAplicables || categoriasAplicables.length === 0) {
        return res.status(400).json({ mensaje: 'Para ofertas de categoría, debe especificar al menos una categoría.' });
      }
      const categoriasExistentes = await Categoria.countDocuments({ _id: { $in: categoriasAplicables } });
      if (categoriasExistentes !== categoriasAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de categorías aplicables no son válidos.' });
      }
    }
    
    const nuevaOferta = new Oferta({
      nombre,
      descripcion,
      porcentajeDescuento,
      fechaInicio: fechaInicio || Date.now(),
      fechaFin,
      tipoOferta,
      productosAplicables: tipoOferta === 'producto' ? productosAplicables : [],
      categoriasAplicables: tipoOferta === 'categoria' ? categoriasAplicables : [],
      activa: true
    });

    await nuevaOferta.save();

    res.status(201).json({
      mensaje: 'Oferta creada exitosamente.',
      oferta: nuevaOferta
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe una oferta con este nombre.', detalle: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al crear la oferta.', detalle: error.message });
    }
    console.error('Error al crear la oferta:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear la oferta.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/ofertas
 * @desc Obtiene todas las ofertas (opcionalmente filtradas por estado o vigencia)
 * @access Público
 */
exports.obtenerOfertas = async (req, res) => {
  try {
    const query = {};
    if (req.query.activa !== undefined) {
      query.activa = req.query.activa === 'true';
    }

    let ofertas = await Oferta.find(query)
      .populate('productosAplicables', 'nombre precio imagen')
      .populate('categoriasAplicables', 'nombre')
      .sort({ fechaInicio: -1 });

    // Filtrar por vigencia después de la consulta de base de datos
    if (req.query.vigente !== undefined) {
      const esVigente = req.query.vigente === 'true';
      ofertas = ofertas.filter(oferta => oferta.estaVigente() === esVigente);
    }

    res.status(200).json(ofertas);
  } catch (error) {
    console.error('Error al obtener ofertas:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener ofertas.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/ofertas/:id
 * @desc Obtiene una oferta por su ID
 * @access Público
 */
exports.obtenerOfertaPorId = async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id).populate('productos');
    if (!oferta) return res.status(404).json({ mensaje: 'Oferta no encontrada' });

    // Calcular precios finales
    const productosConPrecioFinal = oferta.productos.map(prod => ({
      _id: prod._id,
      nombre: prod.nombre,
      precioOriginal: prod.precio,
      precioFinal: +(prod.precio * (1 - oferta.porcentajeDescuento / 100)).toFixed(2)
    }));

    res.json({
      ...oferta.toObject(),
      productos: productosConPrecioFinal
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la oferta', error: err.message });
  }
};

/**
 * @route PUT /api/ofertas/:id
 * @desc Actualiza una oferta existente por su ID
 * @access Admin
 */
exports.editarOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validar tipo de oferta si se actualiza
    if (updateData.tipoOferta && !['producto', 'categoria'].includes(updateData.tipoOferta)) {
      return res.status(400).json({ mensaje: 'El tipo de oferta debe ser "producto" o "categoria".' });
    }

    // Validar productos si es oferta de producto
    if (updateData.tipoOferta === 'producto' || (updateData.productosAplicables && updateData.productosAplicables.length > 0)) {
      if (!Array.isArray(updateData.productosAplicables)) {
        return res.status(400).json({ mensaje: 'productosAplicables debe ser un array.' });
      }
      const productosExistentes = await Producto.countDocuments({ _id: { $in: updateData.productosAplicables } });
      if (productosExistentes !== updateData.productosAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de productos aplicables no son válidos.' });
      }
    }

    // Validar categorías si es oferta de categoría
    if (updateData.tipoOferta === 'categoria' || (updateData.categoriasAplicables && updateData.categoriasAplicables.length > 0)) {
      if (!Array.isArray(updateData.categoriasAplicables)) {
        return res.status(400).json({ mensaje: 'categoriasAplicables debe ser un array.' });
      }
      const categoriasExistentes = await Categoria.countDocuments({ _id: { $in: updateData.categoriasAplicables } });
      if (categoriasExistentes !== updateData.categoriasAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de categorías aplicables no son válidos.' });
      }
    }

    const ofertaActualizada = await Oferta.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!ofertaActualizada) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada para actualizar.' });
    }
    res.status(200).json({
      mensaje: 'Oferta actualizada exitosamente.',
      oferta: ofertaActualizada
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe otra oferta con el nombre proporcionado.', detalle: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al actualizar la oferta.', detalle: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
    }
    console.error('Error al actualizar la oferta:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar la oferta.',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/ofertas/:id
 * @desc Elimina una oferta por su ID
 * @access Admin
 */
exports.borrarOfertaPorId = async (req, res) => {
  try {
    const ofertaEliminada = await Oferta.findByIdAndDelete(req.params.id);
    if (!ofertaEliminada) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada para eliminar.' });
    }
    res.status(200).json({
      mensaje: 'Oferta eliminada exitosamente.',
      oferta: ofertaEliminada
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
    }
    console.error('Error al eliminar la oferta:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar la oferta.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/ofertas/:id/activar
 * @desc Activa una oferta
 * @access Admin
 */
exports.activarOferta = async (req, res) => {
  try {
    const oferta = await Oferta.findByIdAndUpdate(
      req.params.id,
      { activa: true },
      { new: true }
    );

    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
    }

    res.status(200).json({
      mensaje: 'Oferta activada exitosamente.',
      oferta: oferta
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
    }
    console.error('Error al activar la oferta:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al activar la oferta.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/ofertas/:id/desactivar
 * @desc Desactiva una oferta
 * @access Admin
 */
exports.desactivarOferta = async (req, res) => {
  try {
    const oferta = await Oferta.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );

    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
    }

    res.status(200).json({
      mensaje: 'Oferta desactivada exitosamente.',
      oferta: oferta
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
    }
    console.error('Error al desactivar la oferta:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al desactivar la oferta.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/ofertas/producto/:productId
 * @desc Obtiene ofertas aplicables a un producto específico
 * @access Público
 */
exports.obtenerOfertasPorProducto = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Buscar ofertas que apliquen directamente al producto
    const ofertasDirectas = await Oferta.find({
      tipoOferta: 'producto',
      productosAplicables: productId,
      activa: true
    }).populate('productosAplicables', 'nombre precio imagen');

    // Buscar ofertas que apliquen a la categoría del producto
    const producto = await Producto.findById(productId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    const ofertasCategoria = await Oferta.find({
      tipoOferta: 'categoria',
      categoriasAplicables: producto.categoria,
      activa: true
    }).populate('categoriasAplicables', 'nombre');

    // Filtrar solo ofertas vigentes
    const ofertasVigentes = [...ofertasDirectas, ...ofertasCategoria].filter(oferta => oferta.estaVigente());

    res.status(200).json(ofertasVigentes);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al obtener ofertas por producto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener ofertas por producto.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/ofertas/productos-en-oferta
 * @desc Devuelve todos los productos en oferta con la información de la oferta aplicada
 * @access Público
 */
exports.obtenerProductosEnOferta = async (req, res) => {
  console.log('>>> LLEGA PETICIÓN A /api/ofertas/productos-en-oferta');
  try {
    console.log('🔎 [API] Buscando productos en oferta...');
    // Buscar todas las ofertas activas y vigentes
    const ahora = new Date();
    const ofertas = await Oferta.find({
      activa: true,
      fechaInicio: { $lte: ahora },
      fechaFin: { $gte: ahora }
    })
      .populate({
        path: 'productosAplicables',
        select: 'nombre precio imagen descripcion disponible stock categoriaId',
        populate: { path: 'categoriaId', select: 'nombre' }
      })
      .populate('categoriasAplicables', 'nombre');
    console.log('➡️ Ofertas activas y vigentes encontradas:', ofertas.length);

    // Para evitar duplicados de productos
    const productosMap = new Map();

    for (const oferta of ofertas) {
      console.log('Procesando oferta:', oferta.nombre, '| tipo:', oferta.tipoOferta);
      // Si la oferta es por producto
      if (oferta.tipoOferta === 'producto') {
        for (const producto of oferta.productosAplicables) {
          if (!producto) {
            console.warn('Producto nulo en productosAplicables de oferta:', oferta.nombre);
            continue;
          }
          if (!productosMap.has(producto._id.toString())) {
            productosMap.set(producto._id.toString(), {
              producto,
              oferta: {
                _id: oferta._id,
                nombre: oferta.nombre,
                porcentajeDescuento: oferta.porcentajeDescuento
              }
            });
          }
        }
      }
      // Si la oferta es por categoría
      if (oferta.tipoOferta === 'categoria') {
        const categoriaIds = oferta.categoriasAplicables.map(cat => cat?._id).filter(Boolean);
        console.log('Buscando productos para categorias:', categoriaIds);
        const productosCategoria = await Producto.find({
          categoriaId: { $in: categoriaIds },
          disponible: true
        }, 'nombre precio imagen descripcion disponible stock categoriaId').populate('categoriaId', 'nombre');
        for (const producto of productosCategoria) {
          if (!producto) continue;
          if (!productosMap.has(producto._id.toString())) {
            productosMap.set(producto._id.toString(), {
              producto,
              oferta: {
                _id: oferta._id,
                nombre: oferta.nombre,
                porcentajeDescuento: oferta.porcentajeDescuento
              }
            });
          }
        }
      }
    }

    const productosEnOferta = Array.from(productosMap.values()).map(({ producto, oferta }) => ({
      _id: producto._id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen: producto.imagen,
      precioOriginal: producto.precio,
      precioFinal: +(producto.precio * (1 - oferta.porcentajeDescuento / 100)).toFixed(2),
      disponible: producto.disponible,
      stock: producto.stock,
      categoria: producto.categoriaId && producto.categoriaId.nombre ? producto.categoriaId.nombre : '',
      oferta: {
        _id: oferta._id,
        nombre: oferta.nombre,
        porcentajeDescuento: oferta.porcentajeDescuento
      }
    }));
    console.log('✅ Productos en oferta encontrados:', productosEnOferta.length);
    res.status(200).json(productosEnOferta);
  } catch (error) {
    console.error('❌ Error al obtener productos en oferta:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener productos en oferta.', error: error?.message || error });
  }
};