const express = require('express');
const router = express.Router();
const ofertaController = require('../controllers/oferta.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Rutas públicas (GET)
router.get('/', ofertaController.obtenerOfertas);
// Obtener todos los productos en oferta con la información de la oferta aplicada
router.get('/productos-en-oferta', ofertaController.obtenerProductosEnOferta);

// Rutas de obtención de ofertas individuales
router.get('/:id', ofertaController.obtenerOfertaPorId);
router.get('/producto/:productId', ofertaController.obtenerOfertasPorProducto);

// Rutas protegidas (POST, PUT, DELETE, PATCH)
router.post('/', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.crearOferta);
router.put('/:id', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.editarOferta);
router.delete('/:id', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.borrarOfertaPorId);
router.patch('/:id/activar', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.activarOferta);
router.patch('/:id/desactivar', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaController.desactivarOferta);

module.exports = router;