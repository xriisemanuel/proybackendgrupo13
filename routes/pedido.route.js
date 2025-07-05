// pedido.route.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const authMiddleware = require('../middleware/auth'); // Asegúrate de que esta ruta sea correcta y el archivo exista

// Rutas CRUD para Pedidos
router.post('/', authMiddleware.autenticar, authMiddleware.autorizar(['cliente']), pedidoController.crearPedido);
router.get('/', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'cliente', 'repartidor']), pedidoController.listarPedidos); // Ajustar roles según tu lógica
router.get('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'cliente', 'repartidor']), pedidoController.obtenerPedidoPorId);
router.put('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas']), pedidoController.actualizarPedido);
router.delete('/:id', authMiddleware.autenticar, authMiddleware.autorizar(['admin']), pedidoController.eliminarPedido);

// Rutas de funcionalidades específicas de Pedidos
router.get('/estado/:estado', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'repartidor', 'cliente']), pedidoController.getPedidosEstado);
router.get('/cliente/:clienteId', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas', 'cliente']), pedidoController.getPedidosCliente);
router.get('/filtrados', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'supervisor_ventas', 'repartidor', 'cliente']), pedidoController.getPedidosFiltrados); // Usará query params

router.patch('/:id/estado', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_cocina', 'repartidor', 'supervisor_ventas']), pedidoController.cambiarEstado); // Roles que pueden cambiar estado
router.patch('/:id/asignar-repartidor', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas']), pedidoController.asignarRepartidor);
router.patch('/:id/aplicar-descuentos', authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'supervisor_ventas']), pedidoController.aplicarDescuentos);

module.exports = router;