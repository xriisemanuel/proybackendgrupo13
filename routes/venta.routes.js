const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas para la gestión de Ventas
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.crearVenta);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.obtenerVentas);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.obtenerVentaPorId);

// Rutas de funcionalidades específicas
router.get('/cliente/:clienteId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ ventaController.ventasPorCliente);
router.get('/por-fecha', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.ventasPorFecha);
router.get('/total', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ventaController.totalVentas);

router.post('/:id/procesar-pago', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.procesarPago);
router.post('/:id/generar-factura', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ ventaController.generarFactura);

// No es necesario una ruta específica para confirmarPago si procesarPago ya lo maneja.

module.exports = router;




// const express = require('express');
// const router = express.Router();

// const {
//   crearVenta,
//   obtenerVentas,
//   ventasPorCliente,
//   ventasPorFecha,
//   totalVentas,
//   procesarPago,
//   generarFactura,
//   confirmarPago
// } = require('../controllers/venta.controller');


// // Crear una nueva venta
// router.post('/', crearVenta);

// // Obtener todas las ventas
// router.get('/', obtenerVentas);

// // Obtener ventas por cliente
// router.get('/cliente/:clienteId', ventasPorCliente);

// // Filtrar ventas por fecha (query: desde=...&hasta=...)
// router.get('/fecha', ventasPorFecha);

// // Obtener total vendido
// router.get('/total/general', totalVentas);

// // Procesar pago
// router.post('/:id/procesar-pago', procesarPago);

// // Generar factura
// router.post('/:id/generar-factura', generarFactura);

// // Confirmar pago
// router.post('/:id/confirmar-pago', confirmarPago);

// module.exports = router;
