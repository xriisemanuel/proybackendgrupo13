const DetalleProducto = require('../models/detalleProducto'); // Modelo Mongoose
const detalleProductoController = {}; // Objeto para los métodos del controlador

// 1. Crear Detalle de Producto
detalleProductoController.crearDetalleProducto = async (req, res) => {
  try {
    const nuevoDetalle = new DetalleProducto(req.body);
    await nuevoDetalle.save();
    res.status(201).json({ mensaje: 'Detalle de producto creado exitosamente', detalle: nuevoDetalle });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear detalle de producto', error: error.message });
  }
};

// 2. Listar todos los Detalles
detalleProductoController.getDetalleProducto = async (req, res) => {
  try {
    const detalles = await DetalleProducto.find();
    res.status(200).json(detalles);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener detalles de productos', error: error.message });
  }
};

// 3. Obtener Detalle por ID
detalleProductoController.getDetalleProductoId = async (req, res) => {
  try {
    const detalle = await DetalleProducto.findById(req.params.id);
    if (!detalle) {
      return res.status(404).json({ mensaje: 'Detalle no encontrado' });
    }
    res.status(200).json(detalle);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar detalle', error: error.message });
  }
};

// 4. Modificar Detalle (requiere token)
detalleProductoController.editDetalleProducto = async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    const actualizado = await DetalleProducto.findByIdAndUpdate(_id, data, { new: true });
    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Detalle no encontrado para modificar' });
    }
    res.status(200).json({ mensaje: 'Detalle actualizado con éxito', detalle: actualizado });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar detalle', error: error.message });
  }
};

// 5. Eliminar Detalle (requiere token)
detalleProductoController.deleteDetalleProducto = async (req, res) => {
  try {
    const eliminado = await DetalleProducto.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Detalle no encontrado para eliminar' });
    }
    res.status(200).json({ mensaje: 'Detalle eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar detalle', error: error.message });
  }
};

module.exports = detalleProductoController;
