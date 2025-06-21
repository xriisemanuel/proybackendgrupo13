const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');

router.post('/', clienteController.crearCliente);
router.get('/', clienteController.obtenerClientes);

module.exports = router;
