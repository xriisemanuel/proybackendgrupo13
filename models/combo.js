// models/Combo.js
const mongoose = require('mongoose');

const ComboSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título del combo es obligatorio'],
        unique: true, // Para asegurar que no haya combos con el mismo título
        trim: true
    },
    descuento: {
        type: Number,
        required: [true, 'El porcentaje de descuento es obligatorio'],
        min: [0, 'El descuento no puede ser negativo'],
        max: [100, 'El descuento no puede ser mayor al 100%']
    },
    montoFinal: {
        type: Number,
        required: false, // Podría calcularse en el backend o en el frontend
        min: [0, 'El monto final no puede ser negativo']
    },
    // Relación con Productos: Un Combo puede tener varios Productos
    productos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto', // Referencia al modelo Producto
        required: [true, 'Un combo debe contener al menos un producto']
    }],
    // Podrías añadir un estado para activar/desactivar combos
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});

module.exports = mongoose.model('Combo', ComboSchema);