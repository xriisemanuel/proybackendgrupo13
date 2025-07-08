// proyecto/backend/routes/cliente.routes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');

// Rutas CRUD para Clientes con protección
router.post('/', clienteController.createCliente);
router.get('/', clienteController.getClientes);
// Un cliente puede ver/actualizar su propio perfil, un admin cualquiera. La lógica fina está en el controlador.
router.get('/:id', clienteController.getClienteById);
router.get('/by-usuario/:usuarioId', clienteController.getClienteByUsuarioId);
router.put('/:id', clienteController.updateCliente);
router.delete('/:id', clienteController.deleteCliente);

// Las rutas para historial-pedidos y descuento-fidelidad (si las implementas)
// router.get('/:id/historial-pedidos', autenticar, autorizar(['admin', 'cliente']), clienteController.obtenerHistorialPedidos);
// router.get('/:id/descuento-fidelidad', autenticar, autorizar(['admin', 'cliente']), clienteController.calcularDescuentoFidelidad);

module.exports = router;