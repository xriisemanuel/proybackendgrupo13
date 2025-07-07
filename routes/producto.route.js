// proyecto/backend/routes/producto.route.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/producto.controller'); // <<<< Usamos el controlador de productos

// Rutas GET de productos (accesibles públicamente si index.js las configura así)
// No necesitan middlewares aquí, ya que se aplicarán en index.js si la ruta es protegida.
router.get('/', productController.getProducts); // Obtener todos los productos
router.get('/:id', productController.getProductById); // Obtener un producto por ID

// Rutas POST, PUT, DELETE de productos (protegidas por middleware en index.js)
// No necesitan middlewares aquí, ya que se aplicarán en index.js.
router.post('/', productController.createProduct); // Crear un nuevo producto
router.put('/:id', productController.updateProduct); // Actualizar un producto
router.delete('/:id', productController.deleteProduct); // Eliminar un producto

module.exports = router;