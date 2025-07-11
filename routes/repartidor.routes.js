const express = require('express');
const router = express.Router();
const repartidorController = require('../controllers/repartidor.controller'); // Asegúrate de que la ruta sea correcta

// Rutas para la gestión de repartidores (RESTful)

/**
 * @route GET /api/repartidores
 * @desc Obtener todos los repartidores
 * @access Admin
 */
router.get('/', repartidorController.getRepartidores);

/**
 * @route POST /api/repartidores
 * @desc Crear un nuevo repartidor
 * @access Admin
 */
router.post('/', repartidorController.createRepartidor);

/**
 * @route GET /api/repartidores/:id
 * @desc Obtener un repartidor por ID
 * @access Admin, Repartidor (para su propio perfil)
 */
router.get('/:id', repartidorController.getRepartidorById); // La autorización granular se maneja en el controlador

/**
 * @route PUT /api/repartidores/:id
 * @desc Actualizar un repartidor por ID
 * @access Admin, Repartidor (para su propio perfil)
 */
router.put('/:id', repartidorController.updateRepartidor); // La autorización granular se maneja en el controlador

/**
 * @route PUT /api/repartidores/:id/profile
 * @desc Actualizar perfil completo del repartidor (usuario + repartidor)
 * @access Repartidor (para su propio perfil)
 */
router.put('/:id/profile', repartidorController.updateRepartidorProfile); // La autorización granular se maneja en el controlador

/**
 * @route DELETE /api/repartidores/:id
 * @desc Eliminar un repartidor por ID
 * @access Admin
 */
router.delete('/:id', repartidorController.deleteRepartidor);

/**
 * @route PUT /api/repartidores/:id/ubicacion
 * @desc Actualizar la ubicación actual de un repartidor
 * @access Repartidor (para su propio perfil)
 */
router.put('/:id/ubicacion', repartidorController.updateUbicacion); // La autorización granular se maneja en el controlador

// NOTA: Las rutas PATCH para 'estado' y 'registrar-entrega' que mencionaste anteriormente
// no están incluidas aquí porque las funciones correspondientes (cambiarEstadoRepartidor,
// registrarEntregaRepartidor) no son métodos exportados directamente en el repartidor.controller.js
// que te proporcioné. Esos son métodos de instancia del esquema de Mongoose.
// Si necesitas endpoints específicos para esas operaciones, deberías añadir
// funciones exportadas a tu controlador (repartidor.controller.js) para manejarlas.
router.patch('/:id/registrar-entrega', repartidorController.registrarEntregaRepartidor); // Esta ruta debería ser llamada por el sistema de pedidos
router.patch('/:id/estado', repartidorController.cambiarEstadoRepartidor);
router.get('/by-user/:usuarioId', repartidorController.getRepartidorByUsuarioId);

module.exports = router;