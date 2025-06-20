// controllers/venta.controller.js
const Venta = require('../models/Venta');

// ✅ Crear nueva venta
const crearVenta = async (req, res) => {
  try {
    const { clienteId, importeTotal, formaPago } = req.body;

    const nuevaVenta = new Venta({
      clienteId,
      importeTotal,
      formaPago
    });

    await nuevaVenta.save();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear venta', error });
  }
};

// ✅ Obtener todas las ventas
const obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find().populate('clienteId');
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas', error });
  }
};

// ✅ Buscar ventas por cliente
const ventasPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const ventas = await Venta.find({ clienteId });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar ventas por cliente', error });
  }
};

// ✅ Filtrar ventas por fecha (opcional: rango)
const ventasPorFecha = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const filtro = {};

    if (desde && hasta) {
      filtro.fecha = { $gte: new Date(desde), $lte: new Date(hasta) };
    }

    const ventas = await Venta.find(filtro);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al filtrar ventas por fecha', error });
  }
};

// ✅ Obtener total vendido
const totalVentas = async (req, res) => {
  try {
    const total = await Venta.aggregate([
      { $group: { _id: null, total: { $sum: "$importeTotal" } } }
    ]);

    res.json({ total: total[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular total de ventas', error });
  }
};

module.exports = {
  crearVenta,
  obtenerVentas,
  ventasPorCliente,
  ventasPorFecha,
  totalVentas
};


//📘 ¿Qué hace esto?
//Crea nuevas ventas
//Lista todas
//Filtra por cliente o fechas
//Calcula total vendido (para gráficas o métricas)