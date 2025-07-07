// proyecto/backend/routes/imageGeneration.routes.js
const express = require('express');
const router = express.Router();
const imageGenerationController = require('../controllers/imageGeneration.controller');
// const { verifyToken } = require('../middleware/auth'); // Ya no es necesario importar aquí si 'autenticar' lo maneja en index.js

// Define la ruta POST para generar imágenes
// La protección se aplica en index.js al montar este router.
router.post('/generate-image', imageGenerationController.generateImage); // No se necesita verifyToken aquí si ya se aplica en index.js

module.exports = router;