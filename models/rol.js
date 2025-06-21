const mongoose = require('mongoose');
const {Schema} = mongoose;
const rolSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    estado: {
        type: Boolean,
        required: true
    },
})

module.exports = mongoose.model.rol || mongoose.model('Rol', rolSchema);
// Este modelo define la estructura de los documentos de rol en la base de datos MongoDB.