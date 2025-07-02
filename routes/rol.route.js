const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rol.controller'); // Asegúrate de que la ruta a tu controlador sea correcta

// Rutas para el manejo de roles (RESTful)

// GET /api/rol - Obtener todos los roles
router.get('/', rolController.getRoles);

// POST /api/rol - Crear un nuevo rol
router.post('/', rolController.createRol);

// GET /api/rol/:id - Obtener un rol por ID
router.get('/:id', rolController.getRolById);

// PUT /api/rol/:id - Actualizar un rol por ID
router.put('/:id', rolController.updateRol);

// DELETE /api/rol/:id - Eliminar un rol por ID
router.delete('/:id', rolController.deleteRol);

module.exports = router;

// Exporta el router para usarlo en otros archivos