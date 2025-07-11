const Pedido = require('../models/pedido'); // Asumo 'pedido.model.js' como convención
const Cliente = require('../models/cliente.model'); // Asumo 'cliente.model.js'
const Producto = require('../models/producto'); // Asumo 'producto.model.js'
const Repartidor = require('../models/Repartidor'); // Asumo 'repartidor.model.js'
const emailService = require('../services/emailService'); // Para notificaciones por email
const Usuario = require('../models/usuario'); // Necesario para obtener el clienteId asociado al usuario autenticado

// --- Operaciones CRUD Básicas y Específicas de Pedido ---

exports.crearPedido = async (req, res) => {
  // Solo los clientes pueden crear pedidos.
  // req.usuario.rol es adjuntado por el middleware de autenticación/autorización.
  if (req.usuario.rol !== 'cliente') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo los clientes pueden crear pedidos.' });
  }

  try {
    const { detalleProductos, direccionEntrega, metodoPago, descuentos = 0, costoEnvio = 0, observaciones } = req.body;

    // El clienteId para el pedido debe ser el del usuario autenticado (si es un cliente)
    // Buscamos el ID del registro de Cliente asociado al ID de Usuario autenticado.
    const usuarioAutenticado = await Usuario.findById(req.usuario._id);
    if (!usuarioAutenticado || !usuarioAutenticado.clienteId) {
      return res.status(403).json({ mensaje: 'No se pudo asociar un cliente válido para crear el pedido.' });
    }
    const clienteIdAutenticado = usuarioAutenticado.clienteId;

    // 1. Verificar existencia del cliente (usando el ID del usuario autenticado)
    const cliente = await Cliente.findById(clienteIdAutenticado);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    const productosParaActualizarStock = [];
    const detallesParaPedido = []; // Nuevo array para construir los detalles con subtotales calculados

    // 2. Verificar disponibilidad de productos y preparar detalleProductos con subtotales
    for (const item of detalleProductos) {
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto con ID ${item.productoId} no encontrado.` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ mensaje: `Stock insuficiente para el producto: ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}` });
      }

      // Construye el objeto de detalle del producto, incluyendo el subtotal individual
      const detalleItem = {
        productoId: producto._id,
        nombreProducto: producto.nombre, // Captura el nombre del producto al momento del pedido
        cantidad: item.cantidad,
        precioUnitario: producto.precio, // Captura el precio unitario del producto al momento del pedido
        // El 'subtotal' para cada ítem será calculado automáticamente por el hook pre-save del modelo Pedido
        // No es necesario calcularlo aquí manualmente y pasarlo, ya que el hook lo hará.
      };
      detallesParaPedido.push(detalleItem);

      productosParaActualizarStock.push({
        id: producto._id,
        stockReducir: item.cantidad
      });
    }

    const nuevoPedido = new Pedido({
      clienteId: clienteIdAutenticado, // Usar el ID del cliente autenticado
      detalleProductos: detallesParaPedido, // Usa los detalles ya preparados
      direccionEntrega,
      metodoPago,
      descuentos,
      costoEnvio,
      observaciones,
      // 'subtotal' y 'total' se calcularán automáticamente en el pre-save hook del modelo Pedido
    });

    await nuevoPedido.save(); // Esto activará el pre-save hook para calcular todos los subtotales y el total

    // 3. Reducir stock de productos después de guardar el pedido
    for (const p of productosParaActualizarStock) {
      await Producto.findByIdAndUpdate(p.id, { $inc: { stock: -p.stockReducir } });
    }

    // 4. (Opcional) Enviar email de confirmación
    const clienteEmail = cliente.email;
    if (clienteEmail && emailService && typeof emailService.enviarEmail === 'function') {
      try {
        const emailSubject = `Confirmación de tu pedido #${nuevoPedido._id} - SUBTE`;
        const emailText = `Hola ${cliente.nombre},\n\nTu pedido ha sido recibido. Total: $${nuevoPedido.total}. Estado: ${nuevoPedido.estado}.\n\nGracias por tu compra!`;
        const emailHtml = `<p>Hola ${cliente.nombre},</p><p>Tu pedido <strong>#${nuevoPedido._id}</strong> ha sido recibido con éxito. El monto total es de <strong>$${nuevoPedido.total}</strong>.</p><p>Estado actual: <strong>${nuevoPedido.estado}</strong>.</p><p>Gracias por tu compra!</p>`;
        const emailEnviado = await emailService.enviarEmail(clienteEmail, emailSubject, emailText, emailHtml);
        if (emailEnviado) {
          console.log('Email de confirmación enviado exitosamente');
        } else {
          console.warn('No se pudo enviar el email de confirmación');
        }
      } catch (emailError) {
        console.warn('Error al enviar email de confirmación:', emailError.message);
        // No fallamos el pedido por un error de email
      }
    } else {
      console.warn('Servicio de email no disponible o no configurado para enviar confirmación de pedido.');
    }

    res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear el pedido',
      error: error.message
    });
  }
};

