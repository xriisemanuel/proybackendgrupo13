
const Rol = require('../models/rol'); // Asumiendo que tienes un archivo de modelo 'rol.js'
const rolController = {}; // Define an object to attach controller methods

// 1. Crear Rol
rolController.crearRol = async (req, res) => {
    try {
        const nuevoRol = new Rol(req.body);
        await nuevoRol.save();
        res.status(201).json({ mensaje: 'Rol creado exitosamente', rol: nuevoRol });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear rol', error: error.message });
    }
};

// 2. Listar Roles
rolController.listarRoles = async (req, res) => {
    try {
        const roles = await Rol.find();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar roles', error: error.message });
    }
};

// 3. Obtener Rol por ID
rolController.obtenerRolPorId = async (req, res) => {
    try {
        const rol = await Rol.findById(req.params.id);
        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado' });
        }
        res.status(200).json(rol);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener rol', error: error.message });
    }
};

// 4. Actualizar Rol
rolController.actualizarRol = async (req, res) => {
    try {
        const rol = await Rol.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado' });
        }
        res.status(200).json({ mensaje: 'Rol actualizado exitosamente', rol: rol });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar rol', error: error.message });
    }
};

// 5. Eliminar Rol
rolController.eliminarRol = async (req, res) => {
    try {
        const rol = await Rol.findByIdAndDelete(req.params.id);
        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado' });
        }
        res.status(200).json({ mensaje: 'Rol eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar rol', error: error.message });
    }
};

// Es una práctica común exportar el objeto del controlador al final
module.exports = rolController;