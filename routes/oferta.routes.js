const express = require('express');
const router = express.Router();
const ofertaController = require('../controllers/oferta.controller');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Ofertas
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ofertaController.crearOferta);
router.get('/', /*authMiddleware.autenticar,*/ ofertaController.obtenerOfertas);
router.get('/:id', /*authMiddleware.autenticar,*/ ofertaController.obtenerOfertaPorId);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ofertaController.editarOferta);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ofertaController.borrarOfertaPorId);

// Rutas de funcionalidades específicas
router.patch('/:id/activar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ofertaController.activarOferta);
router.patch('/:id/desactivar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ ofertaController.desactivarOferta);
router.get('/producto/:productId', /*authMiddleware.autenticar,*/ ofertaController.obtenerOfertasPorProducto); // Obtener ofertas para un producto específico

module.exports = router;