// models/Venta.js
const mongoose = require('mongoose');

const VentaSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  importeTotal: {
    type: Number,
    required: true
  },
  formaPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'mercadoPago'],
    required: true
  }
});

module.exports = mongoose.model('Venta', VentaSchema);

//🔍 Explicación:
//Cada venta está asociada a un cliente por su clienteId.
//La fecha se guarda automáticamente.
//importeTotal es obligatorio.
//formaPago está restringida a opciones válidas.