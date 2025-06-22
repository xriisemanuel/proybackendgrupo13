const mongoose = require('mongoose');
const {Schema} = mongoose;

const DetalleProductoSchema = new Schema({
 cantidad: { type: Number, required: true },
})
module.exports = mongoose.models.detalleproducto || mongoose.model('detalleproducto', DetalleProductoSchemaSchema);