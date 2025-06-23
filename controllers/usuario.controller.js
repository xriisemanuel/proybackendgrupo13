const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken'); // Necesitas instalar jsonwebtoken: npm install jsonwebtoken
const bcrypt = require('bcryptjs'); // Necesitas instalar bcryptjs si aún no lo hiciste

// Configura tu secreto JWT (guárdalo en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// --- Operaciones CRUD Básicas ---

exports.crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
  } catch (error) {
    if (error.code === 11000) { // Código de error para duplicados de unique
      return res.status(400).json({
        mensaje: 'El username o email ya existen.'
      });
    }
    res.status(500).json({
      mensaje: 'Error al crear el usuario',
      error: error.message
    });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({})
      .populate('rolId', 'nombre') // Trae el nombre del rol
      .populate('clienteId', 'nombre'); // Trae el nombre del cliente (si existe)
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al listar usuarios',
      error: error.message
    });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .populate('rolId', 'nombre')
      .populate('clienteId', 'nombre');
    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const datosActualizar = { ...req.body
    };

    // Si se intenta actualizar la contraseña, la encriptamos de nuevo
    if (datosActualizar.password) {
      datosActualizar.password = await bcrypt.hash(datosActualizar.password, 10);
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(id, datosActualizar, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!usuarioActualizado) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado para actualizar'
      });
    }
    res.status(200).json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el usuario',
      error: error.message
    });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado para eliminar'
      });
    }
    res.status(200).json({
      mensaje: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el usuario',
      error: error.message
    });
  }
};

// --- Métodos de Autenticación y Autorización ---

exports.loginUsuario = async (req, res) => {
  const {
    username,
    password
  } = req.body;
  try {
    const usuario = await Usuario.findOne({
      username
    });
    if (!usuario) {
      return res.status(400).json({
        mensaje: 'Credenciales inválidas'
      });
    }

    const isMatch = await usuario.compararPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        mensaje: 'Credenciales inválidas'
      });
    }

    // Si las credenciales son válidas, generamos un token JWT
    const token = jwt.sign({
      id: usuario._id,
      rol: usuario.rolId
    }, JWT_SECRET, {
      expiresIn: '1h'
    }); // Token expira en 1 hora

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        email: usuario.email,
        rolId: usuario.rolId,
      },
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error en el inicio de sesión',
      error: error.message
    });
  }
};

exports.logout = (req, res) => {
  // En un API RESTful sin sesiones del lado del servidor, "logout" se maneja limpiando el token del lado del cliente.
  // Aquí simplemente enviamos una respuesta.
  res.status(200).json({
    mensaje: 'Sesión cerrada exitosamente (token debe ser eliminado del cliente)'
  });
};

exports.cambiarPassword = async (req, res) => {
  const {
    id
  } = req.params; // O req.usuario.id si se obtiene del token
  const {
    passwordActual,
    nuevaPassword
  } = req.body;

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    const isMatch = await usuario.compararPassword(passwordActual);
    if (!isMatch) {
      return res.status(400).json({
        mensaje: 'Contraseña actual incorrecta'
      });
    }

    usuario.password = nuevaPassword; // El pre-save hook se encargará de hashear la nueva contraseña
    await usuario.save();

    res.status(200).json({
      mensaje: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al cambiar la contraseña',
      error: error.message
    });
  }
};

// --- Lógica de recuperación de contraseña (requeriría un servicio de correo) ---
exports.recuperarPassword = async (req, res) => {
  const {
    email
  } = req.body;
  try {
    const usuario = await Usuario.findOne({
      email
    });
    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario con ese email no encontrado'
      });
    }

    // Aquí generarías un token de recuperación y lo guardarías en el usuario (con fecha de expiración)
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // usuario.resetPasswordToken = resetToken;
    // usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    // await usuario.save();

    // Luego, enviarías un email al usuario con un enlace que contenga este token
    // await enviarEmail(usuario.email, 'Recuperación de Contraseña', `Haz clic en este enlace: /reset-password/${resetToken}`);

    res.status(200).json({
      mensaje: 'Si el email existe, se ha enviado un enlace de recuperación.'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error en la recuperación de contraseña',
      error: error.message
    });
  }
};

// Nota: Las funciones `validarCredenciales`, `listarUsuariosPorRol`, `verificarToken`, `enviarEmail`
// son auxiliares o pueden ser parte de un middleware o servicio aparte.
// - `validarCredenciales` se incorpora en `loginUsuario`.
// - `listarUsuariosPorRol` se podría implementar como otro método en el controlador si es una ruta específica.
// - `verificarToken` sería un middleware de autenticación (ver `middleware/auth.js`).
// - `enviarEmail` sería un servicio externo (por ejemplo, `services/emailService.js`).