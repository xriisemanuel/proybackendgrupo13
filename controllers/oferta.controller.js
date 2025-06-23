const Oferta = require('../models/Oferta');
const Producto = require('../models/producto'); // Para validar productos
const Categoria = require('../models/categoria.model'); // Para validar categorías

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/ofertas
 * @desc Crea una nueva oferta
 * @access Admin
 */
exports.crearOferta = async (req, res) => {
  try {
    const { nombre, descripcion, descuento, fechaInicio, fechaFin, productosAplicables, categoriasAplicables } = req.body;

    // Validar productosAplicables si se proporcionan
    if (productosAplicables && productosAplicables.length > 0) {
      const productosExistentes = await Producto.countDocuments({ _id: { $in: productosAplicables } });
      if (productosExistentes !== productosAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de productos aplicables no son válidos.' });
      }
    }

    // Validar categoriasAplicables si se proporcionan
    if (categoriasAplicables && categoriasAplicables.length > 0) {
      const categoriasExistentes = await Categoria.countDocuments({ _id: { $in: categoriasAplicables } });
      if (categoriasExistentes !== categoriasAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de categorías aplicables no son válidos.' });
      }
    }
    
    const nuevaOferta = new Oferta({
      nombre,
      descripcion,
      descuento,
      fechaInicio: fechaInicio || Date.now(), // Usa la fecha actual si no se proporciona
      fechaFin,
      productosAplicables: productosAplicables || [],
      categoriasAplicables: categoriasAplicables || [],
      activa: true, // Las ofertas se crean activas por defecto
    });

    await nuevaOferta.save();

    res.status(201).json({
      mensaje: 'Oferta creada exitosamente.',
      oferta: nuevaOferta
    });
  } catch (error) {
    if (error.code === 11000) { // Error de clave duplicada (nombre único)
      return res.status(409).json({ mensaje: 'Ya existe una oferta con este nombre.', detalle: error.message });
    }
    if (error.name === 'ValidationError') { // Errores de validación de Mongoose
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
 * @queryParam activa (boolean): true para activas, false para inactivas
 * @queryParam vigente (boolean): true para ofertas actualmente vigentes
 */
exports.obtenerOfertas = async (req, res) => {
  try {
    const query = {};
    if (req.query.activa !== undefined) {
      query.activa = req.query.activa === 'true';
    }

    let ofertas = await Oferta.find(query)
      .populate('productosAplicables', 'nombre precio') // Popula nombre y precio de productos
      .populate('categoriasAplicables', 'nombre') // Popula nombre de categorías
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
    const oferta = await Oferta.findById(req.params.id)
      .populate('productosAplicables', 'nombre precio')
      .populate('categoriasAplicables', 'nombre');

    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
    }
    res.status(200).json(oferta);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
    }
    console.error('Error al obtener oferta por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener oferta.',
      error: error.message
    });
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

    // Validar productosAplicables si se actualizan
    if (updateData.productosAplicables) {
      if (!Array.isArray(updateData.productosAplicables)) {
        return res.status(400).json({ mensaje: 'productosAplicables debe ser un array.' });
      }
      const productosExistentes = await Producto.countDocuments({ _id: { $in: updateData.productosAplicables } });
      if (productosExistentes !== updateData.productosAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de productos aplicables no son válidos.' });
      }
    }

    // Validar categoriasAplicables si se actualizan
    if (updateData.categoriasAplicables) {
      if (!Array.isArray(updateData.categoriasAplicables)) {
        return res.status(400).json({ mensaje: 'categoriasAplicables debe ser un array.' });
      }
      const categoriasExistentes = await Categoria.countDocuments({ _id: { $in: updateData.categoriasAplicables } });
      if (categoriasExistentes !== updateData.categoriasAplicables.length) {
        return res.status(400).json({ mensaje: 'Uno o más IDs de categorías aplicables no son válidos.' });
      }
    }

    const ofertaActualizada = await Oferta.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!ofertaActualizada) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada para actualizar.' });
    }
    res.status(200).json({
      mensaje: 'Oferta actualizada exitosamente.',
      oferta: ofertaActualizada
    });
  } catch (error) {
    if (error.code === 11000) { // Error de clave duplicada (nombre único)
      return res.status(409).json({ mensaje: 'Ya existe otra oferta con el nombre proporcionado.', detalle: error.message });
    }
    if (error.name === 'ValidationError') { // Errores de validación de Mongoose
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
      mensaje: 'Oferta eliminada exitosamente.'
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
        const { id } = req.params;
        const oferta = await Oferta.findById(id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
        }
        if (oferta.activa) {
            return res.status(200).json({ mensaje: 'La oferta ya está activa.', oferta });
        }
        oferta.activa = true;
        await oferta.save();
        res.status(200).json({ mensaje: 'Oferta activada exitosamente.', oferta });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
        }
        console.error('Error al activar oferta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al activar oferta.', error: error.message });
    }
};

/**
 * @route PATCH /api/ofertas/:id/desactivar
 * @desc Desactiva una oferta
 * @access Admin
 */
exports.desactivarOferta = async (req, res) => {
    try {
        const { id } = req.params;
        const oferta = await Oferta.findById(id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
        }
        if (!oferta.activa) {
            return res.status(200).json({ mensaje: 'La oferta ya está inactiva.', oferta });
        }
        oferta.activa = false;
        await oferta.save();
        res.status(200).json({ mensaje: 'Oferta desactivada exitosamente.', oferta });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de oferta inválido.', detalle: error.message });
        }
        console.error('Error al desactivar oferta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al desactivar oferta.', error: error.message });
    }
};

/**
 * @route GET /api/ofertas/producto/:productId
 * @desc Obtiene todas las ofertas vigentes aplicables a un producto específico.
 * @access Público
 */
exports.obtenerOfertasPorProducto = async (req, res) => {
  try {
    const { productId } = req.params;

    // Primero, encontrar el producto para obtener su categoría
    const producto = await Producto.findById(productId).select('categoriaId');
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    const ahora = new Date();
    // Buscar ofertas que cumplan:
    // 1. Estén activas
    // 2. Sean vigentes (fechaInicio <= ahora <= fechaFin)
    // 3. Apliquen al producto específico O a la categoría del producto
    const ofertasAplicables = await Oferta.find({
      activa: true,
      fechaInicio: { $lte: ahora },
      fechaFin: { $gte: ahora },
      $or: [
        { productosAplicables: productId },
        { categoriasAplicables: producto.categoriaId }
      ]
    }).populate('productosAplicables', 'nombre').populate('categoriasAplicables', 'nombre');

    res.status(200).json({
      mensaje: `Ofertas vigentes para el producto "${productId}".`,
      ofertas: ofertasAplicables
    });
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