exports.listarPedidos = async (req, res) => {
    try {
        let query = {}; // Objeto base para los filtros de la consulta a la BD

        // Lógica de autorización y filtrado inicial por rol
        const userRole = req.usuario.rol;
        const userId = req.usuario._id; // ID del usuario autenticado

        if (userRole === 'cliente') {
            const usuarioAutenticado = await Usuario.findById(userId);
            if (!usuarioAutenticado || !usuarioAutenticado.clienteId) {
                return res.status(403).json({ mensaje: 'No se pudo asociar un cliente válido para ver pedidos.' });
            }
            query.clienteId = usuarioAutenticado.clienteId;
        } else if (userRole === 'repartidor') {
            const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });
            if (!repartidorAsociado) {
                return res.status(403).json({ mensaje: 'No se pudo asociar un repartidor válido para ver pedidos.' });
            }
            // Los repartidores pueden ver pedidos asignados a ellos O pedidos disponibles para tomar
            // (estados en_envio sin repartidor asignado)
            query.$or = [
                { repartidorId: repartidorAsociado._id },
                { estado: 'en_envio', repartidorId: null }
            ];
        } else if (!['admin', 'supervisor_cocina', 'supervisor_ventas'].includes(userRole)) {
            // Otros roles no especificados no tienen acceso directo a listar todos los pedidos
            return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para listar pedidos.' });
        }

        // --- AÑADIMOS LA LÓGICA DE FILTRADO POR QUERY PARAMS ---
        // Esto permite que roles con acceso general (admin, supervisores) o el mismo repartidor
        // puedan solicitar filtros adicionales.
        // Si el rol ya impuso un filtro (clienteId o repartidorId), se combinará con los query params.

        // Filtrar por repartidorId desde query param (útil para admin/supervisores o depuración)
        // NOTA: Si el usuario es un 'repartidor', su ID de repartidor ya fue añadido a 'query.repartidorId' arriba.
        // Este if solo aplicaría si un admin/supervisor está buscando pedidos de UN repartidor específico.
        if (req.query.repartidorId && userRole !== 'repartidor') { // Evita sobreescribir si ya se filtró por el repartidor logueado
            query.repartidorId = req.query.repartidorId;
        }

        // Filtrar por estados (ej. ?estados=en_envio,confirmado)
        // El frontend enviará esto como `?estados=confirmado,en_preparacion,en_envio`
        if (req.query.estados) {
            console.log('Estados recibidos en backend:', req.query.estados); // Debug
            const estadosArray = req.query.estados.split(',');
            console.log('Estados array en backend:', estadosArray); // Debug
            // Usamos $in para buscar cualquiera de los estados en el array
            query.estado = { $in: estadosArray };
            console.log('Query final en backend:', JSON.stringify(query)); // Debug
        }

        // También considera otros filtros que ya tienes en getPedidosFiltrados
        // Por ejemplo, clienteId, fechaDesde, fechaHasta, si quieres que listarPedidos los soporte también.
        // Para este caso específico del repartidor, solo nos interesan repartidorId y estados.

        const pedidos = await Pedido.find(query)
            .populate({ // Populamos clienteId y su usuarioId anidado
                path: 'clienteId',
                select: 'usuarioId', // Solo selecciona el usuarioId del cliente
                populate: {
                    path: 'usuarioId', // Luego populas el usuarioId dentro del cliente
                    select: 'nombre apellido email' // Selecciona los campos necesarios del usuario
                }
            })
            // Asegúrate de que esta población también incluya 'nombre', 'apellido', etc.
            // si los necesitas en el frontend, como en tu interfaz IRepartidorPopulated.
            // Actualmente tienes 'nombre' y 'apellido' en RepartidorService, pero aquí solo populas 'nombre'.
            .populate('repartidorId', 'nombre apellido telefono'); // Añade 'apellido' y 'telefono' aquí

        console.log('Pedidos encontrados en backend:', pedidos.length); // Debug
        console.log('Estados de pedidos encontrados:', pedidos.map(p => p.estado)); // Debug

        res.status(200).json(pedidos);
    } catch (error) {
        console.error('Error al listar pedidos:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al listar pedidos',
            error: error.message
        });
    }
};

