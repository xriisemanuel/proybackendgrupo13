// proyecto/backend/routes/imageGeneration.routes.js
const router = require('express').Router();
const imageGenerationController = require('../controllers/imageGeneration.controller');
const { autenticar } = require('../middleware/auth'); // Importa la función de autenticación correcta

// Define la ruta POST para generar imágenes
// Protege esta ruta con 'autenticar' para asegurar que solo usuarios logueados puedan usarla
router.post('/generate-image', autenticar, imageGenerationController.generateImage);

module.exports = router;