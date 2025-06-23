const mongoose = require('mongoose');
const { Schema } = mongoose;
// const Rol = require('../models/rol'); // Si 'Cliente' es un modelo separado, no necesitas Rol aquí.
//const Cliente = require('./cliente'); // Asumo que ya tienes un modelo Cliente
//const Producto = require('./producto'); // Necesario para los items del pedido
const Rol = require('../models/rol'); // Si 'Cliente' es un rol, puedes usar Rol directamente
const PedidoSchema = new Schema({
    // --- Atributos Esenciales ---

    // 1. Cliente que realiza el pedido
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Rol', // Referencia al modelo Rol (asumiendo que así se llama tu modelo de usuarios/clientes)
        required: true
    },

    // 2. Fecha de creación del pedido
    fechaCreacion: {
        type: Date,
        default: Date.now, // Se establece automáticamente al crear el pedido
        required: true
    },

    // 3. Estado actual del pedido
    estado: {
        type: String,
        required: true,
        enum: [
            'Pendiente',        // Pedido creado, esperando acción (ej. pago, confirmación)
            'En Proceso',       // Pedido en preparación o siendo gestionado
            'Completado',       // Pedido entregado/finalizado
            'Cancelado'         // Pedido anulado
        ],
        default: 'Pendiente' // Estado inicial
    },

    // 4. Detalle de los productos/ítems incluidos en el pedido
    // Usamos un array de objetos embebidos para la simplicidad y el rendimiento en un esquema básico.
    items: [{
        producto: { // Referencia al producto específico
            type: Schema.Types.ObjectId,
            ref: 'Producto', // Tu modelo de Producto
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1 // Asegura que la cantidad sea al menos 1
        },
        precioUnitario: { // Precio del producto en el momento de la compra
            type: Number,
            required: true
        }
    }],

    // 5. Total del pedido
    total: {
        type: Number,
        required: true,
        min: 0 // El total no puede ser negativo
    },

    // 6. Forma de pago utilizada
    formaDePago: {
        type: String,
        required: true,
        // Puedes usar un enum si solo aceptas pocas formas de pago
        // enum: ['Efectivo', 'Tarjeta de Crédito', 'Mercado Pago']
    },

    // 7. Modalidad de entrega/retiro
    modalidad: {
        type: String,
        required: true,
        enum: ['Delivery', 'Retiro en local']
    },
    
    // Si la modalidad es 'Delivery', necesitas una dirección.
    // Esto podría ser un subdocumento embebido simple o una referencia a una Dirección si es un objeto complejo.
    // Por simplicidad, lo ponemos aquí directo como texto o campos básicos.
    // **Opcional, solo si la modalidad 'Delivery' es frecuente:**
    direccionEnvio: { // Objeto con campos de dirección (simple)
        calle: { type: String },
        numero: { type: String },
        localidad: { type: String }
    }
});

module.exports = mongoose.model('Pedido', PedidoSchema);