const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repartidorSchema = new Schema({
  usuarioId: { // Opcional: Referencia al modelo de Usuario si cada repartidor es también un usuario del sistema.
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    unique: true, // Un usuario solo puede ser un repartidor
    required: [true, 'El ID de usuario asociado es obligatorio para el repartidor.']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del repartidor es obligatorio.'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres.'],
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres.'],
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono del repartidor es obligatorio.'],
    unique: true, // El teléfono debe ser único para cada repartidor
    trim: true,
    match: [/^\+?\d{8,15}$/, 'El formato del teléfono no es válido.'], // Regex para un formato de teléfono básico
  },
  estado: { // Estado actual del repartidor (ej. 'disponible', 'en_entrega', 'ocupado', 'inactivo')
    type: String,
    enum: {
      values: ['disponible', 'en_entrega', 'fuera_de_servicio'],
      message: '"{VALUE}" no es un estado de repartidor válido. Los estados permitidos son: disponible, en_entrega, fuera_de_servicio.'
    },
    default: 'disponible',
    required: [true, 'El estado del repartidor es obligatorio.']
  },
  historialEntregas: [{ // Un array de objetos que representen entregas pasadas
    pedidoId: {
      type: Schema.Types.ObjectId,
      ref: 'Pedido', // Asumiendo que tienes un modelo Pedido
    },
    fechaEntrega: {
      type: Date,
      default: Date.now,
    },
    calificacionCliente: { // Calificación específica para esa entrega
      type: Number,
      min: 1,
      max: 5,
    },
    // Otros detalles relevantes de la entrega
  }],
  calificacionPromedio: { // Promedio de todas las calificaciones recibidas
    type: Number,
    default: 0,
    min: [0, 'La calificación promedio no puede ser negativa.'],
    max: [5, 'La calificación promedio no puede exceder 5.'],
  },
  disponible: { // Un booleano rápido para saber si puede tomar pedidos
    type: Boolean,
    default: true,
  },
});

// --- Hooks Mongoose ---

// Hook pre-save y pre-findOneAndUpdate para asegurar la consistencia de 'disponible' con 'estado'
repartidorSchema.pre('save', function(next) {
  if (this.isModified('estado') || this.isNew) {
    this.disponible = (this.estado === 'disponible');
  }
  next();
});

repartidorSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.estado !== undefined) {
    update.disponible = (update.estado === 'disponible');
  }
  next();
});

// --- Métodos de instancia ---

/**
 * Cambia el estado del repartidor y actualiza su disponibilidad.
 * @param {string} nuevoEstado - El nuevo estado ('disponible', 'en_entrega', 'fuera_de_servicio').
 * @returns {Promise<Repartidor>} El repartidor actualizado.
 */
repartidorSchema.methods.cambiarEstado = async function(nuevoEstado) {
  // Validar que el nuevoEstado sea uno de los permitidos por el enum
  const estadosValidos = repartidorSchema.path('estado').enumValues;
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error(`Estado inválido: "${nuevoEstado}". Los estados permitidos son: ${estadosValidos.join(', ')}.`);
  }

  this.estado = nuevoEstado;
  // El hook pre-save/findOneAndUpdate se encargará de actualizar 'disponible'
  await this.save();
  return this;
};

/**
 * Agrega una nueva entrada al historial de entregas y actualiza la calificación promedio.
 * @param {Object} entrega - Objeto con detalles de la entrega (pedidoId, calificacionCliente, etc.).
 * @returns {Promise<Repartidor>} El repartidor actualizado.
 */
repartidorSchema.methods.registrarEntrega = async function(entrega) {
  // Validaciones básicas para la entrega
  if (!entrega || !entrega.pedidoId) {
    throw new Error('La entrega debe tener al menos un pedidoId.');
  }
  if (entrega.calificacionCliente !== undefined && (entrega.calificacionCliente < 1 || entrega.calificacionCliente > 5)) {
    throw new Error('La calificación del cliente debe estar entre 1 y 5.');
  }

  this.historialEntregas.push({
    pedidoId: entrega.pedidoId,
    fechaEntrega: entrega.fechaEntrega || Date.now(),
    calificacionCliente: entrega.calificacionCliente,
  });

  // Recalcular calificación promedio si se proporcionó una calificación
  if (entrega.calificacionCliente !== undefined) {
    const calificacionesValidas = this.historialEntregas
      .filter(item => item.calificacionCliente !== undefined)
      .map(item => item.calificacionCliente);

    if (calificacionesValidas.length > 0) {
      const sumaCalificaciones = calificacionesValidas.reduce((sum, current) => sum + current, 0);
      this.calificacionPromedio = sumaCalificaciones / calificacionesValidas.length;
    } else {
      this.calificacionPromedio = 0;
    }
  }

  await this.save();
  return this;
};


const Repartidor = mongoose.model('Repartidor', repartidorSchema);

module.exports = Repartidor;