const mongoose = require('mongoose');
const URI = 'mongodb://localhost/branch-cris-nil'; // Reemplaza con tu URI de MongoDB
mongoose.connect(URI).then(db => console.log('Base de datos conectada')).catch(err => console.error('Error al conectar a la base de datos', err));
module.exports = mongoose; // Exporta la conexión para usarla en otros archivos
// Este archivo establece la conexión a la base de datos MongoDB usando Mongoose.