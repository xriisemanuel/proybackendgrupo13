const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Esquema para el Subdocumento CalificacionProducto ---
// Para calificar productos específicos dentro de un pedido
const calificacionProductoSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto', // Referencia al modelo Producto
    required: true,
  },
  nombreProducto: { // Para referencia, en caso de que el nombre del producto cambie
    type: String,
    required: true,
    trim: true,
  },
  puntuacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5, // Típicamente una escala de 1 a 5 estrellas
  },
  comentario: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  _id: false, // Los subdocumentos no necesitan su propio _id por defecto
  timestamps: false,
});

// --- Esquema del Modelo Principal Calificacion ---
const calificacionSchema = new Schema({
  pedidoId: {
    type: Schema.Types.ObjectId,
    ref: 'Pedido', // Referencia al pedido que se está calificando
    required: true,
    unique: true, // Generalmente, solo una calificación por pedido
  },
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente', // Referencia al cliente que realiza la calificación
    required: true,
  },
  puntuacionComida: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  puntuacionServicio: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  puntuacionEntrega: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comentario: {
    type: String,
    trim: true,
    default: null,
    maxlength: 500, // Limitar longitud del comentario
  },
  fechaCalificacion: {
    type: Date,
    default: Date.now,
    required: true,
  },
  // Array de subdocumentos para calificaciones de productos específicos
  calificacionProductos: [calificacionProductoSchema],
});

// --- Métodos de instancia o estáticos (opcionales) ---

// Método para calcular la puntuación promedio general (opcional)
calificacionSchema.methods.calcularPuntuacionPromedio = function() {
  const sum = this.puntuacionComida + this.puntuacionServicio + this.puntuacionEntrega;
  let count = 3;
  
  if (this.calificacionProductos && this.calificacionProductos.length > 0) {
    let productosSum = 0;
    this.calificacionProductos.forEach(cp => {
      productosSum += cp.puntuacion;
    });
    return (sum + productosSum) / (count + this.calificacionProductos.length);
  }
  return sum / count;
};

// Se puede añadir un hook para, por ejemplo, actualizar la puntuación promedio del producto
// cada vez que un producto es calificado, pero eso sería más complejo y podría requerir
// un servicio o función separada para desacoplar responsabilidades.
// Por ahora, el cálculo del promedio es a nivel de instancia de la Calificación.

const Calificacion = mongoose.model('Calificacion', calificacionSchema);

module.exports = Calificacion;