const mongoose = require('mongoose');
<<<<<<< HEAD
const URI = 'mongodb://localhost/Branch-Cris-Nil'; // Reemplaza con tu URI de MongoDB
mongoose.connect(URI).then(db => console.log('Base de datos conectada')).catch(err => console.error('Error al conectar a la base de datos', err));
module.exports = mongoose; // Exporta la conexión para usarla en otros archivos
// Este archivo establece la conexión a la base de datos MongoDB usando Mongoose.
=======
const URI = 'mongodb://localhost/proyectodb';
mongoose.connect(URI)
.then(db=>console.log('DB is connected'))
.catch(err=>console.error(err))
module.exports = mongoose;
>>>>>>> d43ba665b049d1723bbd0e2c50f04c1be4528bd3
