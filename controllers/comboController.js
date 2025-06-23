// controllers/comboController.js
const Combo = require('../models/combo');
const Producto = require('../models/producto'); // Necesitamos este para validar productos existentes

// Función para crear un nuevo Combo
exports.crearCombo = async (req, res) => {
    try {
        const { titulo, descuento, productos } = req.body;

        // 1. Validar que los productos referenciados existan
        // Esto es crucial para la integridad referencial.
        for (let i = 0; i < productos.length; i++) {
            const productoId = productos[i];
            const productoExiste = await Producto.findById(productoId);
            if (!productoExiste) {
                return res.status(404).json({ msg: `Producto con ID ${productoId} no encontrado.` });
            }
        }

        const combo = new Combo(req.body);
        await combo.save();
        res.status(201).json(combo); // 201 Created

    } catch (error) {
        console.error(error);
        // Mongoose Validation Error (ej. campos requeridos, validaciones de esquema)
        if (error.name === 'ValidationError') {
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ msg: "Error de validación", errors });
        }
        // Duplicate key error (ej. titulo unique)
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Ya existe un combo con este título.' });
        }
        res.status(500).json({ msg: 'Hubo un error al crear el combo.' });
    }
};

// Función para obtener todos los Combos
exports.obtenerCombos = async (req, res) => {
    try {
        // .populate('productos') carga los datos completos de los productos referenciados
        const combos = await Combo.find().populate('productos', 'nombre precio'); // 'nombre precio' para seleccionar solo esos campos
        res.status(200).json(combos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hubo un error al obtener los combos.' });
    }
};

// Función para obtener un Combo por su ID
exports.obtenerComboPorId = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id).populate('productos', 'nombre precio');
        if (!combo) {
            return res.status(404).json({ msg: 'Combo no encontrado.' });
        }
        res.status(200).json(combo);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') { // Error si el ID no es un ObjectId válido
            return res.status(400).json({ msg: 'ID de combo no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al obtener el combo.' });
    }
};

// Función para actualizar un Combo por su ID
exports.actualizarCombo = async (req, res) => {
    try {
        const { titulo, descuento, montoFinal, productos, activo } = req.body;

        // Opcional: Volver a validar que los productos referenciados existan si se están actualizando
        if (productos && products.length > 0) {
            for (let i = 0; i < productos.length; i++) {
                const productoId = productos[i];
                const productoExiste = await Producto.findById(productoId);
                if (!productoExiste) {
                    return res.status(404).json({ msg: `Producto con ID ${productoId} no encontrado.` });
                }
            }
        }

        const combo = await Combo.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // $set actualiza solo los campos enviados en el body
            { new: true, runValidators: true } // `new: true` devuelve el documento actualizado, `runValidators` ejecuta las validaciones del esquema
        ).populate('productos', 'nombre precio');

        if (!combo) {
            return res.status(404).json({ msg: 'Combo no encontrado para actualizar.' });
        }
        res.status(200).json(combo);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ msg: "Error de validación", errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Ya existe un combo con este título.' });
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de combo no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al actualizar el combo.' });
    }
};

// Función para eliminar un Combo por su ID
exports.eliminarCombo = async (req, res) => {
    try {
        const combo = await Combo.findByIdAndDelete(req.params.id);
        if (!combo) {
            return res.status(404).json({ msg: 'Combo no encontrado para eliminar.' });
        }
        res.status(200).json({ msg: 'Combo eliminado exitosamente.' });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de combo no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al eliminar el combo.' });
    }
};