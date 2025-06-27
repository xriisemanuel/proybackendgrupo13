// controllers/auth.controller.js
const Usuario = require('../models/usuario'); // Ajustado a .model
const Cliente = require('../models/cliente.model');
const Rol = require('../models/rol');       // Ajustado a .model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Asegúrate de que JWT_SECRET esté disponible desde tus variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @desc Registra un nuevo usuario en el sistema.
 * @route POST /api/auth/register
 * @access Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, password, email, telefono, rolName, nombreCliente, apellidoCliente, nombre, apellido } = req.body;

    // Validar que los campos mínimos estén presentes
    // Se asume que 'nombre' y 'apellido' son parte del modelo Usuario si se pasan en el body
    if (!username || !password || !email || !rolName) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios (username, password, email, rolName) deben ser proporcionados.' });
    }

    // 1. Verificar si el nombre de usuario o el email ya existen
    let userExists = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ mensaje: 'El nombre de usuario o el email ya están en uso.' });
    }

    // 2. Buscar el rol por su nombre (rolName en el body)
    const foundRol = await Rol.findOne({ nombre: rolName });
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
      telefono: telefono || null,
      rolId: foundRol._id,
      estado: true,
      nombre: nombre || null,    // Se asume que el modelo Usuario tiene 'nombre'
      apellido: apellido || null // Se asume que el modelo Usuario tiene 'apellido'
      // 'clienteId' se establecerá condicionalmente más abajo si el rol es 'cliente'
    });

    // 5. Si el rol es 'cliente', crear un registro en la colección Cliente y vincularlo
    if (foundRol.nombre === 'cliente') {
      const newCliente = new Cliente({
        nombre: nombreCliente || nombre || username, // Prioriza nombreCliente, luego nombre de Usuario, sino username
        apellido: apellidoCliente || apellido || null,
        telefono: telefono || null,
        email,
        direccion: '',
        fechaNacimiento: null,
        preferenciasAlimentarias: [],
        puntos: 0
      });
      await newCliente.save();
      newUsuario.clienteId = newCliente._id;
    }

    await newUsuario.save();

    // 6. Generar el JWT
    const token = jwt.sign(
      { _id: newUsuario._id, rol: foundRol.nombre },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: newUsuario._id,
        username: newUsuario.username,
        email: newUsuario.email,
        rol: foundRol.nombre,
        nombre: newUsuario.nombre,
        apellido: newUsuario.apellido
      }
    });

  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar el usuario.', error: error.message });
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

    // --- INICIO DE LÍNEAS DE DEPURACIÓN ---
    console.log('--- INTENTO DE LOGIN ---');
    console.log('Username recibido:', username);
    console.log('Password recibido (texto plano):', password); // ¡ATENCIÓN: No loguear passwords en producción! Solo para depuración.
    // --- FIN DE LÍNEAS DE DEPURACIÓN ---

    // Verificar que se proporcionen ambos campos
    if (!username || !password) {
      console.log('Falla: Nombre de usuario o contraseña no proporcionados.');
      return res.status(400).json({ mensaje: 'Se requiere nombre de usuario y contraseña para iniciar sesión.' });
    }

    // 1. Buscar el usuario por nombre de usuario
    const user = await Usuario.findOne({ username }).populate('rolId');

    if (!user) {
      console.log('Falla: Usuario no encontrado en la base de datos para el username:', username);
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    // --- INICIO DE LÍNEAS DE DEPURACIÓN ---
    console.log('Usuario encontrado:', user.username);
    console.log('Password hasheado en DB para este usuario:', user.password);
    // --- FIN DE LÍNEAS DE DEPURACIÓN ---

    // 2. Comparar la contraseña proporcionada con la hasheada en la DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Falla: La contraseña proporcionada NO coincide con la contraseña hasheada en DB.');
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    // 3. Verificar si la cuenta de usuario está activa
    if (!user.estado) {
      console.log('Falla: La cuenta de usuario está inactiva.');
      return res.status(403).json({ mensaje: 'La cuenta de usuario está inactiva. Por favor, contacte al soporte.' });
    }

    // 4. Generar el JWT
    const token = jwt.sign(
      { _id: user._id, rol: user.rolId.nombre },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Éxito: Inicio de sesión exitoso.');
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
