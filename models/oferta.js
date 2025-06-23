// models/Oferta.js
const mongoose = require('mongoose');

const OfertaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título de la oferta es obligatorio'],
        unique: true,
        trim: true
    },
    dias: [{
        type: String,
        required: [true, 'Debe especificar los días de la semana para la oferta'],
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }],
    horaInicio: {
        type: String,
        required: [true, 'La hora de inicio de la oferta es obligatoria'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    horaFin: {
        type: String,
        required: [true, 'La hora de fin de la oferta es obligatoria'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    productos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: [true, 'Una oferta debe aplicar a al menos un producto']
    }],
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ¡¡¡CAMBIA ESTA SECCIÓN!!!
OfertaSchema.path('horaFin').validate(async function(value) {
    let horaInicioParaComparar;

    if (this.isNew) {
        horaInicioParaComparar = this.horaInicio;
    } else {
        horaInicioParaComparar = this.horaInicio;

        if (horaInicioParaComparar === undefined || horaInicioParaComparar === null) {
            // ¡¡¡CAMBIA ESTA LÍNEA!!!
            // Antes: const existingOferta = await this.constructor.findById(this._conditions._id);
            // Ahora:
            const existingOferta = await this.model.findById(this._conditions._id); // <-- ¡USAR this.model!
            // Fin del cambio

            if (existingOferta && existingOferta.horaInicio) {
                horaInicioParaComparar = existingOferta.horaInicio;
            } else {
                return false;
            }
        }
    }

    if (!horaInicioParaComparar) {
        return false;
    }

    const [hInicio, mInicio] = horaInicioParaComparar.split(':').map(Number);
    const [hFin, mFin] = value.split(':').map(Number);

    if (hFin < hInicio) return false;
    if (hFin === hInicio && mFin <= mInicio) return false;

    return true;
}, 'La hora de fin debe ser posterior a la hora de inicio.');


// ¡¡¡FIN DE LA SECCIÓN A CAMBIAR!!!


module.exports = mongoose.model('Oferta', OfertaSchema);