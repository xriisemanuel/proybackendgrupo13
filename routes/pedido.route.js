// pedido.route.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const authMiddleware = require('../middleware/auth'); // Habilitar middleware de autenticación

// Rutas CRUD para Pedidos
router.post('/', authMiddleware.autenticar, authMiddleware.autorizar(['cliente']), pedidoController.crearPedido);
router.get('/', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'repartidor', 'cliente']), pedidoController.listarPedidos);
router.get('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'repartidor', 'cliente']), pedidoController.obtenerPedidoPorId);
router.put('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas', 'repartidor']), pedidoController.actualizarPedido);
router.delete('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin']), pedidoController.eliminarPedido);

// Rutas de funcionalidades específicas de Pedidos
router.get('/estado/:estado', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas']), pedidoController.getPedidosEstado);
router.get('/cliente/:clienteId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'cliente']), pedidoController.getPedidosCliente);
router.get('/filtrados', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas']), pedidoController.getPedidosFiltrados);

router.patch('/:id/estado', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'repartidor']), pedidoController.cambiarEstado);
router.patch('/:id/asignar-repartidor', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas', 'repartidor']), pedidoController.asignarRepartidor);
router.patch('/:id/aplicar-descuentos', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas']), pedidoController.aplicarDescuentos);

module.exports = router;