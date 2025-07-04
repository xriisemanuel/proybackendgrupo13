const Cliente = require('../models/cliente.model'); // Asegúrate de que la ruta a tu modelo Cliente sea correcta
const Usuario = require('../models/usuario'); // Necesario para verificar usuarios si es necesario
const Rol = require('../models/rol'); // Necesario para verificar roles si es necesario

/**
 * @desc Obtener todos los perfiles de clientes
 * @route GET /api/clientes
 * @access Admin
 */
exports.getClientes = async (req, res) => {
  console.log('ClienteController: Intentando obtener todos los clientes...');
  try {
    // Popula el campo usuarioId y, dentro de usuarioId, popula rolId
    // Esto traerá los datos completos del usuario asociado y su rol
    const clientes = await Cliente.find({}).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId', // Campos a seleccionar del Usuario
      populate: {
        path: 'rolId', // Popula el rolId dentro del Usuario
        select: 'nombre' // Solo el nombre del Rol
      }
    });
    console.log('ClienteController: Clientes obtenidos exitosamente. Cantidad:', clientes.length);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('ClienteController: Error al obtener clientes:', error);
    // Puedes añadir más detalles al mensaje de error en la respuesta para el frontend
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener clientes.',
      error: error.message, // Envía el mensaje de error real para depuración
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // Solo en desarrollo
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

    // 1. Verificar si el usuarioId existe y tiene el rol 'cliente'
    const usuarioExistente = await Usuario.findById(usuarioId).populate('rolId');
    if (!usuarioExistente) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado con el ID proporcionado.' });
    }
    if (usuarioExistente.rolId.nombre !== 'cliente') {
      return res.status(400).json({ mensaje: 'El usuario asociado debe tener el rol de "cliente".' });
    }

    // 2. Verificar si ya existe un perfil de cliente para este usuarioId
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

    // Popula el usuario para devolver una respuesta más completa
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
    if (req.user && req.user.rol === 'cliente' && cliente.usuarioId._id.toString() !== req.user._id.toString()) {
      console.warn(`ClienteController: Acceso denegado para usuario ${req.user._id} al perfil de cliente ${req.params.id}`);
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
 */
exports.updateCliente = async (req, res) => {
  console.log(`ClienteController: Intentando actualizar cliente con ID: ${req.params.id}`);
  try {
    const { direccion, fechaNacimiento, preferenciasAlimentarias, puntos } = req.body;
    const cliente = await Cliente.findById(req.params.id).populate('usuarioId'); // Popula para la autorización

    if (!cliente) {
      console.log(`ClienteController: Cliente con ID ${req.params.id} no encontrado para actualizar.`);
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    // Lógica de autorización: un cliente solo puede actualizar su propio perfil
    // Un admin puede actualizar cualquier perfil
    if (req.user && req.user.rol === 'cliente' && cliente.usuarioId._id.toString() !== req.user._id.toString()) {
      console.warn(`ClienteController: Acceso denegado para usuario ${req.user._id} al actualizar perfil de cliente ${req.params.id}`);
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil de cliente.' });
    }

    if (direccion) cliente.direccion = direccion;
    if (fechaNacimiento) cliente.fechaNacimiento = fechaNacimiento;
    if (preferenciasAlimentarias) cliente.preferenciasAlimentarias = preferenciasAlimentarias;
    if (puntos !== undefined) cliente.puntos = puntos;

    await cliente.save();
    console.log('ClienteController: Perfil de cliente actualizado exitosamente:', cliente);

    // Popula el usuario para devolver una respuesta más completa
    const clienteActualizado = await Cliente.findById(cliente._id).populate({
      path: 'usuarioId',
      select: 'username email nombre apellido telefono rolId',
      populate: {
        path: 'rolId',
        select: 'nombre'
      }
    });

    res.status(200).json({ mensaje: 'Perfil de cliente actualizado exitosamente', cliente: clienteActualizado });
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

    // Opcional: Considerar qué hacer con el usuario asociado.
    // Si el usuario no tiene otros roles, ¿debería ser eliminado o desactivado?
    // Por ahora, solo elimina el perfil de cliente.
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

// NOTA: Las funciones para 'obtenerHistorialPedidos' y 'calcularDescuentoFidelidad'
// no están incluidas en este controlador ya que no estaban definidas en el modelo Cliente
// ni en las rutas que proporcionaste inicialmente. Si necesitas estas funcionalidades,
// deberás implementarlas en el modelo y luego en este controlador.
