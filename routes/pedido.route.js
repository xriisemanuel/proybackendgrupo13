const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Pedidos
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['cliente', 'empleado']),*/ pedidoController.crearPedido);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.listarPedidos);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ pedidoController.obtenerPedidoPorId);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.actualizarPedido);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ pedidoController.eliminarPedido);

// Rutas de funcionalidades específicas de Pedidos
router.get('/estado/:estado', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.getPedidosEstado);
router.get('/cliente/:clienteId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ pedidoController.getPedidosCliente);
router.get('/filtrados', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.getPedidosFiltrados); // Usará query params

router.patch('/:id/estado', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.cambiarEstado);
router.patch('/:id/asignar-repartidor', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.asignarRepartidor);
router.patch('/:id/aplicar-descuentos', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ pedidoController.aplicarDescuentos);

// 'generarFactura' está en ventaController, si lo necesitas aquí, replica la lógica
// router.post('/:id/generar-factura', /* ... */ pedidoController.generarFactura); 

module.exports = router;