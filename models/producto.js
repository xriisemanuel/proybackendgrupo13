const mongoose = require('mongoose');
const {Schema} = mongoose;

const ProductoSchema = new Schema({
    nombreProducto: {
        type: String, 
        required: true
    },
    descripcion: {
        type:String, 
        required:true
    },
    imagen: {
        type: String, 
        required: true
    },
    disponible:{
        type:Boolean,
        required: true
    },
    precio: {
        type:Number, 
        required: true
    },
    estado: {
        type:Boolean, 
        required: false
    },
    categoria: { 
        type: Schema.Types.ObjectId, 
        ref: Categoria, 
        required: true }
})

module.exports = mongoose.model.Producto || mongoose.model('Producto', ProductoSchema);
// Este modelo define la estructura de los documentos de rol en la base de datos MongoDB.