// routes/ofertaRoutes.js
const express = require('express');
const router = express.Router();
const ofertaController = require('../controllers/ofertaController'); // Importa el controlador de ofertas

// Rutas para Ofertas
// api/ofertas
router.post('/', ofertaController.crearOferta);               // Crear una nueva oferta
router.get('/', ofertaController.obtenerOfertas);             // Obtener todas las ofertas
router.get('/:id', ofertaController.obtenerOfertaPorId);      // Obtener una oferta por ID
router.put('/:id', ofertaController.actualizarOferta);        // Actualizar una oferta por ID
router.delete('/:id', ofertaController.eliminarOferta);       // Eliminar una oferta por ID

module.exports = router;