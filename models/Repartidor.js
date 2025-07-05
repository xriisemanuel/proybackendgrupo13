const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repartidorSchema = new Schema({
  usuarioId: { // Enlace al usuario que tiene el rol de "repartidor"
    type: Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo de Usuario
    unique: true, // Un usuario solo puede tener un perfil de repartidor
    required: [true, 'El ID de usuario asociado es obligatorio para el perfil de repartidor.']
  },
  // Los campos 'nombre', 'apellido', 'telefono', 'email' NO se duplican aquí.
  // Se obtendrán del modelo 'Usuario' a través de la referencia 'usuarioId' cuando sea necesario.

  estado: { // Estado actual del repartidor (ej. 'disponible', 'en_entrega', 'fuera_de_servicio')
    type: String,
    enum: {
      values: ['disponible', 'en_entrega', 'fuera_de_servicio'],
      message: '"{VALUE}" no es un estado de repartidor válido. Los estados permitidos son: disponible, en_entrega, fuera_de_servicio.'
    },
    default: 'disponible',
    required: [true, 'El estado del repartidor es obligatorio.']
  },
  vehiculo: { // Campo específico del repartidor
    type: String,
    trim: true,
    default: '',
  },
  numeroLicencia: { // Campo específico del repartidor
    type: String,
    trim: true,
    default: '',
  },
  ubicacionActual: { // Objeto para almacenar la latitud y longitud actual del repartidor
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
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
repartidorSchema.pre('save', function (next) {
  if (this.isModified('estado') || this.isNew) {
    this.disponible = (this.estado === 'disponible');
  }
  next();
});

repartidorSchema.pre('findOneAndUpdate', function (next) {
  // `this` en un hook de findOneAndUpdate es la query, no el documento.
  // Usamos `this.getUpdate()` para obtener los datos que se están actualizando.
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
repartidorSchema.methods.cambiarEstado = async function (nuevoEstado) {
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
 * @param {Object} entrega - Objeto con detalles de la entrega (pedidoId, calificacionCliente, fechaEntrega).
 * @returns {Promise<Repartidor>} El repartidor actualizado.
 */
repartidorSchema.methods.registrarEntrega = async function (entrega) {
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
