const express = require('express');
const cors = require('cors');
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