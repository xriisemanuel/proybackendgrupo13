const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ofertaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la oferta es obligatorio.'],
    unique: true,
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
  porcentajeDescuento: {
    type: Number,
    required: [true, 'El porcentaje de descuento es obligatorio.'],
    min: [1, 'El descuento debe ser al menos 1%.'],
    max: [99, 'El descuento no puede exceder el 99%.'],
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio de la oferta es obligatoria.'],
    default: Date.now,
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin de la oferta es obligatoria.'],
  },
  tipoOferta: {
    type: String,
    enum: ['producto', 'categoria'],
    required: [true, 'El tipo de oferta es obligatorio (producto o categoria).'],
  },
  productosAplicables: [{
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    default: [],
  }],
  categoriasAplicables: [{
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    default: [],
  }],
  activa: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true
});

// Validaciones a nivel de esquema
ofertaSchema.path('fechaFin').validate(function(value) {
  return this.fechaInicio <= value;
}, 'La fecha de fin de la oferta debe ser posterior o igual a la fecha de inicio.');

// Métodos de instancia
ofertaSchema.methods.estaVigente = function() {
  const ahora = new Date();
  return this.activa && (this.fechaInicio <= ahora) && (this.fechaFin >= ahora);
};

ofertaSchema.methods.aplicarDescuento = function(precioOriginal) {
  if (precioOriginal < 0) {
    throw new Error('El precio original no puede ser negativo.');
  }
  return precioOriginal * (1 - (this.porcentajeDescuento / 100));
};

ofertaSchema.methods.calcularDescuento = function(precioOriginal) {
  return precioOriginal * (this.porcentajeDescuento / 100);
};

const Oferta = mongoose.model('Oferta', ofertaSchema);

module.exports = Oferta;