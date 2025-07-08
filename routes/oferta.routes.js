const express = require('express');
const router = express.Router();
const ofertaController = require('../controllers/oferta.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Rutas CRUD para Ofertas
router.post('/', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.crearOferta);
router.get('/', ofertaController.obtenerOfertas); // GET público
router.get('/:id', ofertaController.obtenerOfertaPorId); // GET público
router.put('/:id', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.editarOferta);
router.delete('/:id', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.borrarOfertaPorId);

// Rutas de funcionalidades específicas
router.patch('/:id/activar', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.activarOferta);
router.patch('/:id/desactivar', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.desactivarOferta);
router.get('/producto/:productId', ofertaController.obtenerOfertasPorProducto); // GET público

module.exports = router;