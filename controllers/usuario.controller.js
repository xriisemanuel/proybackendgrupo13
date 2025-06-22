
const Usuario = require('../models/usuario'); // Keep this one, as it's the Mongoose model
const usuarioController = {}; // Defines an object to attach controller methods

// 1. Crear Usuario
usuarioController.crearUsuario = async (req, res) => {
    try {
        const nuevoUsuario = new Usuario(req.body);
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear usuario', error: error.message });
    }
};

// 2. Listar Usuarios
usuarioController.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
    }
};

// 3. Obtener Usuario por ID
usuarioController.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuario', error: error.message });
    }
};

// 4. Actualizar Usuario
usuarioController.actualizarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json({ mensaje: 'Usuario actualizado exitosamente', usuario: usuario });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar usuario', error: error.message });
    }
};

// 5. Eliminar Usuario
usuarioController.eliminarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
    }
};

// 6. Login de Usuario
usuarioController.loginUsuario = async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas: Usuario no encontrado' });
        }
        // In a real application, you would compare the hashed password here
        // For demonstration, a simple comparison:
        if (usuario.password !== password) { // **IMPORTANT: In production, use bcrypt or similar for password hashing**
            return res.status(401).json({ mensaje: 'Credenciales inválidas: Contraseña incorrecta' });
        }
        // If authentication is successful, you might generate a JWT
        res.status(200).json({ mensaje: 'Login exitoso', usuario: { id: usuario._id, email: usuario.email } });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el login', error: error.message });
    }
};

// 7. Cambiar Contraseña
usuarioController.cambiarPassword = async (req, res) => {
    const { id, oldPassword, newPassword } = req.body;
    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // **IMPORTANT: In production, compare hashed passwords**
        if (usuario.password !== oldPassword) {
            return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
        }

        // **IMPORTANT: In production, hash the newPassword before saving**
        usuario.password = newPassword;
        await usuario.save();
        res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar contraseña', error: error.message });
    }
};

// 8. Recuperar Contraseña (Solicitud de recuperación - típicamente envía un token por email)
usuarioController.recuperarPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado con ese correo electrónico' });
        }

        // In a real application, you would generate a unique token, save it to the user
        // record with an expiration, and send an email to the user with a link containing this token.
        // For demonstration:
        const resetToken = 'some_generated_unique_token'; // Replace with actual token generation
        // usuario.resetPasswordToken = resetToken;
        // usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        // await usuario.save();

        // Simulate sending email (replace with actual email sending logic)
        console.log(`Sending password reset email to ${email} with token: ${resetToken}`);

        res.status(200).json({ mensaje: 'Si el correo existe, se ha enviado un enlace de recuperación de contraseña.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar recuperación de contraseña', error: error.message });
    }
};

// 9. Verificar Token (Para recuperación de contraseña o autenticación de email)
usuarioController.verificarToken = async (req, res) => {
    const { token } = req.body; // Or req.params.token if it's in the URL
    try {
        // In a real application, you would find a user with this token and check its expiration
        // For demonstration:
        // const usuario = await Usuario.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        // if (!usuario) {
        //     return res.status(400).json({ mensaje: 'Token inválido o expirado' });
        // }

        res.status(200).json({ mensaje: 'Token válido', isValid: true });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar token', error: error.message });
    }
};

// 10. Enviar Email (General purpose, e.g., for verification or notifications)
usuarioController.enviarEmail = async (req, res) => {
    const { to, subject, text, html } = req.body;
    try {
        // In a real application, you would use a nodemailer or similar library here
        // to send the email.
        console.log(`Sending email to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);

        // Example:
        // const nodemailer = require('nodemailer');
        // let transporter = nodemailer.createTransport({ ... });
        // await transporter.sendMail({ from: 'your_email@example.com', to, subject, text, html });

        res.status(200).json({ mensaje: 'Correo electrónico enviado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al enviar correo electrónico', error: error.message });
    }
};

// It's common practice to export the controller object at the end
module.exports = usuarioController;