const nodemailer = require('nodemailer');

// Carga las variables de entorno para usar las credenciales de email
// Asegúrate de que dotenv.config() ya fue llamado en tu app.js o server.js
// o puedes llamarlo aquí también si este servicio se usa de forma independiente.
// require('dotenv').config(); 

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para otros puertos como 587 o 2525 (Mailtrap)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Función para enviar un correo electrónico.
 * @param {string} to - Dirección de correo del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {string} text - Contenido del correo en texto plano.
 * @param {string} [html] - Contenido del correo en HTML (opcional).
 */
exports.enviarEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.FROM_EMAIL, // Remitente definido en .env
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
        // Puedes lanzar el error o devolver false para que el controlador lo maneje
        throw new Error('No se pudo enviar el correo electrónico.');
    }
};