const Usuario = require('../models/usuario'); // Asegúrate de que la ruta sea correcta
const Rol = require('../models/rol');       // Necesario para buscar roles por nombre
const Cliente = require('../models/cliente.model'); // Necesario si el rol es 'cliente'
const bcrypt = require('bcryptjs'); // Para hashear y comparar contraseñas

/**
 * @desc Obtener todos los usuarios
 * @route GET /api/usuario
 * @access Admin
 */
exports.getUsuarios = async (req, res) => {
  try {
    // Popula el campo rolId para obtener el objeto completo del rol
    // Y popula clienteId si es necesario mostrar datos del cliente.
    const usuarios = await Usuario.find({})
      .populate('rolId')
      .populate('clienteId');
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener usuarios.', error: error.message });
  }
};

/**
 * @desc Crear un nuevo usuario (para uso de administradores)
 * @route POST /api/usuario
 * @access Admin
 * @body {string} username
 * @body {string} password
 * @body {string} email
 * @body {string} telefono
 * @body {string} rolName - Nombre del rol (ej. 'admin', 'cliente', 'repartidor')
 * @body {string} nombre
 * @body {string} apellido
 * @body {string} [nombreCliente] - Opcional, si el rol es 'cliente'
 * @body {string} [apellidoCliente] - Opcional, si el rol es 'cliente'
 */
exports.createUsuario = async (req, res) => {
  try {
    const { username, password, email, telefono, rolName, nombre, apellido, nombreCliente, apellidoCliente } = req.body;

    // Validar campos obligatorios
    if (!username || !password || !email || !telefono || !rolName || !nombre || !apellido) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios (username, password, email, telefono, rolName, nombre, apellido) deben ser proporcionados.' });
    }

    // 1. Verificar si el username o email ya existen
    let userExists = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ mensaje: 'El nombre de usuario o el email ya están en uso.' });
    }

    // 2. Buscar el rol por su nombre
    const foundRol = await Rol.findOne({ nombre: rolName.toLowerCase() }); // Asegúrate de buscar en minúsculas
    if (!foundRol) {
      return res.status(400).json({ mensaje: `Rol no válido: '${rolName}'.` });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el nuevo usuario
    let newUsuario = new Usuario({
      username,
      password: hashedPassword,
      email,
      telefono,
      nombre,
      apellido,
      rolId: foundRol._id, // Asigna el ObjectId del rol
      estado: true // Por defecto, el usuario está activo
    });

    // 5. Si el rol es 'cliente', crear un registro en la colección Cliente y vincularlo
    if (foundRol.nombre === 'cliente') {
      const newCliente = new Cliente({
        nombre: nombreCliente || nombre,
        apellido: apellidoCliente || apellido,
        telefono: telefono,
        email,
        direccion: '',
        fechaNacimiento: null,
        preferenciasAlimentarias: [],
        puntos: 0
      });
      await newCliente.save();
      newUsuario.clienteId = newCliente._id; // Vincular el ObjectId del Cliente al Usuario
    }

    await newUsuario.save();

    // Popula el rol para la respuesta
    await newUsuario.populate('rolId');

    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: newUsuario });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === 11000) { // Error de clave duplicada de MongoDB
      return res.status(400).json({ mensaje: 'El nombre de usuario o email ya existen.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al crear el usuario.', error: error.message });
  }
};

/**
 * @desc Obtener un usuario por ID
 * @route GET /api/usuario/:id
 * @access Authenticated (Admin, o el propio usuario)
 */
exports.getUsuarioById = async (req, res) => {
  try {
    // Popula el campo rolId para obtener el objeto completo del rol
    const usuario = await Usuario.findById(req.params.id).populate('rolId');
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Lógica de autorización:
    // Un administrador puede ver cualquier usuario.
    // Un usuario normal solo puede ver su propio perfil.
    if (req.user && req.user.rol !== 'admin' && req.user._id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para ver este perfil de usuario.' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener el usuario por ID.', error: error.message });
  }
};

/**
 * @desc Actualizar un usuario por ID
 * @route PUT /api/usuario/:id
 * @access Authenticated (Admin, o el propio usuario)
 * @body {string} [username]
 * @body {string} [password]
 * @body {string} [email]
 * @body {string} [telefono]
 * @body {boolean} [estado]
 * @body {string} [rolName] - Para cambiar el rol (solo admin)
 * @body {string} [nombre]
 * @body {string} [apellido]
 */
exports.updateUsuario = async (req, res) => {
  try {
    const { username, password, email, telefono, estado, rolName, nombre, apellido } = req.body;
    const usuario = await Usuario.findById(req.params.id).populate('rolId'); // Popula para autorización

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Lógica de autorización:
    // Un administrador puede actualizar cualquier usuario.
    // Un usuario normal solo puede actualizar su propio perfil (excepto el rol).
    if (req.user && req.user.rol !== 'admin' && req.user._id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil de usuario.' });
    }

    // Actualizar campos si se proporcionan
    if (username && username !== usuario.username) {
      const usernameExists = await Usuario.findOne({ username });
      if (usernameExists && usernameExists._id.toString() !== usuario._id.toString()) {
        return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso.' });
      }
      usuario.username = username;
    }

    if (email && email !== usuario.email) {
      const emailExists = await Usuario.findOne({ email });
      if (emailExists && emailExists._id.toString() !== usuario._id.toString()) {
        return res.status(400).json({ mensaje: 'El email ya está en uso.' });
      }
      usuario.email = email;
    }

    if (password) {
      usuario.password = await bcrypt.hash(password, 10); // Hashear nueva contraseña
    }
    if (telefono) usuario.telefono = telefono;
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (estado !== undefined && req.user.rol === 'admin') { // Solo admin puede cambiar el estado
      usuario.estado = estado;
    }

    // Cambiar rol (solo si es admin y se proporciona un rolName diferente)
    if (rolName && req.user.rol === 'admin' && rolName.toLowerCase() !== usuario.rolId.nombre) {
      const newRol = await Rol.findOne({ nombre: rolName.toLowerCase() });
      if (!newRol) {
        return res.status(400).json({ mensaje: `Rol '${rolName}' no válido.` });
      }
      usuario.rolId = newRol._id;

      // Lógica adicional si el rol cambia a/de 'cliente'
      if (newRol.nombre === 'cliente' && !usuario.clienteId) {
        const newCliente = new Cliente({
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          email: usuario.email
        });
        await newCliente.save();
        usuario.clienteId = newCliente._id;
      } else if (newRol.nombre !== 'cliente' && usuario.clienteId) {
        usuario.clienteId = null;
      }
    }

    await usuario.save();
    // Popula el rol para la respuesta final
    await usuario.populate('rolId');

    res.status(200).json({ mensaje: 'Usuario actualizado exitosamente', usuario });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
    }
    if (error.code === 11000) { // Error de clave duplicada
      return res.status(400).json({ mensaje: 'El nombre de usuario o email ya existen.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el usuario.', error: error.message });
  }
};

/**
 * @desc Eliminar un usuario por ID
 * @route DELETE /api/usuario/:id
 * @access Admin
 */
exports.deleteUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.clienteId) {
      await Cliente.deleteOne({ _id: usuario.clienteId });
    }

    await Usuario.deleteOne({ _id: req.params.id });
    res.status(200).json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el usuario.', error: error.message });
  }
};
