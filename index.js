//rutas principales
import { Router } from 'express';

const express = require('express');
const app = express();
const connectDB = require('./config/db');
const clienteRoutes = require('./routes/cliente.routes');
const categoriaRoutes = require('./routes/categoria.routes');

connectDB(); // conectar con MongoDB
app.use(express.json()); // para leer JSON
app.use('/api/clientes', clienteRoutes); // prefijo para rutas de cliente
app.use('/api/categorias', categoriaRoutes);