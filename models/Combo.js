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
    productosIds: [{ // Array de IDs de productos que forman parte del combo
        type: Schema.Types.ObjectId,
        ref: 'Producto', // Referencia al modelo Producto
        required: [true, 'Cada combo debe contener al menos un producto.'],
    }],
    precioCombo: { // Precio al que se vende el combo
        type: Number,
        required: [true, 'El precio del combo es obligatorio.'],
        min: [0, 'El precio del combo no puede ser negativo.'],
    },
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
    activo: { // Indica si el combo está disponible para la venta
        type: Boolean,
        default: true,
    },
});

// --- Hooks Mongoose ---

// Hook pre-save y pre-findOneAndUpdate para calcular el precio del combo con descuento
// o para ajustar el precio base si el descuento es 0.
// Esto podría ser complejo si el precioCombo se basa en el descuento sobre los productos.
// Para simplicidad, asumiremos que precioCombo es el precio final que se desea,
// y 'descuento' es informativo o se usa para validación.
// Si precioCombo DEBE ser calculado basado en productos y descuento, la lógica sería más compleja.

// --- Métodos de instancia ---

/**
 * Calcula el valor total de los productos individuales en el combo
 * sin aplicar el descuento.
 * @returns {Promise<Number>} La suma de los precios de los productos.
 */
comboSchema.methods.obtenerPrecioBaseProductos = async function () {
    const Producto = mongoose.model('Producto'); // Obtener el modelo para evitar circular dependency
    const productos = await Producto.find({ _id: { $in: this.productosIds } }).select('precio');
    const precioBase = productos.reduce((sum, prod) => sum + prod.precio, 0);
    return precioBase;
};

/**
 * Calcula el descuento real del combo en valor monetario.
 * Asume que `precioCombo` es el precio final ya con descuento aplicado.
 * Si `descuento` es un porcentaje, esto es lo que representa.
 * @returns {Promise<Number>} El monto del descuento.
 */
comboSchema.methods.calcularDescuentoMonto = async function () {
    const precioBase = await this.obtenerPrecioBaseProductos();
    const precioConDescuentoCalculado = precioBase * (1 - (this.descuento / 100));
    // Si el precioCombo es menor que el precio calculado con descuento,
    // el descuento real es la diferencia entre precio base y precioCombo
    const descuentoMonto = precioBase - this.precioCombo;
    return Math.max(0, descuentoMonto); // Asegura que el descuento no sea negativo
};

/**
 * Obtiene los detalles completos de los productos incluidos en el combo.
 * @returns {Promise<Array<Object>>} Un array de objetos de producto.
 */
comboSchema.methods.obtenerDetallesProductos = async function () {
    const Producto = mongoose.model('Producto');
    return await Producto.find({ _id: { $in: this.productosIds } }).populate('categoriaId', 'nombre');
};

const Combo = mongoose.model('Combo', comboSchema);

module.exports = Combo;