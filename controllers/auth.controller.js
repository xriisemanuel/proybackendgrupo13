// controllers/auth.controller.js
const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente.model');
const Repartidor = require('../models/Repartidor');
const Rol = require('../models/rol');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_aqui'; // Usar una variable de entorno o un valor por defecto

/**
 * @desc Registra un nuevo usuario en el sistema, creando también su perfil de rol específico si aplica.
 * @route POST /api/auth/register
 * @access Public
 * @body {string} username
 * @body {string} password
 * @body {string} email
 *
 * @body {string} [telefono] - Opcional
 * @body {string} rolName - El nombre del rol deseado (ej. 'cliente', 'repartidor', 'admin')
 * @body {string} nombre - Nombre del usuario
 * @body {string} apellido - Apellido del usuario
 *
 * @body {string} [direccionCliente] - Opcional, si el rol es 'cliente'
 * @body {Date} [fechaNacimientoCliente] - Opcional, si el rol es 'cliente'
 * @body {string[]} [preferenciasAlimentariasCliente] - Opcional, si el rol es 'cliente'
 * @body {number} [puntosCliente] - Opcional, si el rol es 'cliente'
 *
 * @body {string} [vehiculoRepartidor] - Opcional, si el rol es 'repartidor'
 * @body {string} [numeroLicenciaRepartidor] - Opcional, si el rol es 'repartidor'
 */
exports.registerUser = async (req, res) => {
  try {
    const {
      username, password, email, telefono, rolName, nombre, apellido,
      direccionCliente, fechaNacimientoCliente, preferenciasAlimentariasCliente, puntosCliente,
      vehiculoRepartidor, numeroLicenciaRepartidor
    } = req.body;

    // Validar que los campos mínimos estén presentes
    if (!username || !password || !email || !rolName || !nombre || !apellido) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios (username, password, email, rolName, nombre, apellido) deben ser proporcionados.' });
    }

    // 1. Verificar si el nombre de usuario o el email ya existen
    let userExists = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      // Mensaje más específico si el duplicado es username o email
      let duplicateField = userExists.username === username ? 'nombre de usuario' : 'email';
      return res.status(400).json({ mensaje: `El ${duplicateField} '${username === userExists.username ? username : email}' ya está en uso.` });
    }

    // 2. Buscar el rol por su nombre
    const foundRol = await Rol.findOne({ nombre: rolName.toLowerCase() }); // Asegurarse de buscar en minúsculas
    if (!foundRol) {
      return res.status(400).json({ mensaje: `Rol no válido: '${rolName}'. Los roles permitidos son: admin, cliente, supervisor_cocina, supervisor_ventas, repartidor.` });
    }

    // 3. Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el nuevo usuario
    let newUsuario = new Usuario({
      username,
      password: hashedPassword,
      email,
      telefono: telefono || null, // Si el frontend envía vacío, se guarda como null
      rolId: foundRol._id,
      estado: true, // Por defecto, el usuario está activo
      nombre,
      apellido
    });

    // 5. Crear el perfil de rol específico y vincularlo al usuario
    if (foundRol.nombre === 'cliente') {
      // Validar que la dirección sea obligatoria para el cliente aquí también
      if (!direccionCliente) {
        return res.status(400).json({ mensaje: 'La dirección es obligatoria para el rol de cliente.' });
      }
      const newCliente = new Cliente({
        usuarioId: newUsuario._id, // <--- ¡Vincular al ID del Usuario recién creado!
        direccion: direccionCliente,
        fechaNacimiento: fechaNacimientoCliente || null,
        preferenciasAlimentarias: preferenciasAlimentariasCliente || [],
        puntos: puntosCliente || 0
      });
      await newCliente.save();
      newUsuario.clienteId = newCliente._id; // Vincular el ObjectId del Cliente al Usuario
      await newUsuario.save(); // Guardar el usuario después de vincular el perfil
    } else if (foundRol.nombre === 'repartidor') {
      // Validar campos obligatorios para repartidor si es necesario aquí (ej. vehiculo, numeroLicencia)
      const newRepartidor = new Repartidor({
        usuarioId: newUsuario._id, // Vincular al ID del Usuario recién creado
        estado: 'disponible', // Estado inicial por defecto
        vehiculo: vehiculoRepartidor || '',
        numeroLicencia: numeroLicenciaRepartidor || ''
        // ubicacionActual, historialEntregas, calificacionPromedio se inicializan por defecto en el modelo
      });
      await newRepartidor.save();
      newUsuario.repartidorId = newRepartidor._id; // Asegurado que se asigna
      await newUsuario.save(); // Guardar el usuario después de vincular el perfil
    } else {
      // Si no es cliente ni repartidor (ej. admin, supervisor), solo guarda el usuario
      await newUsuario.save();
    }

    // 6. Generar el JWT
    const token = jwt.sign(
      { _id: newUsuario._id, rol: foundRol.nombre },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      mensaje: 'Usuario y perfil de rol creado exitosamente',
      token,
      usuario: {
        id: newUsuario._id,
        username: newUsuario.username,
        email: newUsuario.email,
        nombre: newUsuario.nombre,
        apellido: newUsuario.apellido,
        rol: foundRol.nombre // Devolver el nombre del rol
      }
    });

  } catch (error) {
    console.error('Error en el registro de usuario (adaptable):', error);
    // Manejo específico para errores de duplicidad de clave de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      // Mensaje más amigable y genérico para el frontend, sin mencionar "sparse"
      let message = `El campo '${field}' con valor '${value}' ya está en uso.`;
      if (field === 'username') {
        message = `El nombre de usuario '${value}' ya está registrado.`;
      } else if (field === 'email') {
        message = `El email '${value}' ya está registrado.`;
      } else if (field === 'clienteId' && value === null) {
        // Este caso no debería ocurrir si sparse:true funciona correctamente.
        // Si ocurre, es un problema de configuración de índice o datos.
        message = 'Error de base de datos: Conflicto al crear el usuario. Un campo de perfil opcional ya existe con valor nulo.';
      } else if (field === 'repartidorId' && value === null) {
        // Este caso no debería ocurrir si sparse:true funciona correctamente.
        // Si ocurre, es un problema de configuración de índice o datos.
        message = 'Error de base de datos: Conflicto al crear el usuario. Un campo de perfil opcional ya existe con valor nulo.';
      }
      return res.status(400).json({ mensaje: message, error });
    }
    // Manejo de errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      let messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ mensaje: 'Error de validación: ' + messages.join(', '), error });
    }
    res.status(500).json({ mensaje: 'Error al registrar el usuario y su perfil.', error: error.message });
  }
};

/**
 * @desc Inicia sesión de un usuario y devuelve un JWT.
 * @route POST /api/auth/login
 * @access Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: 'Se requiere nombre de usuario y contraseña para iniciar sesión.' });
    }

    const user = await Usuario.findOne({ username }).populate('rolId');

    if (!user) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    if (!user.estado) {
      return res.status(403).json({ mensaje: 'La cuenta de usuario está inactiva. Por favor, contacte al soporte.' });
    }

    const token = jwt.sign(
      { _id: user._id, rol: user.rolId.nombre },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user._id,
        username: user.username,
        email: user.email,
        rol: user.rolId.nombre,
        nombre: user.nombre,
        apellido: user.apellido
      }
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
  }
};
