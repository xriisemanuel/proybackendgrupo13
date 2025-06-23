const Pedido = require('../models/Pedido'); // Asegúrate que el nombre del archivo sea 'Pedido.js' con mayúscula inicial
const Cliente = require('../models/cliente.model'); // Asegúrate que el nombre del archivo sea 'Cliente.js' con mayúscula inicial
const Producto = require('../models/producto'); // Asegúrate que el nombre del archivo sea 'Producto.js' con mayúscula inicial
const Repartidor = require('../models/Repartidor'); // Asegúrate que el nombre del archivo sea 'Repartidor.js' con mayúscula inicial
const emailService = require('../services/emailService'); // Para notificaciones por email

// --- Operaciones CRUD Básicas y Específicas de Pedido ---

exports.crearPedido = async (req, res) => {
  try {
    const { clienteId, detalleProductos, direccionEntrega, metodoPago, descuentos = 0, costoEnvio = 0, observaciones } = req.body;

    // 1. Verificar existencia del cliente
    const cliente = await Cliente.findById(clienteId);
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
      clienteId,
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
      const emailSubject = `Confirmación de tu pedido #${nuevoPedido._id} - [Empresa]`;
      const emailText = `Hola ${cliente.nombre},\n\nTu pedido ha sido recibido. Total: $${nuevoPedido.total}. Estado: ${nuevoPedido.estado}.\n\nGracias por tu compra!`;
      const emailHtml = `<p>Hola ${cliente.nombre},</p><p>Tu pedido <strong>#${nuevoPedido._id}</strong> ha sido recibido con éxito. El monto total es de <strong>$${nuevoPedido.total}</strong>.</p><p>Estado actual: <strong>${nuevoPedido.estado}</strong>.</p><p>Gracias por tu compra!</p>`;
      await emailService.enviarEmail(clienteEmail, emailSubject, emailText, emailHtml);
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
    const pedidos = await Pedido.find({})
      .populate('clienteId', 'nombre apellido email telefono')
      .populate('repartidorId', 'nombre apellido telefono');
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
    const pedido = await Pedido.findById(req.params.id)
      .populate('clienteId', 'nombre apellido email telefono')
      .populate('repartidorId', 'nombre apellido telefono');
    if (!pedido) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
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
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si se modifican los detalles de los productos, el pre-save hook se encargará de recalcular
    // los subtotales individuales y el total del pedido.
    // También se podría necesitar lógica aquí para ajustar stock si las cantidades cambian.
    // Esta es una operación más compleja y se recomienda manejarla con cuidado.
    // Por simplicidad, el pre-save hook del modelo ya manejará el recalculo del total.

    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!pedidoActualizado) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado para actualizar'
      });
    }
    res.status(200).json({
      mensaje: 'Pedido actualizado exitosamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al actualizar el pedido',
      error: error.message
    });
  }
};

exports.eliminarPedido = async (req, res) => {
  try {
    const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedidoEliminado) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado para eliminar'
      });
    }
    
    // **Devolver el stock de los productos al ser eliminado el pedido**
    for (const item of pedidoEliminado.detalleProductos) {
      await Producto.findByIdAndUpdate(item.productoId, { $inc: { stock: item.cantidad } });
    }

    res.status(200).json({
      mensaje: 'Pedido eliminado exitosamente. Stock de productos reestablecido.'
    });
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
    const pedidos = await Pedido.find({ estado: estado })
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
    const pedidos = await Pedido.find({ clienteId: clienteId })
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
    const query = {};

    if (estado) query.estado = estado;
    if (clienteId) query.clienteId = clienteId;
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
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const estadosValidos = pedido.schema.path('estado').enumValues;
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: `Estado '${nuevoEstado}' no es un estado válido. Estados permitidos: ${estadosValidos.join(', ')}` });
    }

    pedido.estado = nuevoEstado;
    await pedido.save();

    // Opcional: Notificar al cliente sobre el cambio de estado
    const cliente = await Cliente.findById(pedido.clienteId);
    if (cliente && cliente.email && emailService && typeof emailService.enviarEmail === 'function') {
      const emailSubject = `Actualización de estado de tu pedido #${pedido._id} - [Empresa]`;
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
    pedido.estado = 'en_envio'; // Sugerencia de cambio de estado al asignar repartidor
    await pedido.save();

    // Opcional: Notificar al repartidor (ej. SMS)
    // if (repartidor.telefono) {
    //   // Lógica para enviar SMS
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
  try {
    const { id } = req.params;
    const { montoDescuento } = req.body;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (montoDescuento < 0 || montoDescuento > pedido.subtotal) {
      return res.status(400).json({ mensaje: 'Monto de descuento inválido. No puede ser negativo o exceder el subtotal.' });
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