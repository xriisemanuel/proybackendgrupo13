const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para el registro de un nuevo usuario.
// Aquí se puede crear un Usuario y, si es 'cliente', también un registro en la colección Cliente.
router.post('/register', authController.registerUser);

// Ruta para el inicio de sesión.
// Autentica las credenciales y devuelve un JWT.
router.post('/login', authController.loginUser);

module.exports = router;
