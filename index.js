// index.js

// 1. Cargar variables de entorno del archivo .env
require('dotenv').config();

// 2. Importar Express y Mongoose
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa el módulo CORS

// 3. Importar tus routers de rutas
const comboRoutes = require('./routes/comboRoutes');
const ofertaRoutes = require('./routes/ofertaRoutes');
// Importa también el modelo Producto para que Mongoose lo registre (aunque no tengas sus rutas aquí)
require('./models/producto'); // Esto asegura que Mongoose tenga conocimiento del modelo Producto
require('./models/combo');    // Esto asegura que Mongoose tenga conocimiento del modelo Combo
require('./models/oferta');   // Esto asegura que Mongoose tenga conocimiento del modelo Oferta


// 4. Crear una instancia de la aplicación Express
const app = express();

// 5. Configuración de middlewares (software intermedio que procesa las solicitudes)
// Habilitar CORS para permitir solicitudes desde tu frontend Angular
// Esto es crucial porque tu frontend (Angular) estará en un puerto diferente (ej. 4200)
// y tu backend (Node.js/Express) en otro (ej. 4000 o 3000).
app.use(cors());

// Middleware para parsear el body de las solicitudes como JSON
app.use(express.json()); // Permite a Express entender JSON enviado en el cuerpo de las solicitudes

// 6. Obtener la URI de la base de datos desde las variables de entorno
const dbUri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 4000; // Define el puerto del servidor, usa 4000 por defecto si no se define en .env

// 7. Función para conectar a la base de datos
const connectDB = async () => {
    try {
        if (!dbUri) {
            // Ya no debería dar undefined si se solucionó la vez anterior
            throw new Error('MONGODB_URI no está definida en las variables de entorno. Por favor, verifica tu archivo .env');
        }
        await mongoose.connect(dbUri);
        console.log('Conectado a MongoDB Atlas exitosamente!');
    } catch (error) {
        console.error('Error al conectar a MongoDB Atlas:', error.message);
        process.exit(1); // Sale del proceso Node.js si la conexión a la DB falla
    }
};

// 8. Montar las rutas de la API
// Todas las rutas de comboRoutes.js estarán prefijadas con '/api/combos'
app.use('/api/combos', comboRoutes);
// Todas las rutas de ofertaRoutes.js estarán prefijadas con '/api/ofertas'
app.use('/api/ofertas', ofertaRoutes);

// index.js (parte de las rutas)

// ... otras configuraciones

// Montar las rutas de la API
app.use('/api/combos', comboRoutes);
app.use('/api/ofertas', ofertaRoutes);

// Ruta base de la API (opcional, pero útil)
app.get('/api', (req, res) => {
    res.json({
        msg: 'Bienvenido a la API de SUBTE!',
        endpoints: {
            combos: '/api/combos',
            ofertas: '/api/ofertas'
            // Puedes añadir más si tienes otros endpoints principales
        }
    });
});

// Ruta de prueba o "Home" de la API (ya la tienes)
app.get('/', (req, res) => {
    res.send('API de SUBTE funcionando correctamente!');
});

// ... el resto de tu código

// 9. Ruta de prueba o "Home" de la API (opcional)
app.get('/', (req, res) => {
    res.send('API de SUBTE funcionando correctamente!');
});

// 10. Iniciar el servidor
// Primero conecta a la DB, luego inicia el servidor Express
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor de SUBTE corriendo en el puerto ${PORT}`);
        console.log(`Accede a la API en: http://localhost:${PORT}/api/`);
    });
}).catch(err => {
    console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', err);
});