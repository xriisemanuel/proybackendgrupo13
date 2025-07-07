// proyecto/backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('./database'); // Asegúrate de que './database.js' maneje la conexión a MongoDB

// Importar los middlewares de autenticación y autorización
const { autenticar, autorizar } = require('./middleware/auth'); // Tu middleware 'auth.js'

// Importar todas las rutas
const authRoutes = require('./routes/auth.routes'); // Rutas para login/registro
const rolRoutes = require('./routes/rol.route');
const usuarioRoutes = require('./routes/usuario.route');
const pedidoRoutes = require('./routes/pedido.route');
const ventaRoutes = require('./routes/venta.routes');
const calificacionRoutes = require('./routes/calificacion.routes');

// Importar routers específicos para la gestión de productos, categorías, etc.
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.route'); // <<<<< Confirmado el nombre 'producto.route.js'
const comboRoutes = require('./routes/combo.routes');
const ofertaRoutes = require('./routes/oferta.routes');
const repartidorRoutes = require('./routes/repartidor.routes');
const clienteRoutes = require('./routes/cliente.routes');
const imageGenerationRoutes = require('./routes/imageGeneration.routes');

var app = express();

// Middlewares globales
app.use(express.json()); // Para parsear el cuerpo de las solicitudes como JSON
// Configuración de CORS: Permitir solicitudes desde tu frontend Angular
app.use(cors({ origin: 'http://localhost:4200' }));

// --- Rutas de Autenticación (Públicas) ---
app.use('/api/auth', authRoutes);

// --- Rutas de Generación de Imágenes (Protegidas a nivel de su propio router) ---
// La autenticación se aplica dentro de imageGeneration.routes.js
app.use('/api', imageGenerationRoutes);

// --- Rutas PÚBLICAS (Accesibles sin autenticación) ---
// Permite que cualquiera vea categorías, productos, combos, ofertas sin iniciar sesión.
app.get('/api/categorias', categoriaRoutes); // Listar todas las categorías
app.get('/api/categorias/:id', categoriaRoutes); // Ver una categoría por ID

app.get('/api/productos', productoRoutes); // Listar todos los productos
app.get('/api/productos/:id', productoRoutes); // Ver un producto por ID

app.get('/api/combos', comboRoutes); // Listar todos los combos
app.get('/api/combos/:id', comboRoutes); // Ver un combo por ID

app.get('/api/ofertas', ofertaRoutes); // Listar todas las ofertas
app.get('/api/ofertas/:id', ofertaRoutes); // Ver una oferta por ID


// --- Rutas PROTEGIDAS (Necesitan autenticación y autorización por roles) ---
// Aquí aplicamos los middlewares globales 'autenticar' y 'autorizar' a todo el router.

// Rutas de Roles: Solo accesible por Administrador
app.use('/api/rol', autenticar, autorizar(['admin']), rolRoutes);

// Rutas de Usuarios: Solo accesible por Administrador
app.use('/api/usuario', autenticar, autorizar(['admin']), usuarioRoutes);

// Rutas de Pedidos: Acceso granular en controlador.
app.use('/api/pedido', autenticar, autorizar(['admin', 'cliente', 'repartidor', 'supervisor_cocina', 'supervisor_ventas']), pedidoRoutes);

// Rutas de Ventas: Accesible por Administrador y Supervisor de Ventas
app.use('/api/ventas', autenticar, autorizar(['admin', 'supervisor_ventas']), ventaRoutes);

// Rutas de Calificaciones: Solo accesible por Clientes (para calificar sus propios pedidos)
app.use('/api/calificaciones', autenticar, autorizar(['cliente']), calificacionRoutes);

// Rutas de Gestión de Categorías (CRUD completo): Solo Administrador
app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes);

// Rutas de Gestión de Productos (CRUD completo): Solo Administrador
app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes); // <<<<< Usando productoRoutes

// Rutas de Gestión de Combos: Solo Administrador
app.use('/api/combos', autenticar, autorizar(['admin']), comboRoutes);

// Rutas de Gestión de Ofertas: Solo Administrador y Supervisor de Ventas
app.use('/api/ofertas', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaRoutes);

// Rutas de Repartidores: Acceso granular en controlador.
app.use('/api/repartidores', autenticar, autorizar(['admin', 'repartidor']), repartidorRoutes);

// Rutas de Clientes: Acceso granular en controlador.
app.use('/api/cliente', autenticar, autorizar(['admin', 'cliente']), clienteRoutes);

// Configuración del puerto y arranque del servidor
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});