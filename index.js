const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
const mongoose = require('./database');

var app = express();
app.use(express.json());
app.use(cors({origin: 'http://localhost:4200'}));

app.use('/api/rol', require('./routes/rol.route'));
app.use('/api/usuario', require('./routes/usuario.route'));

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
=======
const {mongoose} = require('./database');
var app = express();
//middlewares
app.use(express.json());
app.use(cors({origin: 'http://localhost:4200'}));
//Cargamos el modulo de direccionamiento de rutas
app.use('/api/producto', require('./routes/producto.route.js'));
app.use('/api/pedido', require('./routes/pedido.route'));
app.use('/api/detalle-producto', require('./routes/detalleProducto.route'));
//app.use('/api/agente', require('./routes/agente.route.js'));
//app.use('/api/sector', require('./routes/sector.route'));
//setting
app.set('port', process.env.PORT || 3000);
//starting the server
app.listen(app.get('port'), () => {
console.log(`Server started on port`, app.get('port'));
});
>>>>>>> d43ba665b049d1723bbd0e2c50f04c1be4528bd3
