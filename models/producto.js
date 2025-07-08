const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio.'],
        unique: true, // El nombre del producto debe ser único
        trim: true,
        minlength: [3, 'El nombre del producto debe tener al menos 3 caracteres.'],
        maxlength: [100, 'El nombre del producto no puede exceder los 100 caracteres.'],
    },
    descripcion: {
        type: String,
        trim: true,
        default: null,
        maxlength: [500, 'La descripción del producto no puede exceder los 500 caracteres.'],
    },
    precio: {
        type: Number,
        required: [true, 'El precio del producto es obligatorio.'],
        min: [0, 'El precio del producto no puede ser negativo.'],
    },
    categoriaId: {
        type: Schema.Types.ObjectId,
        ref: 'Categoria', // Referencia al modelo de Categoria
        required: [true, 'La categoría del producto es obligatoria.'],
    },
    imagen: {
        type: String,
        trim: true,
        // Puedes añadir una validación regex para URL si es necesario
    },
    disponible: { // Indica si el producto está activo y visible para la venta
        type: Boolean,
        default: true,
    },
    stock: {
        type: Number,
        required: [true, 'El stock del producto es obligatorio.'],
        min: [0, 'El stock del producto no puede ser negativo.'],
        default: 0,
    },
    popularidad: { // Puede ser un conteo de ventas, vistas, etc.
        type: Number,
        default: 0,
        min: [0, 'La popularidad no puede ser negativa.'],
    },
});

// --- Hooks Mongoose ---

// Hook pre-save para asegurar la consistencia de 'disponible' con 'stock'
productoSchema.pre('save', function (next) {
    // Si el stock se modifica o es un nuevo documento, ajusta 'disponible'
    if (this.isModified('stock') || this.isNew) {
        this.disponible = this.stock > 0;
    }
    next();
});

// Hook pre-findOneAndUpdate para asegurar la consistencia de 'disponible' con 'stock' en actualizaciones
productoSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.stock !== undefined) {
        update.disponible = update.stock > 0;
    }
    next();
});


// --- Métodos de instancia ---

/**
 * Verifica si el producto está disponible para la venta (stock > 0 y 'disponible' es true).
 * @returns {boolean} True si está disponible, false en caso contrario.
 */
productoSchema.methods.verificarDisponibilidad = function () {
    return this.disponible && this.stock > 0;
};

/**
 * Actualiza el stock del producto, aumentando o disminuyendo.
 * También ajusta el campo 'disponible' automáticamente.
 * @param {number} cantidadCambio - Cantidad a añadir (positivo) o restar (negativo).
 * @returns {Promise<number>} El nuevo stock del producto.
 * @throws {Error} Si la operación resulta en stock negativo.
 */
productoSchema.methods.actualizarStock = async function (cantidadCambio) {
    const nuevoStockCalculado = this.stock + cantidadCambio;

    if (nuevoStockCalculado < 0) {
        throw new Error('Operación inválida: stock insuficiente para completar la solicitud.');
    }

    this.stock = nuevoStockCalculado;
    // El hook pre-save/findOneAndUpdate se encargará de actualizar 'disponible'
    await this.save();
    return this.stock;
};

// **LA MODIFICACIÓN CLAVE ESTÁ AQUÍ:**
// Verificar si el modelo ya existe antes de compilarlo
const Producto = mongoose.models.Producto || mongoose.model('Producto', productoSchema);

module.exports = Producto;