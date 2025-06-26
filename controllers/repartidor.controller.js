const Repartidor = require('../models/Repartidor');
const Usuario = require('../models/usuario'); // Necesario para la relación con Usuario

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/repartidores
 * @desc Crea un nuevo repartidor
 * @access Admin
 */
exports.crearRepartidor = async (req, res) => {
  // Solo el Administrador puede crear nuevos repartidores.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden crear repartidores.' });
  }

  try {
    // Incluyo 'vehiculo' y 'numeroLicencia' para el cuerpo de la solicitud, ya que están en el modelo.
    const { usuarioId, nombre, telefono, estado, vehiculo, numeroLicencia } = req.body;

    // 1. Verificar que el usuarioId exista y no esté ya asociado a un repartidor
    // `usuarioId` es `required` en el modelo.
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'El ID de usuario asociado es obligatorio para crear un repartidor.' });
    }

    const usuarioExistente = await Usuario.findById(usuarioId);
    if (!usuarioExistente) {
      return res.status(404).json({ mensaje: 'El usuario asociado no fue encontrado.' });
    }
    // Verifica que el `usuarioId` no esté ya asociado a otro repartidor (unique: true en el modelo)
    const repartidorExistenteConUsuario = await Repartidor.findOne({ usuarioId });
    if (repartidorExistenteConUsuario) {
      return res.status(409).json({ mensaje: 'Este usuario ya está registrado como repartidor.' });
    }

    const nuevoRepartidor = new Repartidor({
      usuarioId,
      nombre,
      telefono,
      vehiculo: vehiculo || '', // Asigna si existe, si no, cadena vacía según el modelo
      numeroLicencia: numeroLicencia || '', // Asigna si existe, si no, cadena vacía según el modelo
      estado: estado || 'disponible', // Usa el estado proporcionado o 'disponible' por defecto
      // `disponible` será establecido por el hook `pre-save` del modelo basado en `estado`.
      // `historialEntregas` y `calificacionPromedio` se inicializan por defecto en el modelo.
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
 * @access Admin / Supervisor de Ventas
 * @queryParam estado (string): 'disponible', 'en_entrega', 'fuera_de_servicio'
 * @queryParam disponible (boolean): true para disponibles, false para no disponibles
 */
exports.listarRepartidores = async (req, res) => {
  // Solo Administrador y Supervisor de Ventas pueden listar todos los repartidores.
  if (!['admin', 'supervisor_ventas'].includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para listar repartidores.' });
  }

  try {
    const query = {};
    if (req.query.estado) {
      query.estado = req.query.estado;
    }
    // El campo 'disponible' en el modelo se controla por el hook pre-save/findOneAndUpdate.
    // Si se filtra por 'disponible' aquí, es importante que el query use el valor correcto del modelo.
    if (req.query.disponible !== undefined) {
      query.disponible = req.query.disponible === 'true';
    }

    const repartidores = await Repartidor.find(query)
      .populate('usuarioId', 'email username') // Popula más campos relevantes del usuario
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
 * @access Admin / Supervisor de Ventas / Propio Repartidor
 */
exports.obtenerRepartidorByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    const repartidor = await Repartidor.findById(id)
      .populate('usuarioId', 'email username');

    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    // Lógica de autorización:
    if (userRole === 'repartidor') {
      if (repartidor.usuarioId.toString() !== userId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver su propio perfil de repartidor.' });
      }
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para ver perfiles de repartidores.' });
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
 * @access Admin / Propio Repartidor (ciertos campos)
 */
exports.actualizarRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    // Lógica de autorización:
    if (userRole === 'repartidor') {
      const repartidorExistente = await Repartidor.findById(id);
      if (!repartidorExistente || repartidorExistente.usuarioId.toString() !== userId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede actualizar su propio perfil de repartidor.' });
      }
      // Restringir qué campos puede actualizar un repartidor sobre sí mismo
      // El campo 'estado' se maneja mejor con 'cambiarEstadoRepartidor'
      const allowedFieldsForRepartidor = ['nombre', 'telefono', 'vehiculo', 'numeroLicencia', 'ubicacionActual'];
      const receivedFields = Object.keys(updateData);
      const disallowedFields = receivedFields.filter(field => !allowedFieldsForRepartidor.includes(field));

      if (disallowedFields.length > 0) {
        return res.status(403).json({ mensaje: `Acceso denegado. No puede actualizar los campos: ${disallowedFields.join(', ')}.` });
      }
      // Para mantener la consistencia, el campo 'estado' debería ser actualizado vía `cambiarEstadoRepartidor`.
      if (updateData.hasOwnProperty('estado')) {
        return res.status(403).json({ mensaje: 'El campo "estado" debe ser actualizado a través de la ruta específica para cambiar estado de repartidor.' });
      }
      // Si el repartidor intenta cambiar usuarioId
      if (updateData.hasOwnProperty('usuarioId')) {
        return res.status(403).json({ mensaje: 'Acceso denegado. No puede modificar el ID de usuario asociado.' });
      }

    } else if (userRole !== 'admin') { // Solo admin tiene permiso general para actualizar cualquier campo
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para actualizar repartidores.' });
    }


    // Si se intenta cambiar el usuarioId (solo para admin), verificar que no esté en uso por otro repartidor
    if (updateData.usuarioId && userRole === 'admin') {
      const usuarioExistente = await Usuario.findById(updateData.usuarioId);
      if (!usuarioExistente) {
        return res.status(404).json({ mensaje: 'El nuevo usuario asociado no fue encontrado.' });
      }
      const repartidorExistenteConUsuario = await Repartidor.findOne({ usuarioId: updateData.usuarioId, _id: { $ne: id } });
      if (repartidorExistenteConUsuario) {
        return res.status(409).json({ mensaje: 'Este usuario ya está registrado como repartidor.' });
      }
    }
    // Si se intenta cambiar el teléfono, verificar que no esté en uso por otro repartidor
    if (updateData.telefono) {
      const repartidorConMismoTelefono = await Repartidor.findOne({ telefono: updateData.telefono, _id: { $ne: id } });
      if (repartidorConMismoTelefono) {
        return res.status(409).json({ mensaje: 'Ya existe otro repartidor con este número de teléfono.' });
      }
    }

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
  // Solo el Administrador puede eliminar repartidores.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden eliminar repartidores.' });
  }

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
 * @access Admin / Supervisor de Ventas / Propio Repartidor
 */
exports.cambiarEstadoRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    if (!nuevoEstado) {
      return res.status(400).json({ mensaje: 'Se requiere el campo "nuevoEstado".' });
    }

    const repartidor = await Repartidor.findById(id);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    // Lógica de autorización para cambiar estado:
    if (userRole === 'repartidor') {
      if (repartidor.usuarioId.toString() !== userId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede cambiar su propio estado.' });
      }
      // Aquí puedes añadir lógica de transición de estados si el repartidor no puede ir de cualquier estado a cualquier otro.
      // Por ejemplo, un repartidor no puede pasar de 'en_entrega' a 'disponible' directamente sin haber 'entregado'.
      // Esta lógica la debería manejar el método 'cambiarEstado' del modelo para consistencia.
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para cambiar el estado de repartidores.' });
    }

    // Usar el método de instancia del modelo para cambiar el estado y actualizar la disponibilidad
    await repartidor.cambiarEstado(nuevoEstado);

    res.status(200).json({
      mensaje: `Estado del repartidor actualizado a "${repartidor.estado}".`,
      repartidor: repartidor
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido.', detalle: error.message });
    }
    // Captura el error específico lanzado por el método 'cambiarEstado' del modelo
    if (error.message.includes('Estado inválido')) {
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
 * @access Propio Repartidor / Admin (si el admin necesita forzar un registro)
 */
exports.registrarEntregaRepartidor = async (req, res) => {
  try {
    const { id } = req.params;
    // Se espera que `fechaEntrega` venga en el `req.body` si no se quiere `Date.now()`
    const { pedidoId, calificacionCliente, fechaEntrega } = req.body;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    const repartidor = await Repartidor.findById(id);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    // Lógica de autorización:
    // - Solo el propio repartidor puede registrar una entrega para sí mismo.
    // - El administrador también puede hacerlo (por ejemplo, para correcciones o gestión manual).
    if (repartidor.usuarioId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede registrar entregas para su propio perfil de repartidor o ser un administrador.' });
    }

    // Validaciones básicas para la entrega antes de llamar al método del modelo
    if (!pedidoId) {
      return res.status(400).json({ mensaje: 'La entrega debe incluir un pedidoId.' });
    }
    if (calificacionCliente !== undefined && (calificacionCliente < 1 || calificacionCliente > 5)) {
      return res.status(400).json({ mensaje: 'La calificación del cliente debe estar entre 1 y 5.' });
    }

    // Llama al método de instancia del modelo para registrar la entrega
    await repartidor.registrarEntrega({ pedidoId, calificacionCliente, fechaEntrega });

    res.status(200).json({
      mensaje: 'Entrega registrada y calificación actualizada exitosamente.',
      repartidor: repartidor
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de repartidor inválido o ID de pedido inválido.', detalle: error.message });
    }
    // Captura errores específicos lanzados por el método 'registrarEntrega' del modelo
    if (error.message.includes('La entrega debe tener al menos un pedidoId.') || error.message.includes('La calificación del cliente debe estar entre 1 y 5.')) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error al registrar entrega del repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al registrar la entrega del repartidor.',
      error: error.message
    });
  }
};
