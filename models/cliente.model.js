const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clienteSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellido: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/, // Validación básica de formato de teléfono (E.164)
    required: true, // El teléfono es obligatorio
  },
  email: {
    type: String,
    required: true,
    unique: true, // Cada email de cliente debe ser único
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/, // Validación básica de formato de email
  },
  direccion: {
    type: String,
    trim: true,
    required: true, // La dirección es obligatoria
  },
  fechaNacimiento: {
    type: Date,
    default: null, // Puede ser opcional
  },
  preferenciasAlimentarias: [{ // Array de strings
    type: String,
    trim: true,
  }],
  puntos: {
    type: Number,
    default: 0, // Los clientes empiezan con 0 puntos
    min: 0,
  },
});

// --- Métodos de instancia o estáticos para el modelo (si necesitas lógica específica) ---

// Método de instancia para calcular descuento de fidelidad
clienteSchema.methods.calcularDescuentoFidelidad = function() {
  // Ejemplo: 10% de descuento por cada 1000 puntos
  if (this.puntos >= 1000) {
    const porcentajeDescuento = Math.floor(this.puntos / 1000) * 0.10; // 10% por cada 1000 puntos
    return Math.min(porcentajeDescuento, 0.50); // Limita el descuento máximo al 50%
  }
  return 0; // Sin descuento
};

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;