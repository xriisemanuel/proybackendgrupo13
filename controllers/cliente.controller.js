const Cliente = require('../models/cliente.model'); // Importa el modelo Cliente

// --- Operaciones CRUD Básicas ---

exports.crearCliente = async (req, res) => {
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
    res.status(500).json({
      mensaje: 'Error al crear el cliente',
      error: error.message
    });
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({});
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener clientes',
      error: error.message
    });
  }
};

exports.obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado'
      });
    }
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener cliente',
      error: error.message
    });
  }
};

exports.actualizarCliente = async (req, res) => {
  try {
    const {
      id
    } = req.params;
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
    res.status(500).json({
      mensaje: 'Error al actualizar el cliente',
      error: error.message
    });
  }
};

exports.eliminarCliente = async (req, res) => {
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
    res.status(500).json({
      mensaje: 'Error al eliminar el cliente',
      error: error.message
    });
  }
};

// --- Operaciones Específicas de Cliente ---

exports.obtenerHistorialPedidos = async (req, res) => {
  // Esta función requeriría un modelo de Pedido y una relación con el Cliente.
  // Por ahora, es un placeholder. Asumimos que los pedidos tienen un clienteId.
  try {
    const {
      id
    } = req.params;
    // const Pedido = require('../models/Pedido'); // Descomentar si tienes un modelo de Pedido
    // const historial = await Pedido.find({ clienteId: id }).sort({ fecha: -1 });

    // Si no tienes un modelo de Pedido aún, puedes devolver un array vacío o un mensaje.
    res.status(200).json({
      mensaje: 'Funcionalidad de historial de pedidos pendiente de implementación con modelo de Pedido.',
      clienteId: id,
      historial: [], // Placeholder
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener historial de pedidos',
      error: error.message
    });
  }
};

exports.calcularDescuentoFidelidad = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado'
      });
    }
    const descuento = cliente.calcularDescuentoFidelidad(); // Usa el método definido en el esquema
    res.status(200).json({
      mensaje: 'Descuento de fidelidad calculado',
      puntos: cliente.puntos,
      descuentoAplicable: descuento, // Por ejemplo, 0.10 para 10%
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al calcular descuento de fidelidad',
      error: error.message
    });
  }
};