const mongoose = require('mongoose');
const Calificacion = require('../models/Calificacion');
const Pedido = require('../models/pedido'); // Para verificar que el pedido existe y ya fue entregado
const Cliente = require('../models/cliente.model'); // Para verificar que el cliente existe y obtener el clienteId
const Producto = require('../models/producto'); // Para verificar productos en calificaciones específicas

// --- Operaciones CRUD Básicas ---

exports.crearCalificacion = async (req, res) => {
  try {
    const {
      pedidoId,
      puntuacionComida,
      puntuacionServicio,
      puntuacionEntrega,
      comentario,
      calificacionProductos
    } = req.body;

    // Obtener el usuarioId del token JWT
    const usuarioId = req.usuario._id;

    // Verificar que el usuario autenticado sea un cliente
    if (req.usuario.rol !== 'cliente') {
      return res.status(403).json({ mensaje: 'Solo los clientes pueden crear calificaciones.' });
    }

    // Buscar el cliente asociado a este usuario
    const cliente = await Cliente.findOne({ usuarioId: usuarioId });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }
    const clienteId = cliente._id;

    console.log('DEBUG - Usuario ID del token:', usuarioId);
    console.log('DEBUG - Cliente encontrado:', cliente._id);
    console.log('DEBUG - Cliente ID:', clienteId);

    // 1. Verificar que el pedido exista y esté en estado 'entregado'
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
    }
    if (pedido.estado !== 'entregado') {
      return res.status(400).json({ mensaje: 'Solo se pueden calificar pedidos que ya han sido entregados.' });
    }
    
    // Asegurarse de que el cliente de la calificación sea el mismo que el del pedido
    console.log('DEBUG - Pedido Cliente ID:', pedido.clienteId.toString());
    console.log('DEBUG - Cliente ID del token:', clienteId.toString());
    console.log('DEBUG - Comparación:', pedido.clienteId.toString() === clienteId.toString());

    if (pedido.clienteId.toString() !== clienteId.toString()) {
      return res.status(403).json({ mensaje: 'No tiene permiso para calificar este pedido.' });
    }

    // 2. Verificar si ya existe una calificación para este pedido
    const calificacionExistente = await Calificacion.findOne({ pedidoId });
    if (calificacionExistente) {
      return res.status(409).json({ mensaje: 'Este pedido ya ha sido calificado.' });
    }

    // 3. Validar que los productos calificados pertenecen a este pedido
    if (calificacionProductos && calificacionProductos.length > 0) {
      const pedidoProductIds = pedido.detalleProductos.map(item => item.productoId.toString());
      for (const prodCal of calificacionProductos) {
        if (!pedidoProductIds.includes(prodCal.productoId.toString())) {
          return res.status(400).json({ mensaje: `El producto con ID ${prodCal.productoId} no es parte de este pedido.` });
        }
        // Opcional: Obtener el nombre del producto para guardarlo en la calificación
        const producto = await Producto.findById(prodCal.productoId);
        if (producto) {
          prodCal.nombreProducto = producto.nombre;
        } else {
          // Si el producto original no se encuentra, usar el del pedido o dar error
          const itemEnPedido = pedido.detalleProductos.find(item => item.productoId.toString() === prodCal.productoId.toString());
          prodCal.nombreProducto = itemEnPedido ? itemEnPedido.nombreProducto : 'Producto Desconocido';
        }
      }
    }

    const nuevaCalificacion = new Calificacion({
      pedidoId,
      clienteId,
      puntuacionComida,
      puntuacionServicio,
      puntuacionEntrega,
      comentario,
      calificacionProductos,
    });

    console.log('DEBUG - Nueva calificación a guardar:', {
      pedidoId,
      clienteId,
      puntuacionComida,
      puntuacionServicio,
      puntuacionEntrega,
      comentario
    });
    console.log('DEBUG - Tipos de datos a guardar:', {
      puntuacionComida: typeof puntuacionComida,
      puntuacionServicio: typeof puntuacionServicio,
      puntuacionEntrega: typeof puntuacionEntrega
    });

    await nuevaCalificacion.save();

    console.log('DEBUG - Calificación guardada:', nuevaCalificacion);
    console.log('DEBUG - Valores guardados:', {
      puntuacionComida: nuevaCalificacion.puntuacionComida,
      puntuacionServicio: nuevaCalificacion.puntuacionServicio,
      puntuacionEntrega: nuevaCalificacion.puntuacionEntrega
    });

    res.status(201).json({
      mensaje: 'Calificación creada exitosamente',
      calificacion: nuevaCalificacion
    });
  } catch (error) {
    console.error('Error al crear la calificación:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al crear la calificación',
      error: error.message
    });
  }
};

