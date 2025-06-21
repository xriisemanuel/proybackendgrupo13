const rolController = require('../controllers/rol.controller');
const express = require('express');
const router = express.Router();
// Rutas para el manejo de roles
router.post('/crear', rolController.crearRol);
router.get('/listar', rolController.listarRoles);
router.get('/listar/:id', rolController.obtenerRolPorId);
router.put('/actualizar/:id', rolController.actualizarRol);
router.delete('/eliminar/:id', rolController.eliminarRol);

module.exports = router;
// Exporta el router para usarlo en otros archivos