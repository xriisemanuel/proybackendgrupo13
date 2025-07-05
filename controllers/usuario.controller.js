const Usuario = require('../models/usuario');
const Rol = require('../models/rol'); // Asegúrate de que la ruta sea correcta
const Cliente = require('../models/cliente.model'); // Asegúrate de importar el modelo Cliente
const Repartidor = require('../models/Repartidor'); // Asegúrate de importar el modelo Repartidor
const bcrypt = require('bcryptjs'); // Aunque no se usa directamente aquí, se mantiene por si acaso

/**
 * Función auxiliar para poblar los perfiles específicos del usuario.
 * @param {mongoose.Query} query La consulta de Mongoose.
 * @returns {mongoose.Query} La consulta con populate.
 */
const populateUserProfiles = (query) => {
    return query
        .populate('rolId', 'nombre') // Popula el rol para obtener el nombre
        .populate({
            path: 'clienteId', // Popula el perfil de cliente si existe
            model: 'Cliente', // Especifica el modelo para clienteId
            select: 'direccion fechaNacimiento preferenciasAlimentarias puntos' // Campos del perfil de cliente
        })
        .populate({
            path: 'repartidorId', // Popula el perfil de repartidor si existe
            model: 'Repartidor', // Especifica el modelo para repartidorId
            select: 'estado vehiculo numeroLicencia' // Campos del perfil de repartidor
        });
};

/**
 * @desc Obtener todos los usuarios
 * @route GET /api/usuarios
 * @access Admin
 */
exports.getUsuarios = async (req, res) => {
    try {
        // Usamos la función auxiliar para poblar los perfiles
        const usuarios = await populateUserProfiles(Usuario.find({}).select('-password')); // No enviamos el password
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener usuarios.', error: error.message });
    }
};

/**
 * @desc Obtener un usuario por ID
 * @route GET /api/usuarios/:id
 * @access Admin, Propietario del perfil
 */
exports.getUsuarioById = async (req, res) => {
    try {
        // Usamos la función auxiliar para poblar los perfiles
        const usuario = await populateUserProfiles(Usuario.findById(req.params.id).select('-password')); // No enviamos el password

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Lógica de autorización (si req.user está disponible desde un middleware de autenticación)
        // Un usuario solo puede ver su propio perfil, un admin puede ver cualquiera
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
 * @route PUT /api/usuarios/:id
 * @access Admin, Propietario del perfil
 */
exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, nombre, apellido, telefono, estado,
                 direccionCliente, fechaNacimientoCliente, preferenciasAlimentariasCliente, puntosCliente,
                 vehiculoRepartidor, numeroLicenciaRepartidor } = req.body;

        const usuario = await Usuario.findById(id).populate('rolId'); // Popula el rol para verificarlo
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Lógica de autorización
        if (req.user && req.user.rol !== 'admin' && req.user._id.toString() !== usuario._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil de usuario.' });
        }

        // Validar si el username o email ya existen para otro usuario
        if (username && username !== usuario.username) {
            const usernameExists = await Usuario.findOne({ username });
            if (usernameExists && usernameExists._id.toString() !== usuario._id.toString()) {
                return res.status(400).json({ mensaje: 'Este nombre de usuario ya está en uso.' });
            }
        }
        if (email && email !== usuario.email) {
            const emailExists = await Usuario.findOne({ email });
            if (emailExists && emailExists._id.toString() !== usuario._id.toString()) {
                return res.status(400).json({ mensaje: 'Este email ya está en uso.' });
            }
        }

        // Actualizar campos comunes del Usuario
        if (username) usuario.username = username;
        if (email) usuario.email = email;
        if (nombre) usuario.nombre = nombre;
        if (apellido) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono; // Permite null o vacío
        if (estado !== undefined) usuario.estado = estado; // Permite cambiar el estado

        // NO SE PERMITE CAMBIAR EL ROL DEL USUARIO EN ESTA RUTA DE ACTUALIZACIÓN
        // if (rolId) usuario.rolId = rolId; // Esta línea no debe existir aquí

        await usuario.save(); // Guarda los cambios en el usuario

        // Lógica para actualizar perfiles específicos (Cliente o Repartidor)
        if (usuario.rolId && usuario.rolId.nombre === 'cliente') {
            let clientePerfil = await Cliente.findOne({ usuarioId: usuario._id });
            if (clientePerfil) {
                if (direccionCliente !== undefined) clientePerfil.direccion = direccionCliente; // Permite vaciar
                if (fechaNacimientoCliente !== undefined) clientePerfil.fechaNacimiento = fechaNacimientoCliente; // Permite vaciar
                if (preferenciasAlimentariasCliente !== undefined) clientePerfil.preferenciasAlimentarias = preferenciasAlimentariasCliente; // Permite vaciar
                if (puntosCliente !== undefined) clientePerfil.puntos = puntosCliente;
                await clientePerfil.save();
            }
        } else if (usuario.rolId && usuario.rolId.nombre === 'repartidor') {
            let repartidorPerfil = await Repartidor.findOne({ usuarioId: usuario._id });
            if (repartidorPerfil) {
                if (vehiculoRepartidor !== undefined) repartidorPerfil.vehiculo = vehiculoRepartidor; // Permite vaciar
                if (numeroLicenciaRepartidor !== undefined) repartidorPerfil.numeroLicencia = numeroLicenciaRepartidor; // Permite vaciar
                // No se actualiza el estado del repartidor desde aquí, debe ser a través de su propia lógica de negocio
                await repartidorPerfil.save();
            }
        }

        // Volver a obtener el usuario con los perfiles populados para la respuesta
        const usuarioActualizado = await populateUserProfiles(Usuario.findById(id).select('-password'));
        res.status(200).json({ mensaje: 'Usuario y perfil(es) actualizado(s) exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        if (error.code === 11000) { // Error de clave duplicada de MongoDB
            return res.status(400).json({ mensaje: 'El username o email ya está en uso.' });
        }
        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ mensaje: 'Error de validación: ' + messages.join(', '), error });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el usuario.', error: error.message });
    }
};

/**
 * @desc Eliminar un usuario por ID
 * @route DELETE /api/usuarios/:id
 * @access Admin
 */
exports.deleteUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).populate('rolId');
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Lógica de autorización: solo un admin puede eliminar usuarios
        if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para eliminar usuarios.' });
        }

        // Eliminar perfiles asociados si existen
        if (usuario.rolId && usuario.rolId.nombre === 'cliente' && usuario.clienteId) {
            await Cliente.deleteOne({ _id: usuario.clienteId });
        } else if (usuario.rolId && usuario.rolId.nombre === 'repartidor' && usuario.repartidorId) {
            await Repartidor.deleteOne({ _id: usuario.repartidorId });
        }

        await Usuario.deleteOne({ _id: req.params.id });
        res.status(200).json({ mensaje: 'Usuario y perfiles asociados eliminados exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el usuario.', error: error.message });
    }
};
