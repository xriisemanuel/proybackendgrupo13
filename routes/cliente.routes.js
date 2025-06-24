const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Clientes
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ clienteController.crearCliente);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ clienteController.obtenerClientes);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado', 'cliente']),*/ clienteController.obtenerClientePorId);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'cliente']),*/ clienteController.actualizarCliente);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ clienteController.eliminarCliente);

// Rutas de funcionalidades específicas
router.get('/:id/historial-pedidos', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'cliente']),*/ clienteController.obtenerHistorialPedidos);
router.get('/:id/descuento-fidelidad', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'cliente']),*/ clienteController.calcularDescuentoFidelidad);


module.exports = router;