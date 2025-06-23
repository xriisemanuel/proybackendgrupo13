const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
// const authMiddleware = require('../middleware/auth'); // Opcional: para proteger rutas

// Rutas CRUD para Categorías
router.post('/', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ categoriaController.crearCategoria);
router.get('/', /*authMiddleware.autenticar,*/ categoriaController.obtenerCategorias);
router.get('/:id', /*authMiddleware.autenticar,*/ categoriaController.obtenerCategoriaPorId);
router.put('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ categoriaController.actualizarCategoria);
router.delete('/:id', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ categoriaController.eliminarCategoria);

// Rutas de funcionalidades específicas
router.get('/:id/productos', /*authMiddleware.autenticar,*/ categoriaController.obtenerProductosDeCategoria);
router.patch('/:id/activar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ categoriaController.activarCategoria);
router.patch('/:id/desactivar', /*authMiddleware.autenticar, authMiddleware.autorizar(['admin']),*/ categoriaController.desactivarCategoria);

module.exports = router;