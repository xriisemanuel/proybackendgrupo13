const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');

router.post('/', categoriaController.crearCategoria);
router.get('/', categoriaController.obtenerCategorias);
router.get('/:id', categoriaController.obtenerCategoriaPorId);
router.put('/:id', categoriaController.actualizarCategoria);
router.delete('/:id', categoriaController.eliminarCategoria);

module.exports = router;
