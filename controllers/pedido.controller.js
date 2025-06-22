const Pedido = require('../models/pedido'); // Modelo Mongoose
const pedidoController = {}; // Objeto controlador para adjuntar los métodos

// 1. Crear Pedido
pedidoController.crearPedido = async (req, res) => {
  try {
    const nuevoPedido = new Pedido(req.body);
    await nuevoPedido.save();
    res.status(201).json({ mensaje: 'Pedido creado exitosamente', pedido: nuevoPedido });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el pedido', error: error.message });
  }
};

// 2. Listar todos los Pedidos
pedidoController.listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar los pedidos', error: error.message });
  }
};

// 3. Obtener Pedido por ID
pedidoController.obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    res.status(200).json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el pedido', error: error.message });
  }
};

// 4. Actualizar Pedido por ID
pedidoController.actualizarPedido = async (req, res) => {
  try {
    const pedidoActualizado = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pedidoActualizado) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    res.status(200).json({ mensaje: 'Pedido actualizado', pedido: pedidoActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el pedido', error: error.message });
  }
};

// 5. Eliminar Pedido por ID
pedidoController.eliminarPedido = async (req, res) => {
  try {
    const eliminado = await Pedido.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    res.status(200).json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el pedido', error: error.message });
  }
};

// 6. Filtrar Pedidos por estado
pedidoController.getPedidosEstado = async (req, res) => {
  try {
    const { estado } = req.query;
    const pedidos = await Pedido.find({ estado });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al filtrar por estado', error: error.message });
  }
};

// 7. Obtener Pedidos por ID de Cliente
pedidoController.getPedidosCliente = async (req, res) => {
  try {
    const { idCliente } = req.params;
    const pedidos = await Pedido.find({ clienteId: idCliente });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedidos del cliente', error: error.message });
  }
};

// 8. Obtener Pedidos Filtrados (requiere token)
pedidoController.getPedidosFiltrados = async (req, res) => {
  try {
    const filtros = req.query;
    let query = {};

    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.fechaDesde && filtros.fechaHasta) {
      query.fecha = {
        $gte: new Date(filtros.fechaDesde),
        $lte: new Date(filtros.fechaHasta)
      };
    }

    const pedidos = await Pedido.find(query);
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedidos filtrados', error: error.message });
  }
};

module.exports = pedidoController;
