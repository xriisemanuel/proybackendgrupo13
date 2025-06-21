const usuarioController = require('../controllers/usuario.controller');
const express = require('express');
const router = express.Router();
// Rutas para el manejo de usuarios
router.post('/crear', usuarioController.crearUsuario);
router.get('/listar', usuarioController.listarUsuarios);
router.get('/listar/:id', usuarioController.obtenerUsuarioPorId);
router.put('/actualizar/:id', usuarioController.actualizarUsuario);
router.delete('/eliminar/:id', usuarioController.eliminarUsuario);
router.post('/login', usuarioController.loginUsuario);
router.post('/cambiar-password', usuarioController.cambiarPassword);
router.post('/recuperar-password', usuarioController.recuperarPassword);
// router.post('/verificar-token', usuarioController.verificarToken);
router.post('/enviar-email', usuarioController.enviarEmail);

module.exports = router;
// Este archivo define las rutas para manejar las operaciones relacionadas con los usuarios.