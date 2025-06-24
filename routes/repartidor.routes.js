const express = require('express');
const router = express.Router();
const repartidorController = require('../controllers/repartidor.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Repartidores
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ repartidorController.crearRepartidor);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'gerencia']),*/ repartidorController.listarRepartidores);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'gerencia', 'repartidor']),*/ repartidorController.obtenerRepartidorByID); // Un repartidor podría ver su propio perfil
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'gerencia']),*/ repartidorController.actualizarRepartidor);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ repartidorController.eliminarRepartidor);

// Rutas de funcionalidades específicas
router.patch('/:id/estado', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'gerencia', 'repartidor']),*/ repartidorController.cambiarEstadoRepartidor);
router.patch('/:id/registrar-entrega', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'sistema_pedidos']),*/ repartidorController.registrarEntregaRepartidor); // Esta ruta debería ser llamada por el sistema de pedidos/ventas.

module.exports = router;