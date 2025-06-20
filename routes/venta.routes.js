// routes/venta.routes.js
const express = require('express');
const router = express.Router();

const {
  crearVenta,
  obtenerVentas,
  ventasPorCliente,
  ventasPorFecha,
  totalVentas
} = require('../controllers/venta.controller');

// Ruta base: /api/ventas

// Crear una nueva venta
router.post('/', crearVenta);

// Obtener todas las ventas
router.get('/', obtenerVentas);

// Obtener ventas por cliente
router.get('/cliente/:clienteId', ventasPorCliente);

// Filtrar ventas por fecha (query: desde=...&hasta=...)
router.get('/fecha', ventasPorFecha);

// Obtener total vendido
router.get('/total/general', totalVentas);

module.exports = router;
