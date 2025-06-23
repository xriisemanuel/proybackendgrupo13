// models/Producto.js
const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        required: false, // La descripción puede ser opcional
        trim: true
    },
    precio: {
        type: Number,
        required: [true, 'El precio del producto es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    // Un producto también podría tener un estado (activo/inactivo) como sugiere el UML
    estado: {
        type: Boolean,
        default: true // Por defecto, el producto está activo
    },
    // Si necesitas una relación con Categoría (según el UML), iría aquí
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria', // Nombre del modelo de Categoría
        required: false // Puede que no todos los productos tengan categoría al principio
    }
}, {
    timestamps: true // Esto añade `createdAt` y `updatedAt` automáticamente
});

module.exports = mongoose.model('Producto', ProductoSchema);