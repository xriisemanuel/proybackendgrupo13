require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('./database');

// Importar los middlewares de autenticación y autorización
const { autenticar, autorizar } = require('./middleware/auth');

// Importar las rutas existentes y la nueva de autenticación
const authRoutes = require('./routes/auth.routes'); // Rutas para login/registro
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

var app = express();

// Middlewares globales
app.use(express.json()); // Para parsear el cuerpo de las solicitudes como JSON
app.use(cors({ origin: 'http://localhost:4200' })); // Permitir solicitudes CORS desde tu frontend Angular

// --- Rutas de Autenticación ---
// Estas rutas no requieren autenticación previa, ya que son para registrarse o iniciar sesión
app.use('/api/auth', authRoutes);

// --- Rutas Protegidas y con Control de Acceso por Roles ---

// Rutas de Roles: Solo accesible por Administrador
// (ej. POST, GET, PUT, DELETE /api/rol)
app.use('/api/rol', autenticar, autorizar(['admin']), rolRoutes);

// Rutas de Usuarios: Solo accesible por Administrador (gestión de usuarios)
// (ej. POST, GET, PUT, DELETE /api/usuario)
app.use('/api/usuario', autenticar, autorizar(['admin']), usuarioRoutes);

// Rutas de Pedidos:
// - Clientes: pueden crear pedidos (POST), ver sus propios pedidos (GET).
// - Supervisor de Cocina: puede actualizar el estado del pedido (PUT).
// - Administrador: puede ver todos los pedidos y realizar cualquier operación (GET, PUT, DELETE).
// La lógica más granular (ej. solo ver sus propios pedidos) debería estar dentro del controlador de Pedidos.
app.use('/api/pedido', autenticar, pedidoRoutes); // El controlador de pedidos manejará la lógica específica de roles

// Rutas de Ventas: Solo accesible por Administrador y Supervisor de Ventas
// (ej. GET /api/ventas, para ver métricas y gráficos)
app.use('/api/ventas', autenticar, autorizar(['admin', 'supervisor_ventas']), ventaRoutes);

// Rutas de Calificaciones: Solo accesible por Clientes (para calificar sus propios pedidos)
// (ej. POST /api/calificaciones, GET /api/calificaciones)
app.use('/api/calificaciones', autenticar, autorizar(['cliente']), calificacionRoutes);

// Rutas de Categorías:
// - Público: Puede listar y ver categorías (GET).
// - Administrador: Puede crear, actualizar, eliminar categorías (POST, PUT, DELETE).
// Aquí separamos para dar acceso público a la visualización.
// Para esto, necesitarías definir rutas específicas dentro de categoriaRoutes que usen o no el middleware.
// O bien, puedes aplicar autenticar y autorizar a todo el módulo y manejar excepciones dentro del controlador
// para las operaciones GET si lo quieres público, o mantenerlo protegido para todo el módulo como se muestra.
// Opción 1: Todo protegido por administrador (más simple para empezar):
app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes);
// Opción 2: Permitir GET público, proteger POST/PUT/DELETE dentro de categoriaRoutes
// app.get('/api/categorias', categoriaRoutes); // Aquí solo rutas GET, sin middleware
// app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes); // Rutas POST/PUT/DELETE con middleware

// Rutas de Productos: Similar a categorías. Público para ver, Administrador para gestionar.
// Opción 1: Todo protegido por administrador (más simple para empezar):
app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes);
// Opción 2: Permitir GET público, proteger POST/PUT/DELETE dentro de productoRoutes
// app.get('/api/productos', productoRoutes); // Aquí solo rutas GET, sin middleware
// app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes); // Rutas POST/PUT/DELETE con middleware

// Rutas de Combos: Accesible por Administrador para gestionar
app.use('/api/combos', autenticar, autorizar(['admin']), comboRoutes);

// Rutas de Ofertas: Accesible por Administrador y Supervisor de Ventas para gestionar
app.use('/api/ofertas', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaRoutes);

// Rutas de Repartidores:
// - Repartidor: Puede actualizar su ubicación/estado.
// - Administrador: Puede ver/gestionar repartidores.
// La lógica granular debe estar en el controlador de Repartidores.
app.use('/api/repartidores', autenticar, repartidorRoutes);

// Rutas de Clientes:
// - El registro de clientes se hará a través de /api/auth/register.
// - La gestión de clientes (ej. ver todos, eliminar) será para Administradores.
// - Un cliente podría ver/editar su propio perfil (lógica en el controlador).
app.use('/api/cliente', autenticar, clienteRoutes); // El controlador de clientes manejará la lógica de roles

// Configuración del puerto y arranque del servidor
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
