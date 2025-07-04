const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clienteSchema = new Schema({
  usuarioId: { // Enlace al usuario que tiene el rol de "cliente"
    type: Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo de Usuario
    unique: true, // Un usuario solo puede tener un perfil de cliente
    required: [true, 'El ID de usuario asociado es obligatorio para el perfil de cliente.']
  },
  // Los campos 'nombre', 'apellido', 'telefono', 'email' NO se duplican aquí.
  // Se obtendrán del modelo 'Usuario' a través de la referencia 'usuarioId' cuando sea necesario.

  direccion: {
    type: String,
    trim: true,
    required: true, // La dirección es obligatoria para el perfil de cliente
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
clienteSchema.methods.calcularDescuentoFidelidad = function () {
  // Ejemplo: 10% de descuento por cada 1000 puntos
  if (this.puntos >= 1000) {
    const porcentajeDescuento = Math.floor(this.puntos / 1000) * 0.10; // 10% por cada 1000 puntos
    return Math.min(porcentajeDescuento, 0.50); // Limita el descuento máximo al 50%
  }
  return 0; // Sin descuento
};

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;
