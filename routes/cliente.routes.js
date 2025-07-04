const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Clientes
/**
 * @route POST /api/clientes
 * @desc Crear un nuevo perfil de cliente para un usuario existente
 * @access Admin
 */
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ clienteController.createCliente);

/**
 * @route GET /api/clientes
 * @desc Obtener todos los clientes
 * @access Admin
 */
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ clienteController.getClientes);

/**
 * @route GET /api/clientes/:id
 * @desc Obtener un cliente por ID
 * @access Admin, Cliente (para su propio perfil)
 */
router.get('/:id', /*authMiddleware.autenticar,*/ clienteController.getClienteById);

/**
 * @route PUT /api/clientes/:id
 * @desc Actualizar un cliente por ID
 * @access Admin, Cliente (para su propio perfil)
 */
router.put('/:id', /*authMiddleware.autenticar,*/ clienteController.updateCliente);

/**
 * @route DELETE /api/clientes/:id
 * @desc Eliminar un cliente por ID
 * @access Admin
 */
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ clienteController.deleteCliente);

// Las rutas para historial-pedidos y descuento-fidelidad no están implementadas en el controlador actual.
// Si necesitas estas funcionalidades, deberás añadir las funciones correspondientes en cliente.controller.js
// y luego descomentar o añadir estas rutas aquí.
// router.get('/:id/historial-pedidos', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'cliente']),*/ clienteController.obtenerHistorialPedidos);
// router.get('/:id/descuento-fidelidad', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'cliente']),*/ clienteController.calcularDescuentoFidelidad);


module.exports = router;
