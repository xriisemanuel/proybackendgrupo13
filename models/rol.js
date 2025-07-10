const mongoose = require('mongoose');

const rolSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // Convierte el nombre a minúsculas para evitar duplicados
    match: [/^[a-zA-Z\s]*$/,'El nombre del rol solo puede contener letras y espacios.']
  },
  estado: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Agrega campos de fecha de creación y actualización
  versionKey: false // Elimina el campo __v que Mongoose agrega por defecto
});

const Rol = mongoose.model('Rol', rolSchema);

module.exports = Rol;
