const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Esquema para el Subdocumento DetalleProducto ---
// No se exporta como un modelo independiente.
const detalleProductoSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto', // Referencia al modelo Producto
  },
  comboId: {
    type: Schema.Types.ObjectId,
    ref: 'Combo', // Referencia al modelo Combo
  },
  nombreProducto: { // Para mantener un registro si el nombre del producto cambia
    type: String,
    required: true,
    trim: true,
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1,
  },
  precioUnitario: { // Almacena el precio unitario al momento de la compra
    type: Number,
    required: true,
    min: 0,
  },
  // Agregamos el campo 'subtotal' directamente aquí para cada ítem
  subtotal: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  _id: false, // Los subdocumentos no necesitan su propio _id por defecto
  timestamps: false, // No necesitamos timestamps para cada detalle de producto
});

// Puedes añadir un hook pre-save directamente al subdocumento si lo prefieres,
// pero a menudo es más eficiente manejar todos los cálculos en el hook principal del Pedido
// para evitar múltiples iteraciones o lógica duplicada.
// Por simplicidad, lo haremos en el pre-save del Pedido principal.


// --- Esquema del Modelo Principal Pedido ---
const pedidoSchema = new Schema({
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente', // Referencia al modelo de Cliente
    required: true,
  },
  fechaPedido: {
    type: Date,
    default: Date.now, // Fecha y hora actual por defecto
    required: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'en_preparacion', 'en_envio', 'entregado', 'cancelado'],
    default: 'pendiente',
    required: true,
  },
  direccionEntrega: {
    type: String,
    required: true,
    trim: true,
  },
  metodoPago: {
    type: String,
    required: true,
    enum: ['Tarjeta de Crédito', 'Tarjeta de Débito', 'Efectivo', 'Transferencia', 'Mercado Pago', 'Otro'],
  },
  subtotal: { // Subtotal de todos los productos del pedido antes de descuentos/envío
    type: Number,
    default: 0,
    min: 0,
  },
  descuentos: {
    type: Number,
    default: 0,
    min: 0,
  },
  costoEnvio: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: { // Monto final a pagar
    type: Number,
    default: 0,
    min: 0,
  },
  // Aquí usamos el esquema de subdocumento definido anteriormente
  detalleProductos: [detalleProductoSchema], 
  
  fechaEstimadaEntrega: {
    type: Date,
    default: null,
  },
  repartidorId: {
    type: Schema.Types.ObjectId,
    ref: 'Repartidor', // Referencia al modelo Repartidor
    default: null,
  },
  observaciones: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt
});

// --- Métodos de instancia o estáticos para el modelo ---

// Método de instancia para calcular el total del pedido
// Este método ahora también calcula los subtotales individuales de los productos.
pedidoSchema.methods.calcularTotal = function() {
  let subtotalGeneral = 0;
  
  // Verificar que detalleProductos existe y es un array
  if (this.detalleProductos && Array.isArray(this.detalleProductos)) {
    this.detalleProductos.forEach(item => {
      // Verificar que el item tiene los campos necesarios
      if (item.cantidad && item.precioUnitario) {
        // Calcula y asigna el subtotal para cada ítem de producto
        item.subtotal = item.cantidad * item.precioUnitario; 
        subtotalGeneral += item.subtotal;
      }
    });
  }
  
  this.subtotal = subtotalGeneral; // Asigna el subtotal general del pedido
  this.total = this.subtotal - (this.descuentos || 0) + (this.costoEnvio || 0);
  if (this.total < 0) this.total = 0; // Asegurarse que el total no sea negativo
  return this.total;
};

// Hook pre-validate para asegurar que los cálculos se hagan antes de la validación
pedidoSchema.pre('validate', function(next) {
  if (this.isNew && this.detalleProductos && this.detalleProductos.length > 0) {
    this.calcularTotal();
  }
  next();
});

// Hook pre-save para asegurar que los subtotales y el total general se calculen antes de guardar
pedidoSchema.pre('save', function(next) {
  // Siempre recalcula para documentos nuevos o cuando los campos relevantes han sido modificados
  if (this.isNew || this.isModified('detalleProductos') || this.isModified('descuentos') || this.isModified('costoEnvio')) {
    this.calcularTotal();
  }
  next();
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;