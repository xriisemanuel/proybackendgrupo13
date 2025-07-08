const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comboSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del combo es obligatorio.'],
        unique: true, // Cada combo debe tener un nombre único
        trim: true,
        minlength: [3, 'El nombre del combo debe tener al menos 3 caracteres.'],
        maxlength: [100, 'El nombre del combo no puede exceder los 100 caracteres.'],
    },
    descripcion: {
        type: String,
        trim: true,
        default: null,
        maxlength: [500, 'La descripción del combo no puede exceder los 500 caracteres.'],
    },
    productos: [{ // Array de productos con sus unidades
        productoId: {
            type: Schema.Types.ObjectId,
            ref: 'Producto',
            required: [true, 'El ID del producto es obligatorio.'],
        },
        unidades: {
            type: Number,
            required: [true, 'Las unidades son obligatorias.'],
            min: [1, 'Las unidades deben ser al menos 1.'],
        }
    }],
    descuento: { // Porcentaje de descuento aplicado sobre la suma de precios individuales
        type: Number,
        default: 0,
        min: [0, 'El descuento no puede ser negativo.'],
        max: [100, 'El descuento no puede exceder el 100%.'],
    },
    imagen: { // URL de la imagen representativa del combo
        type: String,
        trim: true,
        default: null,
    },
    estado: { // Indica si el combo está disponible para la venta
        type: Boolean,
        default: true,
    },
});

// --- Métodos de instancia ---

/**
 * Obtiene los detalles completos de los productos incluidos en el combo.
 * @returns {Promise<Array<Object>>} Un array de objetos de producto.
 */
comboSchema.methods.obtenerDetallesProductos = async function () {
    const Producto = mongoose.model('Producto');
    const productosIds = this.productos.map(p => p.productoId);
    return await Producto.find({ _id: { $in: productosIds } }).populate('categoriaId', 'nombre');
};

const Combo = mongoose.model('Combo', comboSchema);

module.exports = Combo;