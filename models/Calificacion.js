//Calificacion.js Enlaza cada calificación a un Pedido por su ID.
// Asegura que el puntaje esté entre 1 y 5.
// Guarda una observación y la fecha automática.

const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema({
  pedidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  puntaje: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  observacion: {
    type: String,
    maxlength: 300
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Calificacion', CalificacionSchema);
