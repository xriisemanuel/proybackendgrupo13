// proyecto/backend/routes/categoria.routes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { autenticar, autorizar } = require('../middleware/auth'); // Importa los middlewares de autenticación

// Rutas CRUD para Categorías
// GET: Rutas públicas para obtener categorías (ej. para mostrar en la página de inicio)
router.get('/', categoriaController.obtenerCategorias);
router.get('/:id', categoriaController.obtenerCategoriaPorId);

// POST, PUT, DELETE: Rutas protegidas por autenticación y autorización de rol (solo 'admin')
router.post('/', autenticar, autorizar(['admin']), categoriaController.crearCategoria);
router.put('/:id', autenticar, autorizar(['admin']), categoriaController.actualizarCategoria);
router.delete('/:id', autenticar, autorizar(['admin']), categoriaController.eliminarCategoria);

// Rutas de funcionalidades específicas (también protegidas para 'admin')
router.get('/:id/productos', categoriaController.obtenerProductosDeCategoria); // <-- Esta ruta de GET puede ser pública si solo muestra productos
router.patch('/:id/activar', autenticar, autorizar(['admin']), categoriaController.activarCategoria);
router.patch('/:id/desactivar', autenticar, autorizar(['admin']), categoriaController.desactivarCategoria);

module.exports = router;
