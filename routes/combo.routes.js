const express = require('express');
const router = express.Router();
const comboController = require('../controllers/comboController');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Combos
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ comboController.crearCombo);
router.get('/', /*authMiddleware.autenticar,*/ comboController.listarCombos);
router.get('/:id', /*authMiddleware.autenticar,*/ comboController.obtenerComboByID);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ comboController.actualizarCombo);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ comboController.eliminarCombo);

// Rutas de funcionalidades específicas
router.patch('/:id/activar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ comboController.activarCombo);
router.patch('/:id/desactivar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ comboController.desactivarCombo);


module.exports = router;