const mongoose = require('mongoose');
const {Schema} = mongoose;
const usuarioSchema = new Schema({
    usuario: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
})
module.exports = mongoose.model.usuario || mongoose.model('Usuario', usuarioSchema);
// Este modelo define la estructura de los documentos de usuario en la base de datos MongoDB.