exports.obtenerCalificaciones = async (req, res) => {
  try {
    let calificaciones;
    
    // Si es admin, obtener todas las calificaciones
    if (req.usuario.rol === 'admin') {
      calificaciones = await Calificacion.find()
        .populate('pedidoId', 'fechaPedido estado _id')
        .populate('clienteId', 'nombre apellido email')
        .sort({ fechaCalificacion: -1 });
    } else {
      // Si es cliente, obtener solo sus calificaciones
      const cliente = await Cliente.findOne({ usuarioId: req.usuario._id });
      if (!cliente) {
        return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
      }

      calificaciones = await Calificacion.find({ clienteId: cliente._id })
        .populate('pedidoId', 'fechaPedido estado _id')
        .sort({ fechaCalificacion: -1 });
    }

    console.log('DEBUG - Calificaciones encontradas:', calificaciones.length);
    if (calificaciones.length > 0) {
      console.log('DEBUG - Primera calificación:', {
        _id: calificaciones[0]._id,
        puntuacionComida: calificaciones[0].puntuacionComida,
        puntuacionServicio: calificaciones[0].puntuacionServicio,
        puntuacionEntrega: calificaciones[0].puntuacionEntrega,
        pedidoId: calificaciones[0].pedidoId
      });
      console.log('DEBUG - Tipos de datos:', {
        puntuacionComida: typeof calificaciones[0].puntuacionComida,
        puntuacionServicio: typeof calificaciones[0].puntuacionServicio,
        puntuacionEntrega: typeof calificaciones[0].puntuacionEntrega
      });
    }

    res.status(200).json(calificaciones);
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificaciones',
      error: error.message
    });
  }
};

exports.obtenerCalificacionPorId = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id)
      .populate('pedidoId', 'fechaPedido estado')
      .populate('clienteId', 'nombre apellido email');
    
    if (!calificacion) {
      return res.status(404).json({
        mensaje: 'Calificación no encontrada'
      });
    }

    // Verificar permisos si es cliente
    if (req.usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ usuarioId: req.usuario._id });
      if (!cliente || calificacion.clienteId.toString() !== cliente._id.toString()) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para ver esta calificación'
        });
      }
    }

    res.status(200).json(calificacion);
  } catch (error) {
    console.error('Error al obtener calificación por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificación',
      error: error.message
    });
  }
};

exports.eliminarCalificacion = async (req, res) => {
  try {
    // Obtener el usuarioId del token JWT
    const usuarioId = req.usuario._id;

    // Buscar el cliente asociado a este usuario
    const cliente = await Cliente.findOne({ usuarioId: usuarioId });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    // Buscar la calificación y verificar que pertenece al cliente autenticado
    const calificacion = await Calificacion.findById(req.params.id);
    if (!calificacion) {
      return res.status(404).json({
        mensaje: 'Calificación no encontrada'
      });
    }

    // Verificar que la calificación pertenece al cliente autenticado
    if (calificacion.clienteId.toString() !== cliente._id.toString()) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para eliminar esta calificación'
      });
    }

    // Eliminar la calificación usando deleteOne en el documento
    await calificacion.deleteOne();

    res.status(200).json({
      mensaje: 'Calificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar la calificación:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al eliminar la calificación',
      error: error.message
    });
  }
};

// --- Funciones de Búsqueda y Filtrado (Adicionales) ---

