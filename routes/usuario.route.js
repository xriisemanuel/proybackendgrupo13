const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas de autenticación
router.post('/login', usuarioController.loginUsuario);
router.post('/logout', usuarioController.logout); // El logout en REST es más un "olvido" del token por el cliente
router.post('/recuperar-password', usuarioController.recuperarPassword); // Para iniciar el proceso de recuperación

// Rutas para la gestión de usuarios (CRUD)
// Posiblemente, estas rutas deberían estar protegidas por un middleware de autenticación y autorización
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ usuarioController.crearUsuario);
router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'editor']),*/ usuarioController.listarUsuarios);
router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'editor', 'usuario']),*/ usuarioController.obtenerUsuarioPorId);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'usuario']),*/ usuarioController.actualizarUsuario);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ usuarioController.eliminarUsuario);
router.post('/restablecer-password/:token', usuarioController.restablecerPassword);
// Ruta para cambiar contraseña (puede ser para el usuario autenticado)
router.put('/cambiar-password/:id',  /*authMiddleware.autenticar,*/ usuarioController.cambiarPassword);

// Si necesitas una ruta específica para listar usuarios por rol
// router.get('/por-rol/:rolId', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ usuarioController.listarUsuariosPorRol);


module.exports = router;