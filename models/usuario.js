const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Rol = require('../models/rol'); // Asegúrate de que el modelo Rol esté definido correctamente
const Cliente = require('../models/cliente.model'); // Asegúrate de que el modelo Cliente esté definido correctamente

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
    unique: true, // Asegura que no haya emails duplicados
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/, // Validación básica de formato de email
  },
  telefono: {
    type: String,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/, // Validación básica de formato de teléfono (E.164)
    required: true,
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
    default: null, // Opcional, si el usuario puede no estar asociado a un cliente específico
  },
});

// --- Métodos de Instancia o Estáticos para el modelo (si necesitas lógica compleja aquí) ---
// Por ejemplo, para encriptar la contraseña antes de guardar (pre-save hook)
usuarioSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const bcrypt = require('bcryptjs'); // Necesitas instalar bcryptjs: npm install bcryptjs
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresada) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(passwordIngresada, this.password);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
