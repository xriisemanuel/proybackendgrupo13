const nodemailer = require('nodemailer');

// Carga las variables de entorno para usar las credenciales de email
// Asegúrate de que dotenv.config() ya fue llamado en tu app.js o server.js
// o puedes llamarlo aquí también si este servicio se usa de forma independiente.
// require('dotenv').config(); 

// Verificar si las variables de entorno están configuradas
const isEmailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter = null;

if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true para 465, false para otros puertos como 587 o 2525 (Mailtrap)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    console.warn('Configuración de email no encontrada. El servicio de email estará deshabilitado.');
}

/**
 * Función para enviar un correo electrónico.
 * @param {string} to - Dirección de correo del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {string} text - Contenido del correo en texto plano.
 * @param {string} [html] - Contenido del correo en HTML (opcional).
 */
exports.enviarEmail = async (to, subject, text, html = null) => {
    // Si no hay configuración de email, no hacer nada
    if (!isEmailConfigured || !transporter) {
        console.warn('Servicio de email no configurado. Saltando envío de email.');
        return true; // Retornamos true para no fallar el proceso
    }

    try {
        const mailOptions = {
            from: process.env.FROM_EMAIL || process.env.EMAIL_USER, // Remitente definido en .env
            to: to,
            subject: subject,
            text: text,
            html: html || text, // Si hay HTML, úsalo; si no, usa el texto plano
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: %s', info.messageId);
        return true; // Indica éxito
    } catch (error) {
        console.error('Error al enviar correo:', error);
        // No lanzamos el error, solo lo registramos
        return false; // Indica que hubo un error pero no fallamos el proceso
    }
};