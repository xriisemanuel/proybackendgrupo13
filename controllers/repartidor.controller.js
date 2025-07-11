const Repartidor = require('../models/Repartidor');
const Usuario = require('../models/usuario');

/**
 * @desc Obtener todos los repartidores
 * @route GET /api/repartidores
 * @access Admin
 */
exports.getRepartidores = async (req, res) => {
    try {
        // *** CRÍTICO: Población anidada para usuarioId y rolId ***
        const repartidores = await Repartidor.find({}).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId', // Popula el rolId dentro del Usuario
                select: 'nombre' // Selecciona solo el nombre del Rol
            }
        });
        res.status(200).json(repartidores);
    } catch (error) {
        console.error('Error al obtener repartidores:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener repartidores.', error: error.message });
    }
};

/**
 * @desc Crear un nuevo perfil de repartidor para un usuario existente
 * @route POST /api/repartidores
 * @access Admin
 * @body {string} usuarioId - El ID del usuario asociado (debe tener rol 'repartidor')
 * @body {string} [estado='disponible']
 * @body {string} [vehiculo='']
 * @body {string} [numeroLicencia='']
 */
exports.createRepartidor = async (req, res) => {
    try {
        const { usuarioId, estado, vehiculo, numeroLicencia } = req.body;

        if (!usuarioId) {
            return res.status(400).json({ mensaje: 'El campo usuarioId es obligatorio para crear un perfil de repartidor.' });
        }

        const usuarioExistente = await Usuario.findById(usuarioId).populate('rolId');
        if (!usuarioExistente) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado con el ID proporcionado.' });
        }
        if (usuarioExistente.rolId.nombre !== 'repartidor') {
            return res.status(400).json({ mensaje: 'El usuario asociado debe tener el rol de "repartidor".' });
        }

        const repartidorExistente = await Repartidor.findOne({ usuarioId });
        if (repartidorExistente) {
            return res.status(400).json({ mensaje: 'Ya existe un perfil de repartidor asociado a este usuario.' });
        }

        const nuevoRepartidor = new Repartidor({
            usuarioId,
            estado: estado || 'disponible',
            vehiculo: vehiculo || '',
            numeroLicencia: numeroLicencia || '',
        });

        await nuevoRepartidor.save();
        // *** CRÍTICO: Población anidada para devolver una respuesta completa ***
        const repartidorConUsuario = await Repartidor.findById(nuevoRepartidor._id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });
        res.status(201).json({ mensaje: 'Perfil de repartidor creado exitosamente', repartidor: repartidorConUsuario });
    } catch (error) {
        console.error('Error al crear perfil de repartidor:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear el perfil de repartidor.', error: error.message });
    }
};

/**
 * @desc Obtener un repartidor por ID
 * @route GET /api/repartidores/:id
 * @access Admin, Repartidor (para su propio perfil)
 */
exports.getRepartidorById = async (req, res) => {
    try {
        // *** CRÍTICO: Población anidada para usuarioId y rolId ***
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });
        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para ver este perfil de repartidor.' });
        }
        res.status(200).json(repartidor);
    } catch (error) {
        console.error('Error al obtener repartidor por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el repartidor por ID.', error: error.message });
    }
};

/**
 * @desc Actualizar un repartidor por ID
 * @route PUT /api/repartidores/:id
 * @access Admin, Repartidor (para su propio perfil)
 * @body {string} [estado]
 * @body {string} [vehiculo]
 * @body {string} [numeroLicencia]
 * @body {Object} [ubicacionActual]
 * @body {number} [ubicacionActual.lat]
 * @body {number} [ubicacionActual.lon]
 */
exports.updateRepartidor = async (req, res) => {
    try {
        const { estado, vehiculo, numeroLicencia, ubicacionActual } = req.body;
        // *** CRÍTICO: Población anidada para la autorización y respuesta completa ***
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil de repartidor.' });
        }

        if (estado) repartidor.estado = estado;
        if (vehiculo) repartidor.vehiculo = vehiculo;
        if (numeroLicencia) repartidor.numeroLicencia = numeroLicencia;
        if (ubicacionActual) {
            repartidor.ubicacionActual.lat = ubicacionActual.lat !== undefined ? ubicacionActual.lat : repartidor.ubicacionActual.lat;
            repartidor.ubicacionActual.lon = ubicacionActual.lon !== undefined ? ubicacionActual.lon : repartidor.ubicacionActual.lon;
        }

        await repartidor.save();
        // El repartidor ya está poblado con usuario y rol, así que lo devolvemos directamente
        res.status(200).json({ mensaje: 'Repartidor actualizado exitosamente', repartidor: repartidor });
    } catch (error) {
        console.error('Error al actualizar repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el repartidor.', error: error.message });
    }
};

/**
 * @desc Actualizar perfil completo del repartidor (usuario + repartidor)
 * @route PUT /api/repartidores/:id/profile
 * @access Repartidor (para su propio perfil)
 * @body {string} [username] - Username del usuario
 * @body {string} [email] - Email del usuario
 * @body {string} [telefono] - Teléfono del usuario
 * @body {string} [nombre] - Nombre del usuario
 * @body {string} [apellido] - Apellido del usuario
 * @body {string} [vehiculo] - Vehículo del repartidor
 * @body {string} [numeroLicencia] - Número de licencia del repartidor
 * @body {string} [estado] - Estado del repartidor
 */
