const Producto = require('../models/producto'); // Asumo 'producto.model.js'
const Categoria = require('../models/categoria.model'); // Necesario para validar la categoría

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/productos
 * @desc Crea un nuevo producto
 * @access Admin
 */
exports.createProducto = async (req, res) => {
  // Solo el Administrador puede crear productos
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden crear productos.' });
  }

  try {
    // Elimino 'disponible' de la desestructuración de req.body,
    // ya que debería ser calculado por el hook pre-save del modelo basado en el stock.
    const { nombre, descripcion, precio, categoriaId, imagenes, stock, popularidad } = req.body;

    // 1. Verificar si la categoría existe
    const categoria = await Categoria.findById(categoriaId);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }

    // 2. Crear el nuevo producto
    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      categoriaId,
      imagenes: imagenes || [], // Asegura que 'imagenes' sea un array vacío si no se proporciona
      stock,
      popularidad: popularidad || 0,
      // 'disponible' no se pasa aquí, se establecerá automáticamente por el hook pre-save del modelo según el 'stock'.
    });

    await nuevoProducto.save();

    res.status(201).json({
      mensaje: 'Producto creado exitosamente.',
      producto: nuevoProducto
    });
  } catch (error) {
    // Error de clave duplicada (nombre único)
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe un producto con este nombre.', detalle: error.message });
    }
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al crear el producto.', detalle: error.message });
    }
    console.error('Error al crear el producto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear el producto.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/productos
 * @desc Obtiene todos los productos (opcionalmente filtrados por disponibilidad o categoría)
 * @access Público (Clientes y otros roles pueden ver)
 * @queryParam disponible (boolean): true para disponibles, false para no disponibles
 * @queryParam categoria (string): ID de la categoría
 */
exports.getProductos = async (req, res) => {
  // Esta función es pública para Clientes y otros roles que necesitan ver el catálogo.
  // No se requiere una verificación de rol aquí, ya que el middleware `autenticar` ya se aseguró de que el usuario esté logueado
  // si la ruta en `index.js` está protegida. Si la ruta es completamente pública, no debería tener `autenticar` en `index.js`.
  // Según la narrativa, el cliente puede navegar por los productos, por lo tanto, esta ruta puede ser accesible para todos los usuarios autenticados.
  try {
    const query = {};
    if (req.query.disponible !== undefined) {
      query.disponible = req.query.disponible === 'true';
    }
    if (req.query.categoria) {
      query.categoriaId = req.query.categoria;
    }

    const productos = await Producto.find(query)
      .populate('categoriaId', 'nombre') // Popula solo el nombre de la categoría
      .sort({ nombre: 1 }); // Ordenar por nombre por defecto

    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al listar productos.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/productos/:id
 * @desc Obtiene un producto por su ID
 * @access Público (Clientes y otros roles pueden ver)
 */
exports.getProducto = async (req, res) => {
  // Similar a getProductos, esta función es pública para visualización.
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoriaId', 'nombre');
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json(producto);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener producto.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/productos/categoria/:categoriaId
 * @desc Obtiene productos por el ID de la categoría (método alternativo o específico)
 * @access Público (Clientes y otros roles pueden ver)
 */
exports.getProductoPorCategoria = async (req, res) => {
  // Similar a getProductos, esta función es pública para visualización.
  try {
    const { categoriaId } = req.params;

    // Opcional: verificar que la categoría existe para dar un mejor error si el ID no corresponde a ninguna
    const categoria = await Categoria.findById(categoriaId);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada para el ID proporcionado.' });
    }

    const productos = await Producto.find({ categoriaId: categoriaId, disponible: true })
      .populate('categoriaId', 'nombre');
    res.status(200).json({
      mensaje: `Productos en la categoría "${categoria.nombre}".`,
      productos: productos
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener productos por categoría.',
      error: error.message
    });
  }
};


/**
 * @route PUT /api/productos/:id
 * @desc Actualiza un producto existente por su ID
 * @access Admin
 */
exports.editProducto = async (req, res) => {
  // Solo el Administrador puede actualizar productos
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden actualizar productos.' });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;

    // Elimino 'disponible' de updateData si se envía,
    // ya que debería ser calculado por el hook pre-save del modelo basado en el stock.
    if (updateData.hasOwnProperty('disponible')) {
      delete updateData.disponible;
    }

    // Si se intenta cambiar la categoría, verificar que la nueva categoría exista
    if (updateData.categoriaId) {
      const categoria = await Categoria.findById(updateData.categoriaId);
      if (!categoria) {
        return res.status(404).json({ mensaje: 'La categoría proporcionada no existe.' });
      }
    }

    // El hook pre-findOneAndUpdate del modelo manejará el ajuste de 'disponible' si 'stock' es actualizado.

    const productoActualizado = await Producto.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Ejecuta las validaciones del esquema
    });

    if (!productoActualizado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar.' });
    }
    res.status(200).json({
      mensaje: 'Producto actualizado exitosamente.',
      producto: productoActualizado
    });
  } catch (error) {
    if (error.code === 11000) { // Error de clave duplicada (nombre único)
      return res.status(409).json({ mensaje: 'Ya existe otro producto con el nombre proporcionado.', detalle: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al actualizar el producto.', detalle: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar el producto.',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/productos/:id
 * @desc Elimina un producto por su ID
 * @access Admin
 */
exports.deleteProducto = async (req, res) => {
  // Solo el Administrador puede eliminar productos
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden eliminar productos.' });
  }

  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para eliminar.' });
    }
    res.status(200).json({
      mensaje: 'Producto eliminado exitosamente.'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar el producto.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/productos/:id/disponibilidad
 * @desc Verifica la disponibilidad de un producto (stock > 0 y estado activo)
 * @access Público
 */
exports.verificarDisponibilidadProducto = async (req, res) => {
  // Esta función es pública para visualización de disponibilidad.
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    const disponible = producto.disponible; // Asumimos que 'disponible' ya se calcula en el modelo basado en el stock
    res.status(200).json({
      mensaje: 'Disponibilidad verificada.',
      disponible: disponible,
      stockActual: producto.stock
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al verificar la disponibilidad del producto.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/productos/:id/stock
 * @desc Actualiza el stock de un producto (aumenta o disminuye)
 * @body {number} cantidad - Cantidad a añadir (positiva) o restar (negativa).
 * @access Admin
 */
exports.actualizarStockProducto = async (req, res) => {
  // Solo el Administrador puede actualizar el stock
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden actualizar el stock de productos.' });
  }
  try {
    const { id } = req.params;
    const { cantidad } = req.body; // Cantidad a añadir (positiva) o restar (negativa)

    if (cantidad === undefined || typeof cantidad !== 'number' || cantidad === 0) {
      return res.status(400).json({ mensaje: 'La cantidad a actualizar debe ser un número válido (distinto de cero).' });
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    // Aquí el stock se actualiza directamente y la disponibilidad se recalcula
    producto.stock += cantidad;
    producto.disponible = producto.stock > 0; // Actualiza disponibilidad en base al nuevo stock
    await producto.save(); // Esto también dispararía el hook pre-save si existe

    res.status(200).json({
      mensaje: 'Stock actualizado exitosamente.',
      producto: producto, // Devuelve el producto con el stock y disponibilidad actualizados
      nuevoStock: producto.stock // Proporciona el nuevo stock directamente
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.', detalle: error.message });
    }
    console.error('Error al actualizar stock:', error);
    res.status(500).json({
      mensaje: error.message || 'Error interno del servidor al actualizar el stock del producto.',
      error: error.message
    });
  }
};

// Puedes añadir una ruta para aumentar la popularidad si la lógica es sencilla
exports.aumentarPopularidad = async (req, res) => {
  // Considera si la popularidad es solo para admin o se actualiza automáticamente.
  // Si se actualiza por interacción del usuario (ej. compra), no debería estar restringida al admin.
  // Si es solo para gestión interna, entonces sí. Asumo gestión interna por ahora.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden modificar la popularidad directamente.' });
  }
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndUpdate(id, { $inc: { popularidad: 1 } }, { new: true });
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Popularidad actualizada.', producto: producto });
  } catch (error) {
    console.error('Error al aumentar popularidad:', error);
    res.status(500).json({ mensaje: 'Error al aumentar la popularidad del producto.', error: error.message });
  }
};
