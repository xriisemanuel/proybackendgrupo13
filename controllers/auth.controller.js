const Usuario = require('../models/usuario'); // Asegúrate de que la ruta sea correcta
const Cliente = require('../models/cliente.model'); // Asegúrate de que la ruta sea correcta
const Rol = require('../models/rol');       // Asegúrate de que la ruta sea correcta
const Repartidor = require('../models/Repartidor'); // Asegúrate de que la ruta sea correcta
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @desc Registra un nuevo usuario en el sistema.
 * @route POST /api/auth/register
 * @access Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, password, email, telefono, rolName, nombre, apellido } = req.body;

    // Validar que los campos mínimos estén presentes
    if (!username || !password || !email || !rolName || !nombre || !apellido) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios (username, password, email, rolName, nombre, apellido) deben ser proporcionados.' });
    }

    // 1. Verificar si el nombre de usuario o el email ya existen
    let userExists = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ mensaje: 'El nombre de usuario o el email ya están en uso.' });
    }

    // 2. Buscar el rol por su nombre
    const foundRol = await Rol.findOne({ nombre: rolName.toLowerCase() }); // Asegúrate de buscar el rol en minúsculas
    if (!foundRol) {
      return res.status(400).json({ mensaje: `Rol no válido: '${rolName}'. Los roles permitidos son: admin, cliente, supervisor_cocina, supervisor_ventas, repartidor.` });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el nuevo usuario
    let newUsuario = new Usuario({
      username,
      password: hashedPassword,
      email,
      telefono: telefono || null,
      rolId: foundRol._id,
      estado: true,
      nombre,
      apellido
    });

    // 5. Si el rol es 'cliente', crear un registro en la colección Cliente y vincularlo
    // NOTA: Esta lógica se mantiene para el rol 'cliente'.
    if (foundRol.nombre === 'cliente') {
      const newCliente = new Cliente({
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        email,
        direccion: '',
        fechaNacimiento: null,
        preferenciasAlimentarias: [],
        puntos: 0
      });
      await newCliente.save();
      newUsuario.clienteId = newCliente._id;
    }

    await newUsuario.save(); // Guarda el usuario antes de intentar crear el perfil de repartidor

    // 6. Si el rol es 'repartidor', crear un perfil de Repartidor y vincularlo
    if (foundRol.nombre === 'repartidor') {
      const newRepartidor = new Repartidor({
        usuarioId: newUsuario._id, // Vincula el perfil de repartidor al ID del usuario
        estado: 'disponible', // Estado inicial por defecto
        vehiculo: '', // Puedes pedir esto en el frontend si es necesario
        numeroLicencia: '' // Puedes pedir esto en el frontend si es necesario
        // Los campos nombre, apellido, telefono, email no se duplican aquí,
        // se obtienen del modelo Usuario a través de la referencia.
      });
      await newRepartidor.save();
      console.log('Perfil de Repartidor creado para el usuario:', newUsuario.username);
    }

    // Para otros roles (admin, supervisor_cocina, supervisor_ventas),
    // no se necesita un perfil adicional en colecciones separadas
    // según los modelos actuales. La creación del Usuario es suficiente.

    // 7. Generar el JWT
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

    // Verificar que se proporcionen ambos campos
    if (!username || !password) {
      return res.status(400).json({ mensaje: 'Se requiere nombre de usuario y contraseña para iniciar sesión.' });
    }

    // 1. Buscar el usuario por nombre de usuario
    const user = await Usuario.findOne({ username }).populate('rolId');

    if (!user) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    // 2. Comparar la contraseña proporcionada con la hasheada en la DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    }

    // 3. Verificar si la cuenta de usuario está activa
    if (!user.estado) {
      return res.status(403).json({ mensaje: 'La cuenta de usuario está inactiva. Por favor, contacte al soporte.' });
    }

    // 4. Generar el JWT
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
