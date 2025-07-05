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
// Configuración de CORS: Permitir solicitudes desde tu frontend Angular
// Es importante que en producción, 'http://localhost:4200' sea reemplazado por el dominio real de tu frontend.
app.use(cors({ origin: 'http://localhost:4200' }));

// --- Rutas de Autenticación ---
// Estas rutas no requieren autenticación previa, ya que son para registrarse o iniciar sesión
app.use('/api/auth', authRoutes);

// --- Rutas Protegidas y con Control de Acceso por Roles ---

// Rutas de Roles: Solo accesible por Administrador
// Permite la gestión de roles (crear, ver, actualizar, eliminar)
app.use('/api/rol', autenticar, autorizar(['admin']), rolRoutes);

// Rutas de Usuarios: Solo accesible por Administrador
// Permite la gestión de usuarios (crear, ver, actualizar, eliminar)
app.use('/api/usuario', autenticar, autorizar(['admin']), usuarioRoutes);

// Rutas de Pedidos:
// La gestión de pedidos puede ser compleja y requerir diferentes permisos:
// - 'cliente': Puede ver y gestionar sus propios pedidos.
// - 'repartidor': Puede ver y actualizar el estado de los pedidos que le son asignados.
// - 'supervisor_cocina': Puede ver y actualizar el estado de los pedidos en preparación.
// - 'admin': Acceso completo a todos los pedidos.
// La lógica granular de qué puede hacer cada rol sobre los pedidos específicos debe estar en el controlador de Pedidos.
// Aquí se define qué roles tienen acceso general a las rutas de pedidos.
app.use('/api/pedido', autenticar, autorizar(['admin', 'cliente', 'repartidor', 'supervisor_cocina']), pedidoRoutes);

// Rutas de Ventas: Accesible por Administrador y Supervisor de Ventas
// Permite la gestión y visualización de ventas.
app.use('/api/ventas', autenticar, autorizar(['admin', 'supervisor_ventas']), ventaRoutes);

// Rutas de Calificaciones: Solo accesible por Clientes (para calificar sus propios pedidos)
// Un cliente solo debería poder calificar sus propios pedidos. La validación de esto se haría en el controlador.
app.use('/api/calificaciones', autenticar, autorizar(['cliente']), calificacionRoutes);

// Rutas de Categorías:
// Opción 1 (Actual): Todo protegido por administrador (más simple para empezar):
// Permite al administrador gestionar las categorías.
app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes);
// Opción 2: Permitir GET público, proteger POST/PUT/DELETE dentro de categoriaRoutes
// app.get('/api/categorias', categoriaRoutes); // Rutas GET públicas, sin autenticación/autorización
// app.use('/api/categorias', autenticar, autorizar(['admin']), categoriaRoutes); // Rutas POST/PUT/DELETE con autenticación/autorización

// Rutas de Productos: Similar a categorías. Público para ver, Administrador para gestionar.
// Opción 1 (Actual): Todo protegido por administrador (más simple para empezar):
// Permite al administrador gestionar los productos.
app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes);
// Opción 2: Permitir GET público, proteger POST/PUT/DELETE dentro de productoRoutes
// app.get('/api/productos', productoRoutes); // Rutas GET públicas, sin autenticación/autorización
// app.use('/api/productos', autenticar, autorizar(['admin']), productoRoutes); // Rutas POST/PUT/DELETE con autenticación/autorización

// Rutas de Combos: Accesible por Administrador para gestionar
app.use('/api/combos', autenticar, autorizar(['admin']), comboRoutes);

// Rutas de Ofertas: Accesible por Administrador y Supervisor de Ventas para gestionar
app.use('/api/ofertas', autenticar, autorizar(['admin', 'supervisor_ventas']), ofertaRoutes);

// Rutas de Repartidores:
// - 'repartidor': Puede actualizar su ubicación/estado (su propio perfil).
// - 'admin': Puede ver/gestionar todos los repartidores.
// La lógica granular (ej. un repartidor solo puede actualizarse a sí mismo) debe estar en el controlador de Repartidores.
app.use('/api/repartidores', autenticar, autorizar(['admin', 'repartidor']), repartidorRoutes);

// Rutas de Clientes:
// - El registro de clientes se hará a través de /api/auth/register.
// - La gestión de clientes (ej. ver todos, eliminar) será para Administradores.
// - Un cliente podría ver/editar su propio perfil (lógica en el controlador).
// Se añade 'admin' para la gestión general y 'cliente' para que un cliente pueda acceder a sus propios datos.
// La validación de "solo sus propios datos" se hace en el controlador.
app.use('/api/cliente', autenticar, autorizar(['admin', 'cliente']), clienteRoutes);

// Configuración del puerto y arranque del servidor
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
