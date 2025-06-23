const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Productos
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ productoController.createProducto);
router.get('/', /*authMiddleware.autenticar,*/ productoController.getProductos);
router.get('/:id', /*authMiddleware.autenticar,*/ productoController.getProducto);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ productoController.editProducto);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ productoController.deleteProducto);

// Rutas de funcionalidades específicas de Productos
router.get('/categoria/:categoriaId', /*authMiddleware.autenticar,*/ productoController.getProductoPorCategoria); // Más específico: productos de una categoría
router.get('/:id/disponibilidad', /*authMiddleware.autenticar,*/ productoController.verificarDisponibilidadProducto);
router.patch('/:id/stock', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ productoController.actualizarStockProducto);
router.patch('/:id/popularidad/increment', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin', 'empleado']),*/ productoController.aumentarPopularidad); // Para incrementar popularidad

module.exports = router;