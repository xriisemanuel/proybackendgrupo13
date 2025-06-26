const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente.model');
const Rol = require('../models/rol');
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
    // CAMBIO 1: Incluir 'nombre' y 'apellido' en la desestructuración de req.body,
    // ya que ahora son campos obligatorios en Usuario.model
    const { username, password, email, telefono, rolId: rolId, nombre, apellido } = req.body;

        // Validar que los campos mínimos estén presentes
        if (!username || !password || !email || !rolId) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser proporcionados.' });
        }

    // 1. Verificar si el nombre de usuario o el email ya existen
    let userExists = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ mensaje: 'El nombre de usuario o el email ya están en uso.' });
    }

    // 2. Buscar el rol por su nombre
    const foundRol = await Rol.findOne({ nombre: rolId });
    if (!foundRol) {
      return res.status(400).json({ mensaje: `Rol no válido: '${rolId}'. Los roles permitidos son: admin, cliente, supervisor_cocina, supervisor_ventas, repartidor.` });
    }

    // 3. Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el nuevo usuario
    let newUsuario = new Usuario({
      username,
      password: hashedPassword,
      email,
      telefono, // CAMBIO 3: 'telefono' ya no es opcional, se pasa directamente
      rolId: foundRol._id,
      estado: true,
      nombre,   // CAMBIO 4: 'nombre' se pasa directamente
      apellido, // CAMBIO 5: 'apellido' se pasa directamente
      // 'clienteId' se establecerá condicionalmente más abajo si el rol es 'cliente'
    });

    // 5. Si el rol es 'cliente', crear un registro en la colección Cliente y vincularlo
    if (foundRol.nombre === 'cliente') {
      const newCliente = new Cliente({
        // CAMBIO 6: Puedes usar 'nombre' y 'apellido' del usuario si no se dan nombres específicos de cliente,
        // o usar 'nombreCliente' y 'apellidoCliente' si se proporcionan.
        nombre: nombreCliente || nombre,
        apellido: apellidoCliente || apellido, // Usar apellido del usuario por defecto si no hay apellidoCliente
        telefono: telefono, // Usar el teléfono del usuario
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
        nombre: newUsuario.nombre,   // Devolver también el nombre y apellido del usuario
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
        nombre: user.nombre,    // Devolver también el nombre y apellido del usuario logueado
        apellido: user.apellido
      }
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
  }
};

// Puedes añadir más funciones relacionadas con la autenticación aquí, por ejemplo:
// exports.recuperarPassword = async (req, res) => { ... };
// exports.verificarToken = async (req, res) => { ... };
