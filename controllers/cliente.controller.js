const Cliente = require('../models/cliente.model'); // Importa el modelo Cliente
const Usuario = require('../models/usuario'); // Necesario para vincular el clienteId al usuario autenticado
const Pedido = require('../models/pedido'); // Necesario para obtener el historial de pedidos

// --- Operaciones CRUD Básicas ---

exports.crearCliente = async (req, res) => {
  // La creación de clientes como parte del registro de usuario ya se maneja en auth.controller.js.
  // Esta función, si se usa, debería ser para que un Administrador cree un perfil de cliente manualmente,
  // o para un proceso interno. Por lo tanto, la restringimos al rol 'admin'.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden crear clientes directamente.' });
  }

  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();
    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    if (error.code === 11000) { // Error de duplicado (ej. email único)
      return res.status(400).json({
        mensaje: 'El email del cliente ya está registrado.'
      });
    }
    console.error('Error al crear el cliente:', error);
    res.status(500).json({
      mensaje: 'Error al crear el cliente',
      error: error.message
    });
  }
};

exports.obtenerClientes = async (req, res) => {
  // Solo el Administrador puede listar todos los clientes.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden listar todos los clientes.' });
  }

  try {
    const clientes = await Cliente.find({});
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      mensaje: 'Error al obtener clientes',
      error: error.message
    });
  }
};

exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id; // ID del usuario autenticado

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Lógica de autorización:
    // - Administrador puede ver cualquier cliente.
    // - Cliente solo puede ver su propio perfil.
    // - Supervisor de Ventas puede ver cualquier cliente.
    if (userRole === 'cliente') {
      const usuarioAsociado = await Usuario.findById(userId);
      if (!usuarioAsociado || !usuarioAsociado.clienteId || usuarioAsociado.clienteId.toString() !== id) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver su propio perfil de cliente.' });
      }
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para ver perfiles de cliente.' });
    }

    res.status(200).json(cliente);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.', detalle: error.message });
    }
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      mensaje: 'Error al obtener cliente',
      error: error.message
    });
  }
};

exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id; // ID del usuario autenticado

    // Lógica de autorización:
    // - Administrador puede actualizar cualquier cliente.
    // - Cliente solo puede actualizar su propio perfil.
    if (userRole === 'cliente') {
      const usuarioAsociado = await Usuario.findById(userId);
      if (!usuarioAsociado || !usuarioAsociado.clienteId || usuarioAsociado.clienteId.toString() !== id) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede actualizar su propio perfil de cliente.' });
      }
    } else if (userRole !== 'admin') { // Solo admin tiene permiso general
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para actualizar perfiles de cliente.' });
    }

    const clienteActualizado = await Cliente.findByIdAndUpdate(id, req.body, {
      new: true, // Devuelve el documento actualizado
      runValidators: true // Corre las validaciones definidas en el esquema
    });

    if (!clienteActualizado) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado para actualizar'
      });
    }
    res.status(200).json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado
    });
  } catch (error) {
    if (error.code === 11000) { // Error de duplicado (ej. email único)
      return res.status(400).json({
        mensaje: 'El email del cliente ya está registrado.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.', detalle: error.message });
    }
    console.error('Error al actualizar el cliente:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar el cliente',
      error: error.message
    });
  }
};

exports.eliminarCliente = async (req, res) => {
  // Solo el Administrador puede eliminar clientes.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores pueden eliminar clientes.' });
  }

  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);
    if (!clienteEliminado) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado para eliminar'
      });
    }
    res.status(200).json({
      mensaje: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.', detalle: error.message });
    }
    console.error('Error al eliminar el cliente:', error);
    res.status(500).json({
      mensaje: 'Error al eliminar el cliente',
      error: error.message
    });
  }
};

// --- Operaciones Específicas de Cliente ---

exports.obtenerHistorialPedidos = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    // Lógica de autorización:
    // - Administrador o Supervisor de Ventas pueden ver cualquier historial.
    // - Cliente solo puede ver su propio historial de pedidos.
    if (userRole === 'cliente') {
      const usuarioAsociado = await Usuario.findById(userId);
      if (!usuarioAsociado || !usuarioAsociado.clienteId || usuarioAsociado.clienteId.toString() !== id) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver su propio historial de pedidos.' });
      }
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para ver historial de pedidos de otros clientes.' });
    }

    const historial = await Pedido.find({ clienteId: id })
      .populate('detalleProductos.productoId', 'nombre precio') // Puedes popular más campos si lo necesitas
      .sort({ fechaPedido: -1 });

    res.status(200).json({
      mensaje: 'Historial de pedidos obtenido exitosamente.',
      clienteId: id,
      historial: historial,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.', detalle: error.message });
    }
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({
      mensaje: 'Error al obtener historial de pedidos',
      error: error.message
    });
  }
};

exports.calcularDescuentoFidelidad = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;
    const userId = req.usuario._id;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Lógica de autorización:
    // - Administrador o Supervisor de Ventas pueden calcular para cualquier cliente.
    // - Cliente solo puede calcular para sí mismo.
    if (userRole === 'cliente') {
      const usuarioAsociado = await Usuario.findById(userId);
      if (!usuarioAsociado || !usuarioAsociado.clienteId || usuarioAsociado.clienteId.toString() !== id) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede calcular descuento de fidelidad para su propio perfil.' });
      }
    } else if (!['admin', 'supervisor_ventas'].includes(userRole)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tiene permisos para calcular descuentos de fidelidad.' });
    }

    // Asumiendo que `calcularDescuentoFidelidad` es un método en el esquema del modelo Cliente
    // Ejemplo simple:
    // schema.methods.calcularDescuentoFidelidad = function() {
    //   if (this.puntos >= 100) return 0.10; // 10% de descuento
    //   return 0;
    // };
    const descuento = cliente.calcularDescuentoFidelidad ? cliente.calcularDescuentoFidelidad() : 0;

    res.status(200).json({
      mensaje: 'Descuento de fidelidad calculado',
      puntos: cliente.puntos,
      descuentoAplicable: descuento, // Por ejemplo, 0.10 para 10%
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de cliente inválido.', detalle: error.message });
    }
    console.error('Error al calcular descuento de fidelidad:', error);
    res.status(500).json({
      mensaje: 'Error al calcular descuento de fidelidad',
      error: error.message
    });
  }
};
