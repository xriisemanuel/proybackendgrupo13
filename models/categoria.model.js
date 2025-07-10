const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categoriaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio.'],
    unique: true, // El nombre de la categoría debe ser único
    trim: true,
    minlength: [2, 'El nombre de la categoría debe tener al menos 2 caracteres.'],
    maxlength: [50, 'El nombre de la categoría no puede exceder los 50 caracteres.'],
  },
  descripcion: {
    type: String,
    trim: true,
    default: null,
    maxlength: [200, 'La descripción de la categoría no puede exceder los 200 caracteres.'],
  },
  imagen: { // URL de la imagen de la categoría (ej. icono representativo)
    type: String,
    trim: true,
    default: null,
    maxlength: [2048, 'La URL de la imagen no puede exceder los 2048 caracteres.'],
    // Puedes añadir una validación regex para URL si es necesario
  },
  estado: { // Indica si la categoría está activa/visible. False para inactiva/archivada.
    type: Boolean,
    default: true,
  },
});

// --- Métodos de instancia ---

/**
 * Método de instancia para activar una categoría.
 * @returns {Promise<Categoria>} La categoría actualizada.
 */
categoriaSchema.methods.activar = async function() {
  if (this.estado === false) {
    this.estado = true;
    await this.save();
  }
  return this;
};

/**
 * Método de instancia para desactivar una categoría.
 * @returns {Promise<Categoria>} La categoría actualizada.
 */
categoriaSchema.methods.desactivar = async function() {
  if (this.estado === true) {
    this.estado = false;
    await this.save();
  }
  return this;
};

const Categoria = mongoose.model('Categoria', categoriaSchema);

module.exports = Categoria;