exports.updateRepartidorProfile = async (req, res) => {
    try {
        const {
            username, email, telefono, nombre, apellido,
            vehiculo, numeroLicencia, estado
        } = req.body;

        // Buscar el repartidor con el usuario poblado
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        // Verificar que el usuario autenticado sea el propietario del perfil
        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar este perfil.' });
        }

        // Actualizar datos del usuario si se proporcionan
        const usuario = repartidor.usuarioId;
        if (username) usuario.username = username;
        if (email) usuario.email = email;
        if (telefono) usuario.telefono = telefono;
        if (nombre) usuario.nombre = nombre;
        if (apellido) usuario.apellido = apellido;

        // Guardar cambios del usuario
        await usuario.save();

        // Actualizar datos del repartidor si se proporcionan
        if (vehiculo !== undefined) repartidor.vehiculo = vehiculo;
        if (numeroLicencia !== undefined) repartidor.numeroLicencia = numeroLicencia;
        if (estado) repartidor.estado = estado;

        // Guardar cambios del repartidor
        await repartidor.save();

        // Recargar el repartidor con datos actualizados
        const repartidorActualizado = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        res.status(200).json({
            mensaje: 'Perfil actualizado exitosamente',
            repartidor: repartidorActualizado
        });
    } catch (error) {
        console.error('Error al actualizar perfil del repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'El username o email ya está en uso.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el perfil.', error: error.message });
    }
};

/**
 * @desc Eliminar un repartidor por ID
 * @route DELETE /api/repartidores/:id
 * @access Admin
 */
exports.deleteRepartidor = async (req, res) => {
    try {
        const repartidor = await Repartidor.findById(req.params.id);

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        await Repartidor.deleteOne({ _id: req.params.id });
        res.status(200).json({ mensaje: 'Repartidor eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el repartidor.', error: error.message });
    }
};

/**
 * @desc Actualizar la ubicación actual de un repartidor
 * @route PUT /api/repartidores/:id/ubicacion
 * @access Repartidor (para su propio perfil)
 * @body {number} lat
 * @body {number} lon
 */
exports.updateUbicacion = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para actualizar la ubicación de otro repartidor.' });
        }

        if (lat === undefined || lon === undefined) {
            return res.status(400).json({ mensaje: 'Latitud y longitud son obligatorias para actualizar la ubicación.' });
        }

        repartidor.ubicacionActual = { lat, lon };
        await repartidor.save();
        res.status(200).json({ mensaje: 'Ubicación actualizada exitosamente', ubicacion: repartidor.ubicacionActual });
    } catch (error) {
        console.error('Error al actualizar ubicación del repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la ubicación.', error: error.message });
    }
};

/**
 * @desc Cambiar el estado de un repartidor
 * @route PATCH /api/repartidores/:id/estado
 * @access Admin, Gerencia, Repartidor (para su propio perfil)
 * @body {string} estado - El nuevo estado ('disponible', 'en_entrega', 'fuera_de_servicio')
 */
exports.cambiarEstadoRepartidor = async (req, res) => {
    try {
        const { estado } = req.body;
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para cambiar el estado de otro repartidor.' });
        }

        await repartidor.cambiarEstado(estado);
        res.status(200).json({ mensaje: 'Estado del repartidor actualizado exitosamente', repartidor: repartidor });
    } catch (error) {
        console.error('Error al cambiar estado del repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al cambiar el estado del repartidor.', error: error.message });
    }
};

/**
 * @desc Registrar una nueva entrega para un repartidor
 * @route PATCH /api/repartidores/:id/registrar-entrega
 * @access Admin, Sistema de Pedidos
 * @body {string} pedidoId
 * @body {number} [calificacionCliente]
 * @body {Date} [fechaEntrega]
 */
exports.registrarEntregaRepartidor = async (req, res) => {
    try {
        const { pedidoId, calificacionCliente, fechaEntrega } = req.body;
        const repartidor = await Repartidor.findById(req.params.id).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
        }

        await repartidor.registrarEntrega({ pedidoId, calificacionCliente, fechaEntrega });
        res.status(200).json({ mensaje: 'Entrega registrada exitosamente', repartidor: repartidor });
    } catch (error) {
        console.error('Error al registrar entrega del repartidor:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de repartidor o pedido inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al registrar la entrega del repartidor.', error: error.message });
    }
};
exports.getRepartidorByUsuarioId = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const repartidor = await Repartidor.findOne({ usuarioId }).populate({
            path: 'usuarioId',
            select: 'username email nombre apellido telefono rolId',
            populate: {
                path: 'rolId',
                select: 'nombre'
            }
        });

        if (!repartidor) {
            return res.status(404).json({ mensaje: 'Perfil de repartidor no encontrado para el usuario dado.' });
        }

        // Opcional: Reforzar la autorización si req.user está disponible
        if (req.user && req.user.rol === 'repartidor' && repartidor.usuarioId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para ver este perfil de repartidor.' });
        }

        res.status(200).json(repartidor);
    } catch (error) {
        console.error('Error al obtener repartidor por usuarioId:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el repartidor por usuarioId.', error: error.message });
    }
};