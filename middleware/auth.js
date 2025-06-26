// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '1234567890'; // Usar la misma clave secreta

exports.autenticar = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const tokenLimpio = token.replace('Bearer ', '');
        const verificado = jwt.verify(tokenLimpio, JWT_SECRET);
        req.usuario = verificado; // ¡Aquí es donde la información del usuario del token se hace disponible!
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

        // Asumiendo que `req.usuario.rol` es el valor del rol (ej. 'admin', 'user')
        // Si `req.usuario.rol` es un ID, necesitarías una lógica para mapearlo a un nombre de rol.
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tiene los permisos necesarios.' });
        }
        next();
    };
};