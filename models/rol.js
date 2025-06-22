const mongoose = require('mongoose');
const {Schema} = mongoose;
<<<<<<< HEAD
=======

>>>>>>> d43ba665b049d1723bbd0e2c50f04c1be4528bd3
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