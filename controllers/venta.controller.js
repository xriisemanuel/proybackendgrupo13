const Venta = require('../models/Venta');
const Cliente = require('../models/cliente.model'); // Necesario para actualizar puntos del cliente
const Pedido = require('../models/pedido');   // Necesario para verificar el pedido

// --- Operaciones CRUD Básicas y Específicas de Venta ---

exports.crearVenta = async (req, res) => {
  try {
    const { pedidoId, metodoPago } = req.body;

    // 1. Verificar que el pedido exista y no haya sido ya procesado en una venta
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
    }

    const ventaExistente = await Venta.findOne({ pedidoId: pedido._id });
    if (ventaExistente) {
      return res.status(400).json({ mensaje: 'Este pedido ya ha sido asociado a una venta.' });
    }

    // 2. Crear la venta con los datos del pedido y el método de pago
    const nuevaVenta = new Venta({
      pedidoId: pedido._id,
      clienteId: pedido.clienteId, // Asume que el pedido tiene un clienteId
      montoTotal: pedido.total, // Asume que el pedido tiene un campo 'total'
      metodoPago: metodoPago,
      // fechaVenta se establecerá por defecto

    });

    await nuevaVenta.save();

    // Opcional: Actualizar el estado del pedido a 'completado' o 'pagado'

    await pedido.save();

    res.status(201).json({
      mensaje: 'Venta creada exitosamente',
      venta: nuevaVenta
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la venta',
      error: error.message
    });
  }
};

exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find({})
      .populate('pedidoId')  // Trae todos los datos del pedido
      .populate('clienteId', 'nombre apellido email'); // Trae algunos datos del cliente
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ventas',
      error: error.message
    });
  }
};

exports.obtenerVentaPorId = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('pedidoId')
      .populate('clienteId', 'nombre apellido email');
    if (!venta) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener venta',
      error: error.message
    });
  }
};

exports.ventasPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const ventas = await Venta.find({ clienteId: clienteId })
      .populate('pedidoId')
      .sort({ fechaVenta: -1 }); // Ordenar por fecha descendente
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ventas por cliente',
      error: error.message
    });
  }
};

exports.ventasPorFecha = async (req, res) => {
  // Ejemplo: /api/ventas/por-fecha?desde=2024-01-01&hasta=2024-12-31
  try {
    const { desde, hasta } = req.query;
    const query = {};
    if (desde) query.fechaVenta = { ...query.fechaVenta, $gte: new Date(desde) };
    if (hasta) query.fechaVenta = { ...query.fechaVenta, $lte: new Date(hasta) };

    const ventas = await Venta.find(query)
      .populate('clienteId', 'nombre apellido')
      .sort({ fechaVenta: 1 }); // Ordenar por fecha ascendente
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ventas por rango de fechas',
      error: error.message
    });
  }
};

exports.totalVentas = async (req, res) => {
  try {
    const total = await Venta.aggregate([
      { $group: { _id: null, totalGeneral: { $sum: '$montoTotal' } } }
    ]);
    res.status(200).json({
      mensaje: 'Total de ventas calculado',
      totalGeneral: total.length > 0 ? total[0].totalGeneral : 0
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al calcular el total de ventas',
      error: error.message
    });
  }
};

exports.procesarPago = async (req, res) => {
  // Aquí iría la integración con una pasarela de pago real (Stripe, Mercado Pago, etc.)
  // Por ahora, solo simula el cambio de estado.
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({ mensaje: 'Venta no encontrada.' });
    }
    if (venta.estadoPago === 'completado') {
      return res.status(400).json({ mensaje: 'El pago de esta venta ya ha sido procesado.' });
    }

    // Simulación de procesamiento de pago exitoso
    venta.estadoPago = 'completado';
    await venta.save();

    // Opcional: Otorgar puntos de fidelidad al cliente
    const cliente = await Cliente.findById(venta.clienteId);
    if (cliente) {
      cliente.puntos += Math.floor(venta.montoTotal / 10); // Ejemplo: 1 punto por cada $10 de compra
      await cliente.save();
    }

    res.status(200).json({
      mensaje: 'Pago procesado y venta confirmada.',
      venta: venta,
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al procesar el pago',
      error: error.message
    });
  }
};

exports.generarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({ mensaje: 'Venta no encontrada.' });
    }
    if (venta.estadoPago !== 'completado') {
      return res.status(400).json({ mensaje: 'El pago debe estar completado para generar factura.' });
    }

    // Llama al método del esquema para generar o recuperar el número de factura
    const numeroFactura = await venta.generarNumeroFactura();

    // Aquí podrías generar un PDF de factura y enviarlo o guardarlo
    res.status(200).json({
      mensaje: 'Factura generada exitosamente.',
      numeroFactura: numeroFactura,
      venta: venta
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al generar la factura',
      error: error.message
    });
  }
};

// `confirmarPago()` es redundante con `procesarPago()` si el procesamiento es la confirmación.
// Si se refiere a un proceso de doble confirmación, se podría implementar una función separada.
// Por simplicidad, `procesarPago` ya setea el estado a 'completado'.
