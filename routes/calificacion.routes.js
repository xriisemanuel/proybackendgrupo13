const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacionController');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Calificaciones
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['cliente']),*/ calificacionController.crearCalificacion);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ calificacionController.obtenerCalificaciones);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ calificacionController.obtenerCalificacionPorId);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ calificacionController.eliminarCalificacion);

// Rutas de funcionalidades específicas
router.get('/cliente/:clienteId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ calificacionController.getCalificacionesPorCliente);
router.get('/pedido/:pedidoId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ calificacionController.getCalificacionesPorPedido);
router.get('/producto-promedio/:productoId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ calificacionController.getCalificacionesPromedioProducto);


module.exports = router;