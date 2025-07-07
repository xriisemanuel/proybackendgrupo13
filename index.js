// proyecto/backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('./database'); // Asegúrate de que './database.js' maneje la conexión a MongoDB

// Importar los middlewares de autenticación y autorización
const { autenticar, autorizar } = require('./middleware/auth');

// Importar todas las rutas
const authRoutes = require('./routes/auth.routes');
const rolRoutes = require('./routes/rol.route');
const usuarioRoutes = require('./routes/usuario.route');
const pedidoRoutes = require('./routes/pedido.route');
const ventaRoutes = require('./routes/venta.routes');
const calificacionRoutes = require('./routes/calificacion.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.route');
const comboRoutes = require('./routes/combo.routes');
const ofertaRoutes = require('./routes/oferta.routes');
const repartidorRoutes = require('./routes/repartidor.routes');
const clienteRoutes = require('./routes/cliente.routes');
const imageGenerationRoutes = require('./routes/imageGeneration.routes');

var app = express();

// Middlewares globales
app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

// --- Rutas de Autenticación (Públicas) ---
app.use('/api/auth', authRoutes);

// --- Rutas de Generación de Imágenes (Protegidas por su propio router/middleware interno) ---
app.use('/api', imageGenerationRoutes); // Esta ruta se protege en 'imageGeneration.routes.js'

// --- Rutas Protegidas por Rol ---
// Aquí aplicamos los middlewares de autenticación y autorización a todo el router importado.
// Esto significa que CUALQUIER solicitud (GET, POST, PUT, DELETE) a estas rutas base
// pasará por los middlewares de autenticación y autorización.

// Rutas de Roles: Solo accesible por Administrador
app.use('/api/rol', autenticar, autorizar(['admin']), rolRoutes);

// Rutas de Usuarios: Solo accesible por Administrador
app.use('/api/usuario', autenticar, autorizar(['admin']), usuarioRoutes);

// Rutas de Pedidos: Acceso granular en controlador (autenticado, luego controlador maneja roles).
app.use('/api/pedido', autenticar, autorizar(['admin', 'cliente', 'repartidor', 'supervisor_cocina', 'supervisor_ventas']), pedidoRoutes);

// Rutas de Ventas: Accesible por Administrador y Supervisor de Ventas
app.use('/api/ventas', autenticar, autorizar(['admin', 'supervisor_ventas']), ventaRoutes);

// Rutas de Calificaciones: Solo accesible por Clientes
app.use('/api/calificaciones', autenticar, autorizar(['cliente']), calificacionRoutes);

// Rutas de Gestión de Categorías (CRUD completo): Solo Administrador
app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes);

// Rutas de Gestión de Productos (CRUD completo): Solo Administrador
app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes);

// Rutas de Gestión de Combos: Solo Administrador
app.use('/api/combos', autenticar, autorizar(['admin']), comboRoutes);

// Rutas de Gestión de Ofertas: Solo Administrador y Supervisor de Ventas
app.use('/api/ofertas', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaRoutes);

// Rutas de Repartidores: Acceso granular en controlador.
// ¡¡¡ESTA ES LA LÍNEA CLAVE!!! Asegúrate de que solo esta exista para /api/repartidores
app.use('/api/repartidores', autenticar, autorizar(['admin', 'repartidor', 'supervisor_ventas']), repartidorRoutes);

// Rutas de Clientes: Acceso granular en controlador.
app.use('/api/cliente', autenticar, autorizar(['admin', 'cliente']), clienteRoutes);

// Rutas para la generación de imágenes (si está activa y protegida)
// Si imageGenerationRoutes no es un router válido, esta línea causará el error.
// Asegúrate de que imageGeneration.routes.js exporte un express.Router()
//app.use('/api', autenticar, imageGenerationRoutes); 

// Configuración del puerto y arranque del servidor
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
