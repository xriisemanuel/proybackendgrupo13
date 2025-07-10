const Categoria = require('../models/categoria.model');
const Producto = require('../models/producto'); // Necesario para la verificación de productos asociados

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/categorias
 * @desc Crea una nueva categoría
 * @access Admin
 */
exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen, estado } = req.body;

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen,
      // 'estado' se establece si se provee, de lo contrario, el default del esquema (true) se aplica
      estado: estado !== undefined ? estado : true,
    });

    await nuevaCategoria.save();

    res.status(201).json({
      mensaje: 'Categoría creada exitosamente.',
      categoria: nuevaCategoria
    });
  } catch (error) {
    // Error de clave duplicada (nombre único)
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe una categoría con este nombre.', detalle: error.message });
    }
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al crear la categoría.', detalle: error.message });
    }
    console.error('Error al crear la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear la categoría.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/categorias
 * @desc Obtiene todas las categorías (opcionalmente filtradas por estado)
 * @access Público
 * @queryParam estado (boolean): true para activas, false para inactivas
 */
exports.obtenerCategorias = async (req, res) => {
  try {
    const query = {};
    // Si se proporciona el parámetro 'estado' en la URL, se aplica el filtro
    if (req.query.estado !== undefined) {
      query.estado = req.query.estado === 'true'; // Convierte el string "true"/"false" a booleano
    }

    const categorias = await Categoria.find(query).sort({ nombre: 1 }); // Ordenar por nombre
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener categorías.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/categorias/:id
 * @desc Obtiene una categoría por su ID
 * @access Público
 */
exports.obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }
    res.status(200).json(categoria);
  } catch (error) {
    // Si el ID no es un ObjectId válido, Mongoose lanza un CastError
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al obtener categoría por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener categoría.',
      error: error.message
    });
  }
};

/**
 * @route PUT /api/categorias/:id
 * @desc Actualiza una categoría existente por su ID
 * @access Admin
 */
exports.actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Los datos a actualizar

    const categoriaActualizada = await Categoria.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Ejecuta las validaciones del esquema en la actualización
    });

    if (!categoriaActualizada) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada para actualizar.' });
    }
    res.status(200).json({
      mensaje: 'Categoría actualizada exitosamente.',
      categoria: categoriaActualizada
    });
  } catch (error) {
    // Error de clave duplicada (nombre único)
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe otra categoría con el nombre proporcionado.', detalle: error.message });
    }
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación al actualizar la categoría.', detalle: error.message });
    }
    // Si el ID no es un ObjectId válido
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al actualizar la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar la categoría.',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/categorias/:id
 * @desc Elimina una categoría por su ID
 * @access Admin
 */
exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la categoría para verificar su estado
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada para eliminar.' });
    }

    // Verificar si hay productos asociados
    const productosAsociados = await Producto.countDocuments({ categoriaId: id });
    
    if (productosAsociados > 0) {
      return res.status(400).json({
        mensaje: `No se puede eliminar. Hay ${productosAsociados} productos asociados.`,
        sugerencia: 'Reasigne los productos a otra categoría primero.'
      });
    }

    // Si la categoría está activa y no tiene productos, sugerir desactivarla primero
    if (categoria.estado === true) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar una categoría activa.',
        sugerencia: 'Desactive la categoría primero, luego elimínela.'
      });
    }

    const categoriaEliminada = await Categoria.findByIdAndDelete(id);
    res.status(200).json({
      mensaje: 'Categoría eliminada exitosamente.'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar la categoría.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/categorias/:id/productos
 * @desc Obtiene todos los productos asociados a una categoría específica
 * @access Público
 */
exports.obtenerProductosDeCategoria = async (req, res) => {
  try {
    const { id } = req.params; // ID de la categoría

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }

    // Busca productos que pertenezcan a esta categoría y que estén disponibles
    const productos = await Producto.find({ categoriaId: id, disponible: true });
    res.status(200).json({
      mensaje: `Productos de la categoría "${categoria.nombre}" (${productos.length} encontrados).`,
      productos: productos
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al obtener productos de la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener productos de la categoría.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/categorias/:id/activar
 * @desc Activa una categoría (cambia su estado a true)
 * @access Admin
 */
exports.activarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }

    await categoria.activar(); // Usa el método de instancia definido en el modelo
    res.status(200).json({
      mensaje: 'Categoría activada exitosamente.',
      categoria: categoria
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al activar la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al activar la categoría.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/categorias/:id/desactivar
 * @desc Desactiva una categoría (cambia su estado a false)
 * @access Admin
 */
exports.desactivarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }

    // Verificar si hay productos asociados antes de desactivar
    const productosAsociados = await Producto.countDocuments({ categoriaId: id });
    if (productosAsociados > 0) {
      return res.status(400).json({
        mensaje: `No se puede desactivar. Hay ${productosAsociados} productos asociados.`,
        sugerencia: 'Reasigne los productos a otra categoría primero.'
      });
    }

    await categoria.desactivar(); // Usa el método de instancia definido en el modelo
    res.status(200).json({
      mensaje: 'Categoría desactivada exitosamente.',
      categoria: categoria
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.', detalle: error.message });
    }
    console.error('Error al desactivar la categoría:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al desactivar la categoría.',
      error: error.message
    });
  }
};