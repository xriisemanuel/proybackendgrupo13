// proyecto/backend/index.js
require('dotenv').config();

// Cargar configuración
let config;
try {
  config = require('./config.js');
  console.log('Configuración cargada exitosamente');
  console.log('Google Client ID:', config.GOOGLE_CLIENT_ID);
} catch (error) {
  console.warn('No se pudo cargar config.js, usando variables de entorno por defecto');
  config = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    JWT_SECRET: process.env.JWT_SECRET || '1234567890'
  };
}

const express = require('express');
const cors = require('cors');
const mongoose = require('./database'); // Asegúrate de que './database.js' maneje la conexión a MongoDB

// Importar los middlewares de autenticación y autorización
// Se importan aquí, pero su uso se ajusta en los archivos de rutas individuales para mayor granularidad.
const { autenticar, autorizar } = require('./middleware/auth'); // Asegúrate que exporte estas funciones

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
const imageGenerationRoutes = require('./routes/imageGeneration.routes'); // Importa el router de generación de imágenes

var app = express();

// Middlewares globales
app.use(express.json()); // Para parsear cuerpos de peticiones JSON
app.use(cors({ origin: 'http://localhost:4200' })); // Configuración de CORS para permitir peticiones desde tu frontend

// --- Rutas de Autenticación (Públicas) ---
app.use('/api/auth', authRoutes);

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
app.use('/api/ventas', autenticar, autorizar(['admin', 'supervisor_ventas', 'supervisor_cocina']), ventaRoutes);

// Rutas de Calificaciones: Solo accesible por Clientes
app.use('/api/calificaciones', autenticar, autorizar(['cliente']), calificacionRoutes);

// --- Rutas de Gestión de Categorías (AJUSTADO: Sin autenticación global aquí) ---
// La autenticación se manejará dentro de 'categoria.routes.js' para GET/POST/PUT/DELETE
app.use('/api/categorias', categoriaRoutes); // <-- Eliminado autenticar y autorizar aquí

// --- Rutas de Gestión de Productos (AJUSTADO: Sin autenticación global aquí) ---
// La autenticación se manejará dentro de 'producto.route.js' para GET/POST/PUT/DELETE
app.use('/api/productos', productoRoutes); // <-- Eliminado autenticar y autorizar aquí

// Rutas de Gestión de Combos: GET público, resto protegido
app.use('/api/combos', comboRoutes);

// Rutas de Gestión de Ofertas: GET público, resto protegido
app.use('/api/ofertas', ofertaRoutes);

// Rutas de Repartidores: Acceso granular en controlador.
app.use('/api/repartidores', autenticar, autorizar(['admin', 'repartidor', 'supervisor_ventas', 'supervisor_cocina']), repartidorRoutes);

// Rutas de Clientes: Acceso granular en controlador.
app.use('/api/cliente', autenticar, autorizar(['admin', 'cliente']), clienteRoutes);

// --- Rutas de Generación de Imágenes ---
// Se mantiene la autenticación aquí para la generación de imágenes, ya que es una operación que modifica/consume recursos.
app.use('/api', imageGenerationRoutes); // Protege el router con autenticación.

// Configuración del puerto y arranque del servidor
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
