const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ofertaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la oferta es obligatorio.'],
    unique: true, // Cada oferta debe tener un nombre único
    trim: true,
    minlength: [3, 'El nombre de la oferta debe tener al menos 3 caracteres.'],
    maxlength: [100, 'El nombre de la oferta no puede exceder los 100 caracteres.'],
  },
  descripcion: {
    type: String,
    trim: true,
    default: null,
    maxlength: [500, 'La descripción de la oferta no puede exceder los 500 caracteres.'],
  },
  descuento: { // Porcentaje de descuento (ej. 10 para 10%)
    type: Number,
    required: [true, 'El porcentaje de descuento es obligatorio.'],
    min: [0, 'El descuento no puede ser negativo.'],
    max: [100, 'El descuento no puede exceder el 100%.'],
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio de la oferta es obligatoria.'],
    default: Date.now, // Por defecto, la oferta inicia ahora
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin de la oferta es obligatoria.'],
  },
  productosAplicables: [{ // IDs de productos específicos a los que aplica la oferta
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    default: [], // Por defecto, un array vacío
  }],
  categoriasAplicables: [{ // IDs de categorías a las que aplica la oferta
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    default: [], // Por defecto, un array vacío
  }],
  imagen: { // URL de la imagen representativa del combo
    type: String,
    trim: true,
    default: null,
  },
  estado: { // Indica si la oferta está activa y vigente
    type: Boolean,
    default: true,
  },
});

// --- Validaciones a nivel de esquema ---
ofertaSchema.path('fechaFin').validate(function(value) {
  if (!this.fechaInicio) return true; // Si no hay fechaInicio, no validar
  return this.fechaInicio <= value;
}, 'La fecha de fin de la oferta debe ser posterior o igual a la fecha de inicio.');

// --- Métodos de instancia ---

/**
 * Verifica si la oferta está actualmente activa (dentro de su rango de fechas y marcada como 'activa').
 * @returns {boolean} True si la oferta está vigente, false en caso contrario.
 */
ofertaSchema.methods.estaVigente = function() {
  const ahora = new Date();
  return this.estado && (this.fechaInicio <= ahora) && (this.fechaFin >= ahora);
};

/**
 * Aplica el descuento de la oferta a un precio dado.
 * @param {Number} precioOriginal - El precio original al que se aplicará el descuento.
 * @returns {Number} El precio con el descuento aplicado.
 */
ofertaSchema.methods.aplicarDescuento = function(precioOriginal) {
  if (precioOriginal < 0) {
    throw new Error('El precio original no puede ser negativo.');
  }
  return precioOriginal * (1 - (this.descuento / 100));
};

const Oferta = mongoose.model('Oferta', ofertaSchema);

module.exports = Oferta;