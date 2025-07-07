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

        // --- INICIO DE DEPURACIÓN DE MIDDLEWARE DE AUTENTICACIÓN ---
        console.log('MIDDLEWARE AUTENTICAR: Token decodificado. Payload:', verificado);
        console.log('MIDDLEWARE AUTENTICAR: Rol extraído del token:', req.usuario.rol);
        // --- FIN DE DEPURACIÓN DE MIDDLEWARE DE AUTENTICACIÓN ---

        next();
    } catch (error) {
        console.error('MIDDLEWARE AUTENTICAR: Token inválido o expirado:', error.message);
        res.status(400).json({ mensaje: 'Token inválido o expirado.' });
    }
};

exports.autorizar = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.rol) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No hay información de rol.' });
        }

        const userRole = req.usuario.rol; // Rol del usuario desde el token

        // --- INICIO DE DEPURACIÓN DE MIDDLEWARE DE AUTORIZACIÓN ---
        console.log('MIDDLEWARE AUTORIZAR: Rol del usuario (desde token):', userRole);
        console.log('MIDDLEWARE AUTORIZAR: Roles permitidos para esta ruta:', rolesPermitidos);
        console.log('MIDDLEWARE AUTORIZAR: Comparación (rol del usuario incluido en roles permitidos):', rolesPermitidos.includes(userRole));
        // --- FIN DE DEPURACIÓN DE MIDDLEWARE DE AUTORIZACIÓN ---

        if (!rolesPermitidos.includes(userRole)) {
            return res.status(403).json({ mensaje: 'Acceso denegado. No tiene los permisos necesarios.' });
        }
        next();
    };
};
