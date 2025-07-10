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
    precioCombo: { // Precio base del combo (suma de productos individuales)
        type: Number,
        required: [true, 'El precio del combo es obligatorio.'],
        min: [0, 'El precio del combo no puede ser negativo.'],
    },
    descuento: { // Porcentaje de descuento aplicado sobre el precio base
        type: Number,
        default: 0,
        min: [0, 'El descuento no puede ser negativo.'],
        max: [100, 'El descuento no puede exceder el 100%.'],
    },
    precioFinal: { // Precio final después de aplicar el descuento
        type: Number,
        required: [true, 'El precio final del combo es obligatorio.'],
        min: [0, 'El precio final no puede ser negativo.'],
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

// Hook pre-save para calcular el precio final basado en el descuento
comboSchema.pre('save', async function(next) {
    try {
        // Calcular el precio final basado en el descuento
        this.precioFinal = this.precioCombo * (1 - (this.descuento / 100));
        
        // Si el descuento es 100%, el precio final debe ser 0
        if (this.descuento === 100) {
            this.precioFinal = 0;
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Hook pre-findOneAndUpdate para calcular el precio final en actualizaciones
comboSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        
        // Si se está actualizando precioCombo o descuento, recalcular precioFinal
        if (update.precioCombo !== undefined || update.descuento !== undefined) {
            const precioCombo = update.precioCombo || this.precioCombo;
            const descuento = update.descuento || this.descuento;
            
            update.precioFinal = precioCombo * (1 - (descuento / 100));
            
            // Si el descuento es 100%, el precio final debe ser 0
            if (descuento === 100) {
                update.precioFinal = 0;
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

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
 * @returns {Promise<Number>} El monto del descuento.
 */
comboSchema.methods.calcularDescuentoMonto = async function () {
    const precioBase = await this.obtenerPrecioBaseProductos();
    const descuentoMonto = precioBase - this.precioFinal;
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