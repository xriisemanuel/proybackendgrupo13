// const mongoose = require('mongoose');
// const {Schema} = mongoose;

// const rolSchema = new Schema({
//     nombre: {
//         type: String,
//         required: true
//     },
//     estado: {
//         type: Boolean,
//         required: true
//     },
// })

// module.exports = mongoose.model.Rol || mongoose.model('Rol', rolSchema);
// // Este modelo define la estructura de los documentos de rol en la base de datos MongoDB.
const mongoose = require('mongoose');

const rolSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  estado: {
    type: Boolean,
    default: true,
  },
}
// , {
//   timestamps: true, // Agrega campos de fecha de creación y actualización
//   versionKey: false // Elimina el campo __v que Mongoose agrega por defecto 
);

const Rol = mongoose.model('Rol', rolSchema);

module.exports = Rol;