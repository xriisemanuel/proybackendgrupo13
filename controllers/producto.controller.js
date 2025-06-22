const Producto = require('../models/producto'); // Modelo Mongoose
const productoController = {}; // Objeto para definir los métodos del controlador

// 1. Crear un nuevo producto
productoController.createProducto = async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();
    res.status(201).json({ mensaje: 'Producto creado exitosamente', producto: nuevoProducto });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear el producto', error: error.message });
  }
};

// 2. Obtener todos los productos
productoController.getProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ eliminado: false }); // filtrado por eliminacion lógica
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
  }
};

// 3. Obtener un producto por ID
productoController.getProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
  }
};

// 4. Obtener productos por categoría
productoController.getProductoCategoria = async (req, res) => {
  try {
    const productos = await Producto.find({ categoriaId: req.params.id, eliminado: false });
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos por categoría', error: error.message });
  }
};

// 5. Modificar producto
productoController.editProducto = async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    const productoActualizado = await Producto.findByIdAndUpdate(_id, data, { new: true });
    if (!productoActualizado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar' });
    }
    res.status(200).json({ mensaje: 'Producto actualizado correctamente', producto: productoActualizado });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar el producto', error: error.message });
  }
};

// 6. Eliminación lógica del producto
productoController.deleteProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, { eliminado: true }, { new: true });
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para eliminar' });
    }
    res.status(200).json({ mensaje: 'Producto eliminado lógicamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el producto', error: error.message });
  }
};

module.exports = productoController;