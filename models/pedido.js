const mongoose = require('mongoose');
const {Schema} = mongoose;
const Rol = require('../models/rol'); // Importa el modelo Rol

const PedidoSchema = new Schema({
    estado: {
        type: String,
        required: true
    },
    demora: { 
        type: String 
    },
    modalidad: { 
        type: String, 
        required: true 
    },
    cliente: { 
        type: Schema.Types.ObjectId, 
        ref: Rol, //Pendiente a cambiar por Cliente
        required: true
    }, 
    // },
    // detalleProductos:  [{ 
    //     type: Schema.Types.ObjectId, 
    //     ref: DetalleProducto, 
    //     required: true 
    // }],
    // calificacion: { 
    //     type: Schema.Types.ObjectId, 
    //     ref: Calificacion 
    // },
    total: { 
        type: Number, 
        required: true
    },
    formaDePago: { 
        type: String, 
        required: true
    }
})

module.exports = mongoose.model.Pedido || mongoose.model('Pedido', PedidoSchema);
// Este modelo define la estructura de los documentos de pedido en la base de datos MongoDB.