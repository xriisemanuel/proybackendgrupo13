const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacion.controller');
const authMiddleware = require('../middleware/auth'); // Habilitar middleware de autenticación

// Rutas CRUD para Calificaciones
router.post('/', authMiddleware.autenticar, authMiddleware.autorizar(['cliente']), calificacionController.crearCalificacion);
router.get('/', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']), calificacionController.obtenerCalificaciones);
router.get('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']), calificacionController.obtenerCalificacionPorId);
router.delete('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['cliente']), calificacionController.eliminarCalificacion);

// Rutas de funcionalidades específicas
router.get('/cliente/:clienteId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']), calificacionController.getCalificacionesPorCliente);
router.get('/pedido/:pedidoId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']), calificacionController.getCalificacionesPorPedido);
router.get('/repartidor/:repartidorId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'repartidor']), calificacionController.getCalificacionesPorRepartidor);
router.get('/producto-promedio/:productoId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']), calificacionController.getCalificacionesPromedioProducto);


module.exports = router;



// const express = require('express');
// const router = express.Router();
// const {
//   crearCalificacion,
//   obtenerCalificaciones,
//   actualizarCalificacion,
//   eliminarCalificacion
// } = require('../controllers/calificacion.controller');


// // Crear una nueva calificación
// router.post('/', crearCalificacion);

// // Obtener todas las calificaciones
// router.get('/', obtenerCalificaciones);

// // Actualizar una calificación por ID
// router.put('/:id', actualizarCalificacion);

// // Eliminar una calificación por ID
// router.delete('/:id', eliminarCalificacion);

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const {
//   crearCalificacion,
//   obtenerCalificaciones,
//   actualizarCalificacion,
//   eliminarCalificacion
// } = require('../controllers/calificacion.controller');


// // Crear una nueva calificación
// router.post('/', crearCalificacion);

// // Obtener todas las calificaciones
// router.get('/', obtenerCalificaciones);

// // Actualizar una calificación por ID
// router.put('/:id', actualizarCalificacion);

// // Eliminar una calificación por ID
// router.delete('/:id', eliminarCalificacion);

// module.exports = router;
