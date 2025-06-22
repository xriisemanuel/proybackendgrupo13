const pedidoController = require('../controllers/pedido.controller');
const express = require('express');
const router = express.Router();
// Rutas para el manejo de pedidos
router.post('/', pedidoController.crearPedido);
router.get('/listar', pedidoController.listarPedidos);
router.get('/listar/:id', pedidoController.obtenerPedidoPorId);
router.put('/actualizar/:id', pedidoController.actualizarPedido);
router.delete('/eliminar/:id', pedidoController.eliminarPedido);
<<<<<<< HEAD
router.get('/filtrar', pedidoController.getPedidosEstado);
router.get('/cliente/:idCliente', pedidoController.getPedidosCliente);
// router.get('/filtrados', autCtrl.verifyToken, pedidoController.getPedidosFiltrados);
=======
router.get('/filtrar', pedidoCtrl.getPedidosEstado);
router.get('/cliente/:idCliente', pedidoCtrl.getPedidosCliente);
router.get('/filtrados', autCtrl.verifyToken, pedidoCtrl.getPedidosFiltrados);
>>>>>>> feature/NildaChoque


module.exports = router;
// Exporta el router para usarlo en otros archivos