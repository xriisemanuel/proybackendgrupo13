const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
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