exports.getCalificacionesPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar permisos: solo admin puede ver calificaciones de otros clientes
    if (req.usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ usuarioId: req.usuario._id });
      if (!cliente || cliente._id.toString() !== clienteId) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para ver las calificaciones de otro cliente'
        });
      }
    }

    const calificaciones = await Calificacion.find({ clienteId })
      .populate('pedidoId', 'fechaPedido')
      .sort({ fechaCalificacion: -1 });
    
    res.status(200).json(calificaciones);
  } catch (error) {
    console.error('Error al obtener calificaciones por cliente:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificaciones por cliente',
      error: error.message
    });
  }
};

exports.getCalificacionesPorPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    
    const calificacion = await Calificacion.findOne({ pedidoId })
      .populate('pedidoId', 'fechaPedido estado')
      .populate('clienteId', 'nombre apellido email');

    if (!calificacion) {
      return res.status(404).json({ mensaje: 'No se encontró calificación para este pedido.' });
    }

    // Verificar permisos si es cliente
    if (req.usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ usuarioId: req.usuario._id });
      if (!cliente || calificacion.clienteId.toString() !== cliente._id.toString()) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para ver esta calificación'
        });
      }
    }

    res.status(200).json(calificacion);
  } catch (error) {
    console.error('Error al obtener calificación por pedido:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificación por pedido',
      error: error.message
    });
  }
};

/**
 * @desc Obtiene las calificaciones de entrega para un repartidor específico
 * @route GET /api/calificaciones/repartidor/:repartidorId
 * @access Admin, Repartidor (para su propio perfil)
 */
exports.getCalificacionesPorRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    // Verificar que el repartidor existe
    const Repartidor = require('../models/Repartidor');
    const repartidor = await Repartidor.findById(repartidorId);
    if (!repartidor) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    // Verificar autorización: solo admin o el propio repartidor puede ver sus calificaciones
    if (req.usuario.rol === 'repartidor' && repartidor.usuarioId.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permisos para ver las calificaciones de otro repartidor.' });
    }

    // Buscar todos los pedidos asignados a este repartidor
    const pedidosRepartidor = await Pedido.find({
      repartidorId: repartidorId,
      estado: 'entregado' // Solo pedidos entregados
    }).select('_id fechaPedido');

    const pedidosIds = pedidosRepartidor.map(pedido => pedido._id);

    // Buscar calificaciones para estos pedidos
    const calificaciones = await Calificacion.find({
      pedidoId: { $in: pedidosIds }
    })
      .populate('pedidoId', 'fechaPedido estado')
      .populate('clienteId', 'nombre apellido')
      .sort({ fechaCalificacion: -1 });

    // Formatear la respuesta para incluir solo la calificación de entrega
    const calificacionesFormateadas = calificaciones.map(cal => ({
      _id: cal._id,
      pedidoId: cal.pedidoId,
      clienteId: cal.clienteId,
      puntuacionEntrega: cal.puntuacionEntrega, // Solo la calificación de entrega
      comentario: cal.comentario,
      fechaCalificacion: cal.fechaCalificacion
    }));

    res.status(200).json({
      repartidor: {
        _id: repartidor._id,
        calificacionPromedio: repartidor.calificacionPromedio,
        totalEntregas: repartidor.historialEntregas.length
      },
      calificaciones: calificacionesFormateadas,
      totalCalificaciones: calificacionesFormateadas.length
    });

  } catch (error) {
    console.error('Error al obtener calificaciones por repartidor:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificaciones por repartidor',
      error: error.message
    });
  }
};

exports.getCalificacionesPromedioProducto = async (req, res) => {
  try {
    const { productoId } = req.params; // ID del producto

    // Agregación para calcular el promedio de puntuación para un producto
    const result = await Calificacion.aggregate([
      { $unwind: '$calificacionProductos' }, // Desglosa el array de productos calificados
      { $match: { 'calificacionProductos.productoId': new mongoose.Types.ObjectId(productoId) } }, // Filtra por el producto específico
      {
        $group: {
          _id: '$calificacionProductos.productoId',
          nombreProducto: { $first: '$calificacionProductos.nombreProducto' },
          puntuacionPromedio: { $avg: '$calificacionProductos.puntuacion' },
          totalCalificaciones: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado o sin calificaciones.' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error al obtener calificaciones promedio por producto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener calificaciones promedio por producto',
      error: error.message
    });
  }
};