const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Rutas públicas (GET)
router.get('/', comboController.listarCombos);
router.get('/:id', comboController.obtenerComboByID);

// Rutas protegidas (POST, PUT, DELETE, PATCH)
router.post('/', autenticar, autorizar(['admin']), comboController.crearCombo);
router.put('/:id', autenticar, autorizar(['admin']), comboController.actualizarCombo);
router.delete('/:id', autenticar, autorizar(['admin']), comboController.eliminarCombo);
router.patch('/:id/activar', autenticar, autorizar(['admin']), comboController.activarCombo);
router.patch('/:id/desactivar', autenticar, autorizar(['admin']), comboController.desactivarCombo);

module.exports = router;