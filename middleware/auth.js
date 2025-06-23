// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Usar la misma clave secreta

exports.autenticar = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const tokenLimpio = token.replace('Bearer ', ''); // Quita 'Bearer ' si está presente
        const verificado = jwt.verify(tokenLimpio, JWT_SECRET);
        req.usuario = verificado; // Agrega los datos del usuario (id, rol) al objeto request
        next();
    } catch (error) {
        res.status(400).json({ mensaje: 'Token inválido o expirado.' });
    }
};

exports.autorizar = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.rol) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No hay información de rol.' });
        }
        // Asumiendo que `req.usuario.rol` es el ID del rol y necesitarías el nombre
        // Para esto, podrías tener que obtener el rol de la BD o incluir el nombre en el token
        // Por simplicidad aquí, asumimos que 'admin', 'editor' etc. son los IDs o puedes mapearlos.
        // Lo ideal sería cargar el Rol y verificar su nombre.

        // Ejemplo simple (mejorar con búsqueda del nombre del rol si `rolId` es solo el ID)
        // const Usuario = require('../models/Usuario'); // No es buena práctica importar modelos aquí
        // const Rol = require('../models/Rol'); // Debes tener un modelo de Rol
        // const usuarioRol = await Rol.findById(req.usuario.rol);
        // if (!rolesPermitidos.includes(usuarioRol.nombre)) { ... }

        // Aquí un ejemplo básico asumiendo que `req.usuario.rol` es el nombre del rol o un ID que se mapea:
        if (!rolesPermitidos.includes(req.usuario.rol)) { // Esto sería más complejo si `req.usuario.rol` es un ObjectId
            return res.status(403).json({ mensaje: 'Acceso denegado. No tiene los permisos necesarios.' });
        }
        next();
    };
};