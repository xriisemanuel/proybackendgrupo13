const Usuario = require('../models/usuario'); // Asegúrate que el nombre del modelo sea 'usuario.model'
const Cliente = require('../models/cliente.modell'); // Asegúrate que el nombre del modelo sea 'cliente.model'
const Rol = require('../models/rol');     // Asegúrate que el nombre del modelo sea 'rol.model'
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
        const { nombre, apellido, username, password, email, telefono, estado, rolId , clienteId } = req.body;

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
            return res.status(400).json({ mensaje: 'Rol no válido. Los roles permitidos son: admin, cliente, supervisor_cocina, supervisor_ventas, repartidor.' });
        }

        // 3. Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Crear el nuevo usuario
        let newUsuario = new Usuario({
            nombre,
            apellido,
            username,
            password: hashedPassword,
            email,
            telefono: telefono || null, // 'telefono' es opcional en Usuario si no se envía
            estado: true, // Por defecto, el usuario está activo
            rolId: foundRol._id, // Almacenar el ObjectId del rol
            clienteId: clienteId || null, // Almacenar el ObjectId del Cliente si se proporciona

        });

        // 5. Si el rol es 'cliente', crear un registro en la colección Cliente y vincularlo
        if (rolName === 'cliente') {
            const newCliente = new Cliente({
                nombre: nombreCliente || username, // Usar nombreCliente si se provee, sino username
                apellido: apellidoCliente || null,
                telefono: telefono || null,
                email,
                // Puedes añadir valores por defecto para 'direccion', 'fechaNacimiento', 'preferenciasAlimentarias', 'puntos'
                direccion: '',
                fechaNacimiento: null,
                preferenciasAlimentarias: [],
                puntos: 0
            });
            await newCliente.save();
            newUsuario.clienteId = newCliente._id; // Vincular el ObjectId del Cliente al Usuario
        }

        await newUsuario.save();

        // 6. Generar el JWT
        // El payload del JWT debe incluir el ID del usuario y el NOMBRE del rol para el middleware de autorización
        const token = jwt.sign(
            { _id: newUsuario._id, rol: foundRol.nombre }, // Incluir el nombre del rol
            JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: newUsuario._id,
                username: newUsuario.username,
                email: newUsuario.email,
                rol: foundRol.nombre // Devolver el nombre del rol
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

        // 1. Buscar el usuario por nombre de usuario
        // Usamos .populate('rolId') para obtener el objeto completo del rol y acceder a su 'nombre'
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
        // El payload del JWT debe incluir el ID del usuario y el NOMBRE del rol
        const token = jwt.sign(
            { _id: user._id, rol: user.rolId.nombre }, // Usar user.rolId.nombre del objeto populado
            JWT_SECRET,
            { expiresIn: '1h' } // Token expira en 1 hora
        );

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: user._id,
                username: user.username,
                email: user.email,
                rol: user.rolId.nombre // Devolver el nombre del rol
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
