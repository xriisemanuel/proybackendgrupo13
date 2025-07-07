// pedido.route.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');

// Rutas CRUD para Pedidos
router.post('/', pedidoController.crearPedido);
router.get('/', pedidoController.listarPedidos); // Ajustar roles según tu lógica
router.get('/:id', pedidoController.obtenerPedidoPorId);
router.put('/:id', pedidoController.actualizarPedido);
router.delete('/:id', pedidoController.eliminarPedido);

// Rutas de funcionalidades específicas de Pedidos
router.get('/estado/:estado', pedidoController.getPedidosEstado);
router.get('/cliente/:clienteId', pedidoController.getPedidosCliente);
router.get('/filtrados', pedidoController.getPedidosFiltrados); // Usará query params

router.patch('/:id/estado', pedidoController.cambiarEstado); // Roles que pueden cambiar estado
router.patch('/:id/asignar-repartidor', pedidoController.asignarRepartidor);
router.patch('/:id/aplicar-descuentos', pedidoController.aplicarDescuentos);

module.exports = router;