exports.obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    const pedido = await Pedido.findById(id)
      .populate('clienteId', 'nombre apellido email telefono')
      .populate('repartidorId', 'nombre apellido telefono');

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Lógica de autorización para obtener un pedido por ID
    if (userRole === 'cliente') {
      const usuarioAutenticado = await Usuario.findById(userId);
      if (!usuarioAutenticado || !usuarioAutenticado.clienteId || pedido.clienteId.toString() !== usuarioAutenticado.clienteId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver sus propios pedidos.' });
      }
    } else if (userRole === 'repartidor') {
      const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });
      if (!repartidorAsociado || (pedido.repartidorId && pedido.repartidorId.toString() !== repartidorAsociado._id.toString())) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver los pedidos asignados a usted.' });
      }
      // Si el pedido no tiene repartidor asignado, un repartidor no debería verlo
      if (!pedido.repartidorId) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Este pedido no está asignado a usted.' });
      }
    } else if (!['admin', 'supervisor_cocina', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para ver este pedido.' });
    }

    res.status(200).json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener pedido',
      error: error.message
    });
  }
};

exports.actualizarPedido = async (req, res) => {
  // Solo Administrador, Supervisor de Ventas, o Repartidor pueden actualizar un pedido
  // (Repartidor puede actualizar para asignarse a pedidos)
  const allowedRoles = ['admin', 'supervisor_ventas', 'repartidor'];
  if (!allowedRoles.includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores, supervisores de ventas o repartidores pueden actualizar pedidos.' });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    // Lógica de autorización específica para repartidores
    if (userRole === 'repartidor') {
      const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });
      if (!repartidorAsociado) {
        return res.status(403).json({ mensaje: 'No se pudo asociar un repartidor válido.' });
      }

      // Los repartidores solo pueden actualizar pedidos que:
      // 1. Estén asignados a ellos, O
      // 2. No tengan repartidor asignado y estén en estado 'en_envio'
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        return res.status(404).json({ mensaje: 'Pedido no encontrado para actualizar' });
      }

      const puedeActualizar = 
        (pedido.repartidorId && pedido.repartidorId.toString() === repartidorAsociado._id.toString()) ||
        (!pedido.repartidorId && pedido.estado === 'en_envio');

      if (!puedeActualizar) {
        return res.status(403).json({ mensaje: 'Acceso denegado. No puede actualizar este pedido.' });
      }

      // Si el repartidor se está asignando al pedido, actualizar el repartidorId
      if (!pedido.repartidorId && updateData.repartidorId) {
        updateData.repartidorId = repartidorAsociado._id;
      }
    }

    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!pedidoActualizado) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado para actualizar' });
    }
    res.status(200).json({ mensaje: 'Pedido actualizado exitosamente', pedido: pedidoActualizado });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar el pedido',
      error: error.message
    });
  }
};

exports.eliminarPedido = async (req, res) => {
  // Solo el Administrador puede eliminar pedidos
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden eliminar pedidos.' });
  }

  try {
    const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedidoEliminado) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado para eliminar' });
    }

    // Devolver el stock de los productos al ser eliminado el pedido
    for (const item of pedidoEliminado.detalleProductos) {
      await Producto.findByIdAndUpdate(item.productoId, { $inc: { stock: item.cantidad } });
    }

    res.status(200).json({ mensaje: 'Pedido eliminado exitosamente. Stock de productos reestablecido.' });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar el pedido',
      error: error.message
    });
  }
};

// --- Operaciones de Filtrado y Búsqueda ---

exports.getPedidosEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    let query = { estado: estado };
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    // Lógica de autorización para ver pedidos por estado
    if (userRole === 'cliente') {
      const usuarioAutenticado = await Usuario.findById(userId);
      if (!usuarioAutenticado || !usuarioAutenticado.clienteId) {
        return res.status(403).json({ mensaje: 'No se pudo asociar un cliente válido para ver pedidos por estado.' });
      }
      query.clienteId = usuarioAutenticado.clienteId;
    } else if (userRole === 'repartidor') {
      const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });
      if (!repartidorAsociado) {
        return res.status(403).json({ mensaje: 'No se pudo asociar un repartidor válido para ver pedidos por estado.' });
      }
      query.repartidorId = repartidorAsociado._id;
    } else if (!['admin', 'supervisor_cocina', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para listar pedidos por estado.' });
    }

    const pedidos = await Pedido.find(query)
      .populate('clienteId', 'nombre apellido email')
      .populate('repartidorId', 'nombre');
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos por estado:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener pedidos por estado',
      error: error.message
    });
  }
};

