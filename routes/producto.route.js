// proyecto/backend/routes/producto.route.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/producto.controller'); // Usamos el controlador de productos
const { autenticar, autorizar } = require('../middleware/auth'); // Importa los middlewares de autenticación

// Rutas GET de productos (públicas)
// Estas rutas no requieren autenticación para que los productos puedan ser vistos en la página de inicio, etc.
router.get('/', productController.getProducts); // Obtener todos los productos
router.get('/:id', productController.getProductById); // Obtener un producto por ID

// Rutas POST, PUT, DELETE de productos (protegidas por autenticación y autorización de rol 'admin')
// Solo los administradores podrán crear, actualizar o eliminar productos.
router.post('/', autenticar, autorizar(['admin']), productController.createProduct); // Crear un nuevo producto
router.put('/:id', autenticar, autorizar(['admin']), productController.updateProduct); // Actualizar un producto
router.delete('/:id', autenticar, autorizar(['admin']), productController.deleteProduct); // Eliminar un producto
// Activar producto
router.patch('/:id/activar', autenticar, autorizar(['admin']), productController.activarProducto);

// Desactivar producto
router.patch('/:id/desactivar', autenticar, autorizar(['admin']), productController.desactivarProducto);


module.exports = router;