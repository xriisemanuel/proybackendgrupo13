const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Rutas CRUD para Combos
router.post('/', autenticar, autorizar(['admin']), comboController.crearCombo);
router.get('/', comboController.listarCombos); // GET público
router.get('/:id', comboController.obtenerComboByID); // GET público
router.put('/:id', autenticar, autorizar(['admin']), comboController.actualizarCombo);
router.delete('/:id', autenticar, autorizar(['admin']), comboController.eliminarCombo);

// Rutas de funcionalidades específicas
router.patch('/:id/activar', autenticar, autorizar(['admin']), comboController.activarCombo);
router.patch('/:id/desactivar', autenticar, autorizar(['admin']), comboController.desactivarCombo);


module.exports = router;