const Repartidor = require('../models/Repartidor');
const Usuario = require('../models/usuario'); // Necesario para la relación con Usuario

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/repartidores
 * @desc Crea un nuevo repartidor
 * @access Admin
 */
exports.crearRepartidor = async (req, res) => {
  try {
    const { usuarioId, nombre, telefono, estado } = req.body;

    // 1. Verificar que el usuarioId exista y no esté ya asociado a un repartidor
    if (usuarioId) {
      const usuarioExistente = await Usuario.findById(usuarioId);
      if (!usuarioExistente) {
        return res.status(404).json({ mensaje: 'El usuario asociado no fue encontrado.' });
      }
      const repartidorExistenteConUsuario = await Repartidor.findOne({ usuarioId });
      if (repartidorExistenteConUsuario) {
        return res.status(409).json({ mensaje: 'Este usuario ya está registrado como repartidor.' });
      }
    }

    const nuevoRepartidor = new Repartidor({
      usuarioId,
      nombre,
      telefono,
      estado: estado || 'disponible', // Por defecto, disponible
      // 'disponible' se ajusta automáticamente por el hook pre-save
    });

    await nuevoRepartidor.save();

    res.status(201).json({
      mensaje: 'Repartidor creado exitosamente.',
      repartidor: nuevoRepartidor
    });
  } catch (error) {
    if (error.code === 11000) { // Errores de clave duplicada (usuarioId, telefono)
      if (error.keyPattern && error.keyPattern.usuarioId) {
          return res.status(409).json({ mensaje: 'Este usuario ya está registrado como repartidor.', detalle: error.message });
      }
      if (error.keyPattern && error.keyPattern.telefono) {
          return res.status(409).json({ mensaje: 'Ya existe un repartidor con este número de teléfono.', detalle: error.message });
      }
    }
    if (error.name === 'ValidationError') { // Errores de validación de Mongoose
      return res.status(400).json({ mensaje: 'Error de validación al crear el repartidor.', detalle: error.message });
    }
    console.error('Error al crear el repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear el repartidor.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/repartidores
 * @desc Lista todos los repartidores (opcionalmente filtrados por estado o disponibilidad)
 * @access Admin / Gerencia
 * @queryParam estado (string): 'disponible', 'en_entrega', 'fuera_de_servicio'
 * @queryParam disponible (boolean): true para disponibles, false para no disponibles
 */
exports.listarRepartidores = async (req, res) => {
  try {
    const query = {};
    if (req.query.estado) {
      query.estado = req.query.estado;
    }
    if (req.query.disponible !== undefined) {
      query.disponible = req.query.disponible === 'true';
    }

    const repartidores = await Repartidor.find(query)
      .populate('usuarioId', 'email') // Popula el email del usuario asociado
      .sort({ nombre: 1 });

    res.status(200).json(repartidores);
  } catch (error) {
    console.error('Error al listar repartidores:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al listar repartidores.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/repartidores/:id
 * @desc Obtiene un repartidor por su ID
 * @access Admin / Gerencia
 */
exports.obtenerRepartidorByID = async (req, res) => {
  try {
    const repartidor = await Repartidor.findById(req.params.id)
      .populate('usuarioId', 'email'); // Popula el email del usuario asociado

    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }
    res.status(200).json(repartidor);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    console.error('Error al obtener repartidor por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener repartidor.',
      error: error.message
    });
  }
};

/**
 * @route PUT /api/repartidores/:id
 * @desc Actualiza un repartidor existente por su ID
 * @access Admin / Gerencia
 */
exports.actualizarRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si se intenta cambiar el usuarioId, verificar que no esté en uso
    if (updateData.usuarioId) {
      const usuarioExistente = await Usuario.findById(updateData.usuarioId);
      if (!usuarioExistente) {
        return res.status(404).json({ mensaje: 'El nuevo usuario asociado no fue encontrado.' });
      }
      const repartidorExistenteConUsuario = await Repartidor.findOne({ usuarioId: updateData.usuarioId, _id: { $ne: id } });
      if (repartidorExistenteConUsuario) {
        return res.status(409).json({ mensaje: 'Este usuario ya está registrado como repartidor.' });
      }
    }
    // Si se intenta cambiar el teléfono, verificar que no esté en uso
    if (updateData.telefono) {
        const repartidorConMismoTelefono = await Repartidor.findOne({ telefono: updateData.telefono, _id: { $ne: id } });
        if (repartidorConMismoTelefono) {
            return res.status(409).json({ mensaje: 'Ya existe otro repartidor con este número de teléfono.' });
        }
    }

    // El hook pre-findOneAndUpdate del modelo manejará el ajuste de 'disponible' si 'estado' es actualizado.

    const repartidorActualizado = await Repartidor.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!repartidorActualizado) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado para actualizar.' });
    }
    res.status(200).json({
      mensaje: 'Repartidor actualizado exitosamente.',
      repartidor: repartidorActualizado
    });
  } catch (error) {
    if (error.code === 11000) { // Errores de clave duplicada (usuarioId, telefono)
        return res.status(409).json({ mensaje: 'El ID de usuario o teléfono ya está en uso por otro repartidor.', detalle: error.message });
    }
    if (error.name === 'ValidationError') { // Errores de validación de Mongoose
      return res.status(400).json({ mensaje: 'Error de validación al actualizar el repartidor.', detalle: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    console.error('Error al actualizar el repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar el repartidor.',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/repartidores/:id
 * @desc Elimina un repartidor por su ID
 * @access Admin
 */
exports.eliminarRepartidor = async (req, res) => {
  try {
    const repartidorEliminado = await Repartidor.findByIdAndDelete(req.params.id);
    if (!repartidorEliminado) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado para eliminar.' });
    }
    res.status(200).json({
      mensaje: 'Repartidor eliminado exitosamente.'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    console.error('Error al eliminar el repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar el repartidor.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/repartidores/:id/estado
 * @desc Cambia el estado de un repartidor
 * @body {string} nuevoEstado - 'disponible', 'en_entrega', 'fuera_de_servicio'
 * @access Admin / Gerencia
 */
exports.cambiarEstadoRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    if (!nuevoEstado) {
      return res.status(400).json({ mensaje: 'Se requiere el campo "nuevoEstado".' });
    }

    const repartidor = await Repartidor.findById(id);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    // Usar el método de instancia para cambiar el estado y actualizar la disponibilidad
    await repartidor.cambiarEstado(nuevoEstado);

    res.status(200).json({
      mensaje: `Estado del repartidor actualizado a "${repartidor.estado}".`,
      repartidor: repartidor
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    if (error.name === 'Error' && error.message.includes('Estado inválido')) { // Error custom del método
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al cambiar el estado del repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al cambiar el estado del repartidor.',
      error: error.message
    });
  }
};

/**
 * @route PATCH /api/repartidores/:id/registrar-entrega
 * @desc Registra una entrega en el historial del repartidor y actualiza su calificación promedio.
 * @body {Object} entrega - { pedidoId: '...', calificacionCliente: N, fechaEntrega: '...' }
 * @access Sistema (llamado internamente por el módulo de pedidos/ventas)
 */
exports.registrarEntregaRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    const { pedidoId, calificacionCliente } = req.body;

    const repartidor = await Repartidor.findById(id);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    await repartidor.registrarEntrega({ pedidoId, calificacionCliente });

    res.status(200).json({
      mensaje: 'Entrega registrada y calificación actualizada exitosamente.',
      repartidor: repartidor
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    if (error.name === 'ValidationError' || error.message.includes('calificación') || error.message.includes('entrega')) {
      return res.status(400).json({ mensaje: error.message, detalle: error.message });
    }
    console.error('Error al registrar entrega del repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al registrar la entrega del repartidor.',
      error: error.message
    });
  }
};