exports.getPedidosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;
    let query = { clienteId: clienteId };

    // Lógica de autorización
    if (userRole === 'cliente') {
      const usuarioAutenticado = await Usuario.findById(userId);
      if (!usuarioAutenticado || !usuarioAutenticado.clienteId || usuarioAutenticado.clienteId.toString() !== clienteId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver sus propios pedidos.' });
      }
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para ver pedidos por cliente.' });
    }

    const pedidos = await Pedido.find(query)
      .populate('clienteId', 'nombre apellido email')
      .populate('repartidorId', 'nombre')
      .sort({ fechaPedido: -1 });
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos por cliente:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener pedidos por cliente',
      error: error.message
    });
  }
};

exports.getPedidosFiltrados = async (req, res) => {
  try {
    const { estado, fechaDesde, fechaHasta, clienteId } = req.query;
    let query = {};
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    // Lógica de autorización
    if (userRole === 'cliente') {
      const usuarioAutenticado = await Usuario.findById(userId);
      if (!usuarioAutenticado || !usuarioAutenticado.clienteId) {
        return res.status(403).json({ mensaje: 'No se pudo asociar un cliente válido para ver pedidos filtrados.' });
      }
      query.clienteId = usuarioAutenticado.clienteId;
      // Si un cliente especifica un clienteId diferente en el query, se ignorará o se denegará
      if (clienteId && clienteId.toString() !== usuarioAutenticado.clienteId.toString()) {
        return res.status(403).json({ mensaje: 'Acceso denegado. No puede filtrar por el ID de otro cliente.' });
      }
    } else if (userRole === 'repartidor') {
      const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });
      if (!repartidorAsociado) {
        return res.status(403).json({ mensaje: 'No se pudo asociar un repartidor válido para ver pedidos filtrados.' });
      }
      query.repartidorId = repartidorAsociado._id;
    } else if (!['admin', 'supervisor_cocina', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para filtrar pedidos.' });
    }
    // Si el usuario es admin, supervisor_cocina o supervisor_ventas, puede usar todos los filtros.
    // Si clienteId se provee para admin/supervisor, se usa. Si es cliente/repartidor, ya se aplicó el filtro.
    else { // admin, supervisor_cocina, supervisor_ventas
      if (clienteId) query.clienteId = clienteId;
    }


    if (estado) query.estado = estado;
    if (fechaDesde || fechaHasta) {
      query.fechaPedido = {};
      if (fechaDesde) query.fechaPedido.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaPedido.$lte = new Date(fechaHasta);
    }

    const pedidos = await Pedido.find(query)
      .populate('clienteId', 'nombre apellido email')
      .populate('repartidorId', 'nombre')
      .sort({ fechaPedido: -1 });
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos filtrados:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener pedidos filtrados',
      error: error.message
    });
  }
};

// --- Operaciones de Negocio ---

