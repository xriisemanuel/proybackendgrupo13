const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Rol = require('./rol'); // Asegúrate de que la ruta sea correcta
const Cliente = require('./cliente.model'); // Asegúrate de que la ruta sea correcta
const Repartidor = require('./Repartidor'); // Asegúrate de que la ruta sea correcta

const usuarioSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Asegura que no haya usernames duplicados
    trim: true, // Elimina espacios en blanco al inicio y al final
    lowercase: true, // Guarda el username en minúsculas
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Mantenemos unique para email, ya que cada usuario debe tener un email único
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/, // Validación básica de formato de email
  },
  telefono: {
    type: String,
    trim: true,
    required: false, // <--- ¡CRÍTICO! Ahora es opcional para que coincida con el frontend si no es requerido.
    match: /^\+?[1-9]\d{1,14}$/, // Validación básica de formato de teléfono (E.164)
  },
  estado: {
    type: Boolean,
    default: true, // Por defecto, el usuario está activo
  },
  rolId: { // Nombre del rol del usuario, puede ser un string o una referencia a un modelo de Rol
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rol', // Referencia al modelo de Rol
    required: true,
  },
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
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente', // Referencia a un modelo de Cliente (si existe)
    //default: null, // Opcional, si el usuario puede no estar asociado a un cliente específico
    unique: true, // Un usuario solo puede tener un perfil de cliente
    sparse: true // <--- ¡CRÍTICO! Permite valores nulos para unique en este campo
  },
  repartidorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repartidor', // Referencia a un modelo de Repartidor
    //default: null, // Opcional, si el usuario puede no estar asociado a un repartidor específico
    unique: true, // Un usuario solo puede tener un perfil de repartidor
    sparse: true // <--- ¡CRÍTICO! Permite valores nulos para unique en este campo
  },
  fotoPerfil: {
    type: String,
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' // URL de una imagen de perfil por defecto
  }
}, {
  timestamps: true // Esto añade campos `createdAt` y `updatedAt` automáticamente
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresada) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(passwordIngresada, this.password);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
