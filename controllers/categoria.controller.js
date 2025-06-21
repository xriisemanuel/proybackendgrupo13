const Categoria = require('../models/categoria.model');

// Crear nueva categoría
exports.crearCategoria = async (req, res) => {
  try {
    const nueva = new Categoria(req.body);
    const guardada = await nueva.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear categoría', error });
  }
};

// Obtener todas
exports.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error });
  }
};

// Obtener por ID
exports.obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar categoría', error });
  }
};

// Actualizar
exports.actualizarCategoria = async (req, res) => {
  try {
    const actualizada = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!actualizada) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.status(200).json(actualizada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar categoría', error });
  }
};

// Eliminar
exports.eliminarCategoria = async (req, res) => {
  try {
    const eliminada = await Categoria.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.status(200).json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría', error });
  }
};
