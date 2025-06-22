const pedidoController = require('../controllers/pedido.controller');
const express = require('express');
const router = express.Router();
// Rutas para el manejo de pedidos
router.post('/', pedidoController.crearPedido);
router.get('/listar', pedidoController.listarPedidos);
router.get('/listar/:id', pedidoController.obtenerPedidoPorId);
router.put('/actualizar/:id', pedidoController.actualizarPedido);
router.delete('/eliminar/:id', pedidoController.eliminarPedido);
router.get('/filtrar', pedidoController.getPedidosEstado);
router.get('/cliente/:idCliente', pedidoController.getPedidosCliente);
// router.get('/filtrados', autCtrl.verifyToken, pedidoController.getPedidosFiltrados);


module.exports = router;
// Exporta el router para usarlo en otros archivos