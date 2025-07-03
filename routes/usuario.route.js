    const express = require('express');
    const router = express.Router();
    const usuarioController = require('../controllers/usuario.controller');
    // const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

    // Rutas para la gestión de usuarios (CRUD)
    // Estas rutas deberían estar protegidas por un middleware de autenticación y autorización
    router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ usuarioController.createUsuario); // Usar createUsuario
    router.get('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'editor']),*/ usuarioController.getUsuarios); // Usar getUsuarios
    router.get('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'editor', 'usuario']),*/ usuarioController.getUsuarioById); // Usar getUsuarioById
    router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'usuario']),*/ usuarioController.updateUsuario); // Usar updateUsuario
    router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ usuarioController.deleteUsuario); // Usar deleteUsuario

    // Las rutas de autenticación (login, logout, recuperar-password, cambiar-password)
    // DEBEN estar en auth.routes.js y ser manejadas por auth.controller.js.
    // Si las necesitas, asegúrate de que estén definidas allí.
    // router.post('/login', authController.loginUser); // Ejemplo de dónde debería estar
    // router.post('/register', authController.registerUser); // Ejemplo de dónde debería estar

    module.exports = router;
    