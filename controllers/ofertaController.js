// controllers/ofertaController.js
const Oferta = require('../models/oferta');
const Producto = require('../models/producto'); // También necesitamos este para validar productos

// Función para crear una nueva Oferta
exports.crearOferta = async (req, res) => {
    try {
        const { titulo, dias, horaInicio, horaFin, productos } = req.body;

        // 1. Validar que los productos referenciados existan
        for (let i = 0; i < productos.length; i++) {
            const productoId = productos[i];
            const productoExiste = await Producto.findById(productoId);
            if (!productoExiste) {
                return res.status(404).json({ msg: `Producto con ID ${productoId} no encontrado.` });
            }
        }

        const oferta = new Oferta(req.body);
        await oferta.save();
        res.status(201).json(oferta); // 201 Created

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
            return res.status(400).json({ msg: 'Ya existe una oferta con este título.' });
        }
        res.status(500).json({ msg: 'Hubo un error al crear la oferta.' });
    }
};

// Función para obtener todas las Ofertas
exports.obtenerOfertas = async (req, res) => {
    try {
        const ofertas = await Oferta.find().populate('productos', 'nombre precio');
        res.status(200).json(ofertas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hubo un error al obtener las ofertas.' });
    }
};

// Función para obtener una Oferta por su ID
exports.obtenerOfertaPorId = async (req, res) => {
    try {
        const oferta = await Oferta.findById(req.params.id).populate('productos', 'nombre precio');
        if (!oferta) {
            return res.status(404).json({ msg: 'Oferta no encontrada.' });
        }
        res.status(200).json(oferta);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de oferta no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al obtener la oferta.' });
    }
};

// Función para actualizar una Oferta por su ID
exports.actualizarOferta = async (req, res) => {
    try {
        const { titulo, dias, horaInicio, horaFin, productos, activa } = req.body;

        // Opcional: Volver a validar que los productos referenciados existan
        if (productos && productos.length > 0) {
            for (let i = 0; i < productos.length; i++) {
                const productoId = productos[i];
                const productoExiste = await Producto.findById(productoId);
                if (!productoExiste) {
                    return res.status(404).json({ msg: `Producto con ID ${productoId} no encontrado.` });
                }
            }
        }

        const oferta = await Oferta.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('productos', 'nombre precio');

        if (!oferta) {
            return res.status(404).json({ msg: 'Oferta no encontrada para actualizar.' });
        }
        res.status(200).json(oferta);
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
            return res.status(400).json({ msg: 'Ya existe una oferta con este título.' });
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de oferta no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al actualizar la oferta.' });
    }
};

// Función para eliminar una Oferta por su ID
exports.eliminarOferta = async (req, res) => {
    try {
        const oferta = await Oferta.findByIdAndDelete(req.params.id);
        if (!oferta) {
            return res.status(404).json({ msg: 'Oferta no encontrada para eliminar.' });
        }
        res.status(200).json({ msg: 'Oferta eliminada exitosamente.' });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de oferta no válido.' });
        }
        res.status(500).json({ msg: 'Hubo un error al eliminar la oferta.' });
    }
};