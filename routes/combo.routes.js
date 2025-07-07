const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Combos
router.post('/', comboController.crearCombo);
router.get('/', comboController.listarCombos);
router.get('/:id',comboController.obtenerComboByID);
router.put('/:id', comboController.actualizarCombo);
router.delete('/:id', comboController.eliminarCombo);

// Rutas de funcionalidades específicas
router.patch('/:id/activar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ comboController.activarCombo);
router.patch('/:id/desactivar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ comboController.desactivarCombo);


module.exports = router;