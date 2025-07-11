// proyecto/backend/controllers/cliente.controller.js
const Cliente = require('../models/cliente.model');
const Usuario = require('../models/usuario'); // Necesario para verificar usuarios si es necesario
const Rol = require('../models/rol'); // Necesario para verificar roles si es necesario
const bcrypt = require('bcryptjs');

/**
 * @desc Obtener todos los perfiles de clientes
 * @route GET /api/clientes
 * @access Admin
 */
exports.getClientes = async (req, res) => {
  console.log('ClienteController: Intentando obtener todos los clientes...');
  try {
    const clientes = await Cliente.find({}).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });
    console.log('ClienteController: Clientes obtenidos exitosamente. Cantidad:', clientes.length);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('ClienteController: Error al obtener clientes:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener clientes.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc Crear un nuevo perfil de cliente
 * @route POST /api/clientes
 * @access Admin
 * @body {string} usuarioId - El ID del usuario asociado (debe tener rol 'cliente')
 * @body {string} direccion
 * @body {Date} [fechaNacimiento]
 * @body {string[]} [preferenciasAlimentarias]
 * @body {number} [puntos=0]
 */
exports.createCliente = async (req, res) => {
  console.log('ClienteController: Intentando crear un nuevo cliente...');
  try {
    const { usuarioId, direccion, fechaNacimiento, preferenciasAlimentarias, puntos } = req.body;

    if (!usuarioId || !direccion) {
      return res.status(400).json({ mensaje: 'El usuarioId y la dirección son obligatorios para crear un perfil de cliente.' });
    }

    const usuarioExistente = await Usuario.findById(usuarioId).populate('rolId');
    if (!usuarioExistente) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado con el ID proporcionado.' });
    }
    if (usuarioExistente.rolId.nombre !== 'cliente') {
      return res.status(400).json({ mensaje: 'El usuario asociado debe tener el rol de "cliente".' });
    }

    const clienteExistente = await Cliente.findOne({ usuarioId });
    if (clienteExistente) {
      return res.status(400).json({ mensaje: 'Ya existe un perfil de cliente asociado a este usuario.' });
    }

    const nuevoCliente = new Cliente({
      usuarioId,
      direccion,
      fechaNacimiento: fechaNacimiento || null,
      preferenciasAlimentarias: preferenciasAlimentarias || [],
      puntos: puntos !== undefined ? puntos : 0
    });

    await nuevoCliente.save();
    console.log('ClienteController: Perfil de cliente creado exitosamente:', nuevoCliente);

    const clienteConUsuario = await Cliente.findById(nuevoCliente._id).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });

    res.status(201).json({ mensaje: 'Perfil de cliente creado exitosamente', cliente: clienteConUsuario });
  } catch (error) {
    console.error('ClienteController: Error al crear perfil de cliente:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear el perfil de cliente.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc Obtener un perfil de cliente por ID
 * @route GET /api/clientes/:id
 * @access Admin, Cliente (para su propio perfil)
 */
exports.getClienteById = async (req, res) => {
  console.log(`ClienteController: Intentando obtener cliente con ID: ${req.params.id}`);
  try {
    const cliente = await Cliente.findById(req.params.id).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });

    if (!cliente) {
      console.log(`ClienteController: Cliente con ID ${req.params.id} no encontrado.`);
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    // Lógica de autorización: un cliente solo puede ver su propio perfil
    // Un admin puede ver cualquier perfil
    if (req.usuario && req.usuario.rol === 'cliente' && cliente.usuarioId._id.toString() !== req.usuario._id.toString()) {
      console.warn(`ClienteController: Acceso denegado para usuario ${req.usuario._id} al perfil de cliente ${req.params.id}`);
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para ver este perfil de cliente.' });
    }

    console.log('ClienteController: Cliente obtenido exitosamente:', cliente);
    res.status(200).json(cliente);
  } catch (error) {
    console.error('ClienteController: Error al obtener cliente por ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    }
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener el perfil de cliente por ID.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc Actualizar un perfil de cliente por ID
 * @route PUT /api/clientes/:id
 * @access Admin, Cliente (para su propio perfil)
 * @body {string} [direccion]
 * @body {Date} [fechaNacimiento]
 * @body {string[]} [preferenciasAlimentarias]
 * @body {number} [puntos]
 * @body {string} [username] - Datos del usuario asociado
 * @body {string} [email] - Datos del usuario asociado
 * @body {string} [telefono] - Datos del usuario asociado
 * @body {string} [nombre] - Datos del usuario asociado
 * @body {string} [apellido] - Datos del usuario asociado
 */
exports.updateCliente = async (req, res) => {
  console.log(`ClienteController: Intentando actualizar cliente con ID: ${req.params.id}`);
  try {
    const { 
      direccion, 
      fechaNacimiento, 
      preferenciasAlimentarias, 
      puntos,
      username,
      email,
      telefono,
      nombre,
      apellido
    } = req.body;
    
    const cliente = await Cliente.findById(req.params.id).populate('usuarioId');

    if (!cliente) {
      console.log(`ClienteController: Cliente con ID ${req.params.id} no encontrado para actualizar.`);
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    // Lógica de autorización: un cliente solo puede actualizar su propio perfil
    // Un admin puede actualizar cualquier perfil
    if (req.usuario && req.usuario.rol === 'cliente' && cliente.usuarioId._id.toString() !== req.usuario._id.toString()) {
      console.warn(`ClienteController: Acceso denegado para usuario ${req.usuario._id} al actualizar perfil de cliente ${req.params.id}`);
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil de cliente.' });
    }

    // Actualizar datos del cliente
    if (direccion !== undefined) cliente.direccion = direccion;
    if (fechaNacimiento !== undefined) cliente.fechaNacimiento = fechaNacimiento;
    if (preferenciasAlimentarias !== undefined) cliente.preferenciasAlimentarias = preferenciasAlimentarias;
    if (puntos !== undefined) cliente.puntos = puntos;

    // Actualizar datos del usuario asociado
    const usuarioId = cliente.usuarioId._id;
    const updateUsuario = {};
    
    if (username !== undefined) updateUsuario.username = username;
    if (email !== undefined) updateUsuario.email = email;
    if (telefono !== undefined) updateUsuario.telefono = telefono;
    if (nombre !== undefined) updateUsuario.nombre = nombre;
    if (apellido !== undefined) updateUsuario.apellido = apellido;

    // Si hay datos del usuario para actualizar, hacerlo
    if (Object.keys(updateUsuario).length > 0) {
      console.log('ClienteController: Actualizando datos del usuario:', updateUsuario);
      await Usuario.findByIdAndUpdate(usuarioId, updateUsuario, { new: true });
    }

    await cliente.save();
    console.log('ClienteController: Perfil de cliente actualizado exitosamente:', cliente);

    const clienteActualizado = await Cliente.findById(cliente._id).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });

    res.status(200).json({ 
      mensaje: 'Perfil de cliente actualizado exitosamente', 
      cliente: clienteActualizado 
    });
  } catch (error) {
    console.error('ClienteController: Error al actualizar cliente:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    }
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar el perfil de cliente.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc Eliminar un perfil de cliente por ID
 * @route DELETE /api/clientes/:id
 * @access Admin
 */
exports.deleteCliente = async (req, res) => {
  console.log(`ClienteController: Intentando eliminar cliente con ID: ${req.params.id}`);
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      console.log(`ClienteController: Cliente con ID ${req.params.id} no encontrado para eliminar.`);
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    await Cliente.deleteOne({ _id: req.params.id });
    console.log('ClienteController: Perfil de cliente eliminado exitosamente.');
    res.status(200).json({ mensaje: 'Perfil de cliente eliminado exitosamente' });
  } catch (error) {
    console.error('ClienteController: Error al eliminar cliente:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    }
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar el perfil de cliente.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  
};

exports.getClienteByUsuarioId = async (req, res) => {
  console.log(`ClienteController: Intentando obtener cliente por usuarioId: ${req.params.usuarioId}`);
  try {
    const cliente = await Cliente.findOne({ usuarioId: req.params.usuarioId }).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });

    if (!cliente) {
      console.log(`ClienteController: Cliente con usuarioId ${req.params.usuarioId} no encontrado.`);
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado para este usuario.' });
    }

    // Lógica de autorización: un cliente solo puede ver su propio perfil
    // Un admin puede ver cualquier perfil
    if (req.usuario && req.usuario.rol === 'cliente' && cliente.usuarioId._id.toString() !== req.usuario._id.toString()) {
      console.warn(`ClienteController: Acceso denegado para usuario ${req.usuario._id} al perfil de cliente de usuario ${req.params.usuarioId}`);
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para ver este perfil de cliente.' });
    }

    console.log('ClienteController: Cliente obtenido por usuarioId exitosamente:', cliente);
    res.status(200).json(cliente);
  } catch (error) {
    console.error('ClienteController: Error al obtener cliente por usuarioId:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
    }
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener el perfil de cliente por usuarioId.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc Cambiar la contraseña del usuario asociado a un cliente
 * @route POST /api/cliente/:id/cambiar-password
 * @access Cliente (para su propio perfil), Admin
 * @body {string} currentPassword - Contraseña actual
 * @body {string} newPassword - Nueva contraseña
 * @body {string} confirmPassword - Confirmación de la nueva contraseña
 */
exports.cambiarPassword = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ mensaje: 'La nueva contraseña y la confirmación son obligatorias.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ mensaje: 'La nueva contraseña y la confirmación no coinciden.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    // Buscar el cliente y el usuario asociado
    const cliente = await Cliente.findById(clienteId).populate('usuarioId');
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }
    const usuario = cliente.usuarioId;
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario asociado no encontrado.' });
    }

    // Si el usuario es OAuth (googleId), no permitir cambio de contraseña local
    if (usuario.googleId) {
      return res.status(400).json({ mensaje: 'No puedes cambiar la contraseña de una cuenta de Google.' });
    }

    // Si no es admin, validar la contraseña actual
    if (!req.usuario || req.usuario.rol !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({ mensaje: 'Debes ingresar la contraseña actual.' });
      }
      const esValida = await usuario.compararPassword(currentPassword);
      if (!esValida) {
        return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta.' });
      }
    }

    // Hashear y guardar la nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    usuario.password = hashed;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña.', error: error.message });
  }
};
