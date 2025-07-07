const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ventaSchema = new Schema({
  pedidoId: {
    type: Schema.Types.ObjectId,
    ref: 'Pedido', // Referencia al modelo de Pedido
    required: true,
    unique: true, // Una venta por cada pedido
  },
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente', // Referencia al modelo de Cliente
    required: true,
  },
  fechaVenta: {
    type: Date,
    default: Date.now, // Fecha y hora actual por defecto
    required: true,
  },
  montoTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  metodoPago: {
    type: String,
    required: true,
    enum: ['Tarjeta de Crédito', 'Tarjeta de Débito', 'Efectivo', 'Transferencia', 'Mercado Pago', 'Otro'], // Métodos de pago permitidos
  },
  numeroFactura: {
    type: String,
    unique: true, // Cada factura debe tener un número único
    sparse: true, // Permite que haya documentos sin este campo, pero si existe, debe ser único
    trim: true,
    default: null, // Puede generarse después
  },
});

// --- Métodos de instancia o estáticos para el modelo (si necesitas lógica específica) ---

// Método para generar un número de factura (ejemplo simple)
ventaSchema.methods.generarNumeroFactura = async function() {
  if (!this.numeroFactura) {
    const prefix = 'INV'; // Prefijo para facturas
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 caracteres alfanuméricos
    this.numeroFactura = `${prefix}-${datePart}-${randomPart}`;
    await this.save(); // Guarda el número de factura generado en la base de datos
    return this.numeroFactura;
  }
  return this.numeroFactura;
};

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;


// const mongoose = require('mongoose');

// const VentaSchema = new mongoose.Schema({
//   pedidoId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Pedido',
//     required: true
//   },
//   clienteId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Cliente',
//     required: true
//   },
//   fechaVenta: {
//     type: Date,
//     default: Date.now
//   },
//   montoTotal: {
//     type: Number,
//     required: true
//   },
//   metodoPago: {
//   type: String,
//   enum: ['EFECTIVO', 'TARJETA', 'QR'],
//   required: true
// },

//   numeroFactura: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   estadoPago: {
//     type: String,
//     enum: ['pendiente', 'pagado'],
//     default: 'pendiente'
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Venta', VentaSchema);
