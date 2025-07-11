const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Esquema para el Subdocumento CalificacionProducto ---
// Para calificar productos específicos dentro de un pedido
const calificacionProductoSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto', // Referencia al modelo Producto
    required: true,
  },
  nombreProducto: { // Para referencia, en caso de que el nombre del producto cambie
    type: String,
    required: true,
    trim: true,
  },
  puntuacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5, // Típicamente una escala de 1 a 5 estrellas
  },
  comentario: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  _id: false, // Los subdocumentos no necesitan su propio _id por defecto
  timestamps: false,
});

// --- Esquema del Modelo Principal Calificacion ---
const calificacionSchema = new Schema({
  pedidoId: {
    type: Schema.Types.ObjectId,
    ref: 'Pedido', // Referencia al pedido que se está calificando
    required: true,
    unique: true, // Generalmente, solo una calificación por pedido
  },
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente', // Referencia al cliente que realiza la calificación
    required: true,
  },
  puntuacionComida: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  puntuacionServicio: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  puntuacionEntrega: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comentario: {
    type: String,
    trim: true,
    default: null,
    maxlength: 500, // Limitar longitud del comentario
  },
  fechaCalificacion: {
    type: Date,
    default: Date.now,
    required: true,
  },
  // Array de subdocumentos para calificaciones de productos específicos
  calificacionProductos: [calificacionProductoSchema],
});

// --- Métodos de instancia o estáticos (opcionales) ---

// Método para calcular la puntuación promedio general (opcional)
calificacionSchema.methods.calcularPuntuacionPromedio = function() {
  const sum = this.puntuacionComida + this.puntuacionServicio + this.puntuacionEntrega;
  let count = 3;
  
  if (this.calificacionProductos && this.calificacionProductos.length > 0) {
    let productosSum = 0;
    this.calificacionProductos.forEach(cp => {
      productosSum += cp.puntuacion;
    });
    return (sum + productosSum) / (count + this.calificacionProductos.length);
  }
  return sum / count;
};

// --- HOOK POST-SAVE PARA ACTUALIZAR CALIFICACIÓN DEL REPARTIDOR ---
calificacionSchema.post('save', async function(doc) {
  try {
    // Importar modelos necesarios
    const Pedido = require('./pedido');
    const Repartidor = require('./Repartidor');
    
    // Buscar el pedido para obtener el repartidorId
    const pedido = await Pedido.findById(doc.pedidoId);
    if (!pedido || !pedido.repartidorId) {
      console.log('No se encontró pedido o repartidor asociado para actualizar calificación');
      return;
    }
    
    // Buscar el repartidor
    const repartidor = await Repartidor.findById(pedido.repartidorId);
    if (!repartidor) {
      console.log('No se encontró el repartidor para actualizar calificación');
      return;
    }
    
    // Buscar si ya existe una entrada en el historial para este pedido
    const entregaExistente = repartidor.historialEntregas.find(
      entrega => entrega.pedidoId && entrega.pedidoId.toString() === doc.pedidoId.toString()
    );
    
    if (entregaExistente) {
      // Actualizar la calificación existente
      entregaExistente.calificacionCliente = doc.puntuacionEntrega;
      entregaExistente.fechaEntrega = entregaExistente.fechaEntrega || doc.fechaCalificacion;
    } else {
      // Agregar nueva entrada al historial
      repartidor.historialEntregas.push({
        pedidoId: doc.pedidoId,
        fechaEntrega: doc.fechaCalificacion,
        calificacionCliente: doc.puntuacionEntrega
      });
    }
    
    // Recalcular calificación promedio
    const calificacionesValidas = repartidor.historialEntregas
      .filter(item => item.calificacionCliente !== undefined && item.calificacionCliente !== null)
      .map(item => item.calificacionCliente);
    
    if (calificacionesValidas.length > 0) {
      const sumaCalificaciones = calificacionesValidas.reduce((sum, current) => sum + current, 0);
      repartidor.calificacionPromedio = sumaCalificaciones / calificacionesValidas.length;
    } else {
      repartidor.calificacionPromedio = 0;
    }
    
    // Guardar el repartidor actualizado
    await repartidor.save();
    
    console.log(`Calificación del repartidor ${repartidor._id} actualizada. Nueva calificación promedio: ${repartidor.calificacionPromedio}`);
    
  } catch (error) {
    console.error('Error al actualizar calificación del repartidor:', error);
    // No lanzar el error para no afectar la creación de la calificación
  }
});

// Hook post-findOneAndUpdate para actualizar calificación cuando se modifica una calificación
calificacionSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return; // Si no hay documento, no hacer nada
  
  try {
    const Pedido = require('./pedido');
    const Repartidor = require('./Repartidor');
    
    const pedido = await Pedido.findById(doc.pedidoId);
    if (!pedido || !pedido.repartidorId) {
      return;
    }
    
    const repartidor = await Repartidor.findById(pedido.repartidorId);
    if (!repartidor) {
      return;
    }
    
    // Buscar la entrada en el historial
    const entregaExistente = repartidor.historialEntregas.find(
      entrega => entrega.pedidoId && entrega.pedidoId.toString() === doc.pedidoId.toString()
    );
    
    if (entregaExistente) {
      // Actualizar la calificación existente
      entregaExistente.calificacionCliente = doc.puntuacionEntrega;
    }
    
    // Recalcular calificación promedio
    const calificacionesValidas = repartidor.historialEntregas
      .filter(item => item.calificacionCliente !== undefined && item.calificacionCliente !== null)
      .map(item => item.calificacionCliente);
    
    if (calificacionesValidas.length > 0) {
      const sumaCalificaciones = calificacionesValidas.reduce((sum, current) => sum + current, 0);
      repartidor.calificacionPromedio = sumaCalificaciones / calificacionesValidas.length;
    } else {
      repartidor.calificacionPromedio = 0;
    }
    
    await repartidor.save();
    console.log(`Calificación del repartidor ${repartidor._id} actualizada después de modificar calificación. Nueva calificación promedio: ${repartidor.calificacionPromedio}`);
    
  } catch (error) {
    console.error('Error al actualizar calificación del repartidor después de modificar:', error);
  }
});

// Hook post-deleteOne para actualizar calificación cuando se elimina una calificación
calificacionSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    const Pedido = require('./pedido');
    const Repartidor = require('./Repartidor');
    
    const pedido = await Pedido.findById(doc.pedidoId);
    if (!pedido || !pedido.repartidorId) {
      return;
    }
    
    const repartidor = await Repartidor.findById(pedido.repartidorId);
    if (!repartidor) {
      return;
    }
    
    // Remover la entrada del historial
    repartidor.historialEntregas = repartidor.historialEntregas.filter(
      entrega => entrega.pedidoId && entrega.pedidoId.toString() !== doc.pedidoId.toString()
    );
    
    // Recalcular calificación promedio
    const calificacionesValidas = repartidor.historialEntregas
      .filter(item => item.calificacionCliente !== undefined && item.calificacionCliente !== null)
      .map(item => item.calificacionCliente);
    
    if (calificacionesValidas.length > 0) {
      const sumaCalificaciones = calificacionesValidas.reduce((sum, current) => sum + current, 0);
      repartidor.calificacionPromedio = sumaCalificaciones / calificacionesValidas.length;
    } else {
      repartidor.calificacionPromedio = 0;
    }
    
    await repartidor.save();
    console.log(`Calificación del repartidor ${repartidor._id} actualizada después de eliminar calificación. Nueva calificación promedio: ${repartidor.calificacionPromedio}`);
    
  } catch (error) {
    console.error('Error al actualizar calificación del repartidor después de eliminar:', error);
  }
});

const Calificacion = mongoose.model('Calificacion', calificacionSchema);

module.exports = Calificacion;