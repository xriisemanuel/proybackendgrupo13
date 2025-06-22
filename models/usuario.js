const mongoose = require('mongoose');
const { Schema } = mongoose;
const Rol = require('../models/rol'); // Asegúrate de que la ruta sea correcta IMPORTANTE

const usuarioSchema = new Schema({
    usuario: {
        type: String,
        required: true,
        unique: true  // Opcional, pero recomendable para evitar duplicados
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
        required: true,
        unique: true  // También recomendable
    },
    rol: {
        type: Schema.Types.ObjectId,
        ref: Rol,     // Debe coincidir con el nombre del modelo exportado en rol.js
        required: true
    }
    //responsable: {type: Schema.Types.ObjectId, ref: Agente, required: true} 
});

// Exporta correctamente el modelo (previene redefiniciones en desarrollo)
module.exports = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);
