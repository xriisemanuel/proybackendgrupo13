// index.js
const express = require('express');
const connectDB = require('./database'); // se conecta con database.js
const clienteRoutes = require('./routes/cliente.routes');
const categoriaRoutes = require('./routes/categoria.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a base de datos
connectDB();

// Middleware para procesar JSON
app.use(express.json());

// Rutas
app.use('/api/clientes', clienteRoutes);
app.use('/api/categorias', categoriaRoutes);

// Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