exports.cambiarEstado = async (req, res) => {
  const { id } = req.params;
  // Permitir ambos nombres de campo para compatibilidad
  const nuevoEstado = req.body.nuevoEstado || req.body.estado;
  const userRole = req.usuario.rol;
  const userId = req.usuario._id;

  try {
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const estadosValidos = pedido.schema.path('estado').enumValues;
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: `Estado '${nuevoEstado}' no es un estado válido. Estados permitidos: ${estadosValidos.join(', ')}` });
    }

    // Lógica de autorización para cambiar estado
    let canChange = false;
    switch (userRole) {
      case 'admin':
        canChange = true; // El administrador puede cambiar a cualquier estado
        break;
      case 'supervisor_cocina':
        // El supervisor de cocina puede cambiar estados relacionados con la preparación
        const estadosCocina = ['pendiente', 'confirmado', 'en_preparacion', 'en_envio'];
        if (estadosCocina.includes(pedido.estado) && estadosCocina.includes(nuevoEstado)) {
          canChange = true;
        } else if (nuevoEstado === 'cancelado') { // Un supervisor de cocina puede cancelar pedidos
          canChange = true;
        }
        break;
      case 'repartidor':
        // El repartidor puede cambiar estados de entrega
        const estadosRepartidor = ['en_envio', 'entregado'];
        const repartidorAsociado = await Repartidor.findOne({ usuarioId: userId });

        if (repartidorAsociado) {
          // Si el pedido está asignado al repartidor, puede cambiar estados de entrega
          if (pedido.repartidorId && pedido.repartidorId.toString() === repartidorAsociado._id.toString()) {
            if (estadosRepartidor.includes(pedido.estado) && estadosRepartidor.includes(nuevoEstado)) {
              canChange = true;
            }
          }
          // Si el pedido no está asignado y está en en_envio, el repartidor puede tomarlo
          else if (!pedido.repartidorId && pedido.estado === 'en_envio' && nuevoEstado === 'en_envio') {
            // Permitir que el repartidor se asigne al pedido
            canChange = true;
            pedido.repartidorId = repartidorAsociado._id;
          }
        }
        break;
      default:
        canChange = false;
    }

    if (!canChange) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para cambiar este estado.' });
    }

    pedido.estado = nuevoEstado;
    await pedido.save();

    // Opcional: Notificar al cliente sobre el cambio de estado
    const cliente = await Cliente.findById(pedido.clienteId);
    if (cliente && cliente.email && emailService && typeof emailService.enviarEmail === 'function') {
      const emailSubject = `Actualización de estado de tu pedido #${pedido._id} - SUBTE`;
      const emailText = `Hola ${cliente.nombre},\n\nEl estado de tu pedido #${pedido._id} ha sido actualizado a: ${nuevoEstado}.\n\nGracias por tu compra!`;
      const emailHtml = `<p>Hola ${cliente.nombre},</p><p>El estado de tu pedido <strong>#${pedido._id}</strong> ha sido actualizado a: <strong>${nuevoEstado}</strong>.</p><p>Gracias por tu compra!</p>`;
      await emailService.enviarEmail(cliente.email, emailSubject, emailText, emailHtml);
    }

    res.status(200).json({
      mensaje: 'Estado del pedido actualizado exitosamente',
      pedido: pedido
    });
  } catch (error) {
    console.error('Error al cambiar el estado del pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al cambiar el estado del pedido',
      error: error.message
    });
  }
};

exports.asignarRepartidor = async (req, res) => {
  // Solo Administrador o Supervisor de Ventas pueden asignar repartidores
  const allowedRoles = ['admin', 'supervisor_ventas'];
  if (!allowedRoles.includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores o supervisores de ventas pueden asignar repartidores.' });
  }

  try {
    const { id } = req.params;
    const { repartidorId, fechaEstimadaEntrega } = req.body;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const repartidor = await Repartidor.findById(repartidorId);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado' });
    }

    pedido.repartidorId = repartidorId;
    pedido.fechaEstimadaEntrega = fechaEstimadaEntrega ? new Date(fechaEstimadaEntrega) : null;
    pedido.estado = 'en_envio'; // Cambio de estado al asignar repartidor
    await pedido.save();

    // Opcional: Notificar al repartidor (ej. SMS) o cliente
    // Esto podría ser a través de un servicio de notificaciones más general.
    // if (repartidor.telefono) {
    //   // Lógica para enviar SMS al repartidor
    // }

    res.status(200).json({
      mensaje: 'Repartidor asignado exitosamente',
      pedido: pedido
    });
  } catch (error) {
    console.error('Error al asignar repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al asignar repartidor',
      error: error.message
    });
  }
};

exports.aplicarDescuentos = async (req, res) => {
  // Solo Administrador o Supervisor de Ventas pueden aplicar descuentos
  const allowedRoles = ['admin', 'supervisor_ventas'];
  if (!allowedRoles.includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores o supervisores de ventas pueden aplicar descuentos.' });
  }

  try {
    const { id } = req.params;
    const { montoDescuento } = req.body;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (montoDescuento < 0 || montoDescuento > pedido.total) { // Comparar con total en lugar de subtotal
      return res.status(400).json({ mensaje: 'Monto de descuento inválido. No puede ser negativo o exceder el total del pedido.' });
    }

    pedido.descuentos = montoDescuento;
    // El pre-save hook del modelo recalculará el total automáticamente al guardar.
    await pedido.save();

    res.status(200).json({
      mensaje: 'Descuentos aplicados exitosamente',
      pedido: pedido
    });
  } catch (error) {
    console.error('Error al aplicar descuentos:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al aplicar descuentos',
      error: error.message
    });
  }
};

// Consideración sobre `generarFactura()`:
// Como se indicó anteriormente, si la factura es un registro de `Venta`,
// esta funcionalidad debería residir en `ventaController.js`.
// Si un `Pedido` puede generar una proforma o una factura preliminar,
// entonces sí tendría sentido implementarla aquí, similar a la lógica en `ventaController`.
