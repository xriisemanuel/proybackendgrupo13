const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, unique: true }
}, {
  timestamps: true
});//Ej: como "Platos Principales"

module.exports = mongoose.model('Categoria', categoriaSchema);
