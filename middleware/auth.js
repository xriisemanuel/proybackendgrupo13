// proyecto/backend/middleware/auth.js
const jwt = require('jsonwebtoken');
// Asegúrate de que JWT_SECRET esté definido en tu archivo .env
const JWT_SECRET = process.env.JWT_SECRET || '1234567890'; // ¡CAMBIA ESTO EN PRODUCCIÓN!

exports.autenticar = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const tokenLimpio = token.replace('Bearer ', '');
        const verificado = jwt.verify(tokenLimpio, JWT_SECRET);
        // Aquí se adjunta la información del usuario decodificada al objeto req
        // Asegúrate de que tu JWT incluya _id y rol (nombre del rol)
        req.usuario = verificado;
        next();
    } catch (error) {
        // En caso de token inválido o expirado
        res.status(400).json({ mensaje: 'Token inválido o expirado.', error: error.message });
    }
};

exports.autorizar = (rolesPermitidos) => {
    return (req, res, next) => {
        // req.usuario debe haber sido establecido por el middleware 'autenticar'
        if (!req.usuario || !req.usuario.rol) {
            return res.status(403).json({ mensaje: 'Acceso denegado. Información de rol no disponible.' });
        }

        // Verifica si el rol del usuario está en la lista de roles permitidos
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tiene los permisos necesarios para esta acción.' });
        }
        next();
    };
};