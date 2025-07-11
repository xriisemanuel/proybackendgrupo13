const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para el registro de un nuevo usuario.
// Aquí se puede crear un Usuario y, si es 'cliente' o 'repartidor', también un registro en la colección de su perfil.
router.post('/register', authController.registerUser);

// Ruta para el inicio de sesión.
// Autentica las credenciales y devuelve un JWT.
router.post('/login', authController.loginUser);

// Rutas para Google OAuth
router.post('/google', authController.googleLogin);
router.get('/google/url', authController.getGoogleAuthUrl);

module.exports = router;
