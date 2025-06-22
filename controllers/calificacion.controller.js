// controllers/calificacion.controller.js
const Calificacion = require('../models/Calificacion');

// ✅ Crear una calificación
const crearCalificacion = async (req, res) => {
  try {
    const { pedidoId, puntaje, observacion } = req.body;

    // Verifica si ya existe calificación para el pedido
    const existente = await Calificacion.findOne({ pedidoId });
    if (existente) {
      return res.status(400).json({ mensaje: 'Este pedido ya fue calificado.' });
    }

    const nueva = new Calificacion({ pedidoId, puntaje, observacion });
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear calificación', error });
  }
};

// ✅ Obtener todas las calificaciones
const obtenerCalificaciones = async (req, res) => {
  try {
    const calificaciones = await Calificacion.find().populate('pedidoId');
    res.json(calificaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener calificaciones', error });
  }
};

// ✅ Actualizar una calificación
const actualizarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntaje, observacion } = req.body;

    const actualizada = await Calificacion.findByIdAndUpdate(
      id,
      { puntaje, observacion },
      { new: true }
    );

    if (!actualizada) {
      return res.status(404).json({ mensaje: 'Calificación no encontrada' });
    }

    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar calificación', error });
  }
};

// ✅ Eliminar una calificación
const eliminarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await Calificacion.findByIdAndDelete(id);

    if (!eliminada) {
      return res.status(404).json({ mensaje: 'Calificación no encontrada' });
    }

    res.json({ mensaje: 'Calificación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar calificación', error });
  }
};

module.exports = {
  crearCalificacion,
  obtenerCalificaciones,
  actualizarCalificacion,
  eliminarCalificacion
};


//📘 ¿Qué hace este archivo?
//crearCalificacion: guarda una nueva, solo si no existe ya para ese pedido.

//obtenerCalificaciones: trae todas las calificaciones.

//actualizarCalificacion: permite editar puntaje u observación.

//eliminarCalificacion: elimina una calificación por ID.
