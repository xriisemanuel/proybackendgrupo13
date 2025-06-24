const express = require('express');
const cors = require('cors');
const mongoose = require('./database');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.route');
const comboRoutes = require('./routes/combo.routes'); // <-- ¡Nuevo!
const ofertaRoutes = require('./routes/oferta.routes'); // <-- ¡Nuevo!
const repartidorRoutes = require('./routes/repartidor.routes'); // <-- ¡Nuevo!

var app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

app.use('/api/rol', require('./routes/rol.route'));
app.use('/api/usuario', require('./routes/usuario.route'));
app.use('/api/pedido', require('./routes/pedido.route'));
app.use('/api/ventas', require('./routes/venta.routes'));
app.use('/api/calificaciones', require('./routes/calificacion.routes'));




// ... (configuración de express y conexión a DB) ...

// Usar las rutas de categoría
app.use('/api/categorias', categoriaRoutes);

// Usar las rutas de producto
app.use('/api/productos', productoRoutes);


app.use('/api/combos', comboRoutes);

app.use('/api/ofertas', ofertaRoutes);

// ... (configuración de middlewares y conexión a DB) ...

// Usar las rutas de repartidor
app.use('/api/repartidores', repartidorRoutes);



app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});