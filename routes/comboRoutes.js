// routes/comboRoutes.js
const express = require('express');
const router = express.Router(); // Router de Express para definir rutas
const comboController = require('../controllers/comboController'); // Importa el controlador de combos

// Rutas para Combos
// api/combos
router.post('/', comboController.crearCombo);              // Crear un nuevo combo
router.get('/', comboController.obtenerCombos);            // Obtener todos los combos
router.get('/:id', comboController.obtenerComboPorId);     // Obtener un combo por ID
router.put('/:id', comboController.actualizarCombo);       // Actualizar un combo por ID
router.delete('/:id', comboController.eliminarCombo);      // Eliminar un combo por ID

module.exports = router;