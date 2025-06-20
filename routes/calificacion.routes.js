// routes/calificacion.routes.js
const express = require('express');
const router = express.Router();
const {
  crearCalificacion,
  obtenerCalificaciones,
  actualizarCalificacion,
  eliminarCalificacion
} = require('../controllers/calificacion.controller');

// Ruta base: /api/calificaciones

// Crear una nueva calificación
router.post('/', crearCalificacion);

// Obtener todas las calificaciones
router.get('/', obtenerCalificaciones);

// Actualizar una calificación por ID
router.put('/:id', actualizarCalificacion);

// Eliminar una calificación por ID
router.delete('/:id', eliminarCalificacion);

module.exports = router;
