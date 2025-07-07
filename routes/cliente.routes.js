// proyecto/backend/routes/cliente.routes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { autenticar, autorizar } = require('../middleware/auth'); // Importa las funciones correctas

// Rutas CRUD para Clientes con protección
router.post('/', autenticar, autorizar(['admin']), clienteController.createCliente);
router.get('/', autenticar, autorizar(['admin']), clienteController.getClientes);
// Un cliente puede ver/actualizar su propio perfil, un admin cualquiera. La lógica fina está en el controlador.
router.get('/:id', autenticar, autorizar(['admin', 'cliente']), clienteController.getClienteById);
router.put('/:id', autenticar, autorizar(['admin', 'cliente']), clienteController.updateCliente);
router.delete('/:id', autenticar, autorizar(['admin']), clienteController.deleteCliente);

// Las rutas para historial-pedidos y descuento-fidelidad (si las implementas)
// router.get('/:id/historial-pedidos', autenticar, autorizar(['admin', 'cliente']), clienteController.obtenerHistorialPedidos);
// router.get('/:id/descuento-fidelidad', autenticar, autorizar(['admin', 'cliente']), clienteController.calcularDescuentoFidelidad);

module.exports = router;