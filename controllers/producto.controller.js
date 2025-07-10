// proyecto/backend/controllers/product.controller.js
const Producto = require('../models/producto'); // <<<< Usando tu modelo 'producto.model'
const Categoria = require('../models/categoria.model'); // Para verificar si la categoría existe

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    const products = await Producto.find()
      .select('nombre descripcion precio categoriaId stock disponible popularidad imagen')
      .populate('categoriaId', 'nombre descripcion');

    res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener productos.' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Producto.findById(req.params.id).populate('categoriaId', 'nombre descripcion');
    if (!product) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    const productoConImagen = {
      _id: product._id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      categoriaId: product.categoriaId,
      stock: product.stock,
      disponible: product.disponible,
      popularidad: product.popularidad,
      imagen: product.imagen || null
    };

    res.status(200).json(productoConImagen);
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener el producto.' });
  }
};


// Crear un nuevo producto
exports.createProduct = async (req, res) => {
  try {
    // Los campos deben coincidir con tu modelo
    const { nombre, descripcion, precio, categoriaId, imagen, disponible, stock, popularidad } = req.body;

    // Validación básica basada en tus 'required' del modelo
    if (!nombre || !precio || !categoriaId || stock === undefined) {
      return res.status(400).json({ mensaje: 'Nombre, precio, categoría y stock son campos requeridos.' });
    }

    // Verificar si la categoría existe
    const categoriaExistente = await Categoria.findById(categoriaId);
    if (!categoriaExistente) {
      return res.status(404).json({ mensaje: 'La categoría especificada no existe.' });
    }

    const newProduct = new Producto({
      nombre,
      descripcion,
      precio,
      categoriaId, // <<<< Usamos categoriaId
      imagen,
      disponible: disponible !== undefined ? disponible : (stock > 0), // El hook pre-save también lo manejará
      stock,
      popularidad: popularidad !== undefined ? popularidad : 0
    });

    await newProduct.save();
    // Popula la categoría para la respuesta, como en los GET
    const productWithCategory = await Producto.findById(newProduct._id).populate('categoriaId', 'nombre descripcion');
    res.status(201).json({ mensaje: 'Producto creado exitosamente.', product: productWithCategory });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.name === 'ValidationError') { // Errores de validación de Mongoose (minlength, maxlength, unique, etc.)
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ mensaje: 'Errores de validación:', errores: messages });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) { // Error de unicidad (nombre)
      return res.status(409).json({ mensaje: 'Ya existe un producto con ese nombre.', error: error.message });
    }
    if (error.name === 'CastError' && error.path === 'categoriaId') {
      return res.status(400).json({ mensaje: 'ID de categoría inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al crear el producto.', error: error.message });
  }
};

// Actualizar un producto existente
exports.updateProduct = async (req, res) => {
  try {
    // Los campos a actualizar deben coincidir con tu modelo
    const { nombre, descripcion, precio, categoriaId, imagen, disponible, stock, popularidad } = req.body;
    const updateFields = {};

    if (nombre !== undefined) updateFields.nombre = nombre;
    if (descripcion !== undefined) updateFields.descripcion = descripcion;
    if (precio !== undefined) updateFields.precio = precio;
    if (imagen !== undefined) updateFields.imagen = imagen;
    if (stock !== undefined) updateFields.stock = stock;
    if (popularidad !== undefined) updateFields.popularidad = popularidad;
    // Si 'disponible' se envía explícitamente, úsalo. Si no, el hook 'pre-findOneAndUpdate' lo ajustará por stock.
    if (disponible !== undefined) updateFields.disponible = disponible;

    // Verificar si la categoría existe si se proporciona
    if (categoriaId) {
      const categoriaExistente = await Categoria.findById(categoriaId);
      if (!categoriaExistente) {
        return res.status(404).json({ mensaje: 'La categoría especificada no existe.' });
      }
      updateFields.categoriaId = categoriaId; // <<<< Usamos categoriaId
    }

    const updatedProduct = await Producto.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true } // new: true devuelve el documento actualizado; runValidators: para que ejecute las validaciones del schema
    ).populate('categoriaId', 'nombre descripcion'); // <<<< Popula categoriaId

    if (!updatedProduct) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Producto actualizado exitosamente.', product: updatedProduct });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ mensaje: 'Errores de validación:', errores: messages });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe un producto con ese nombre.', error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto o categoría inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el producto.', error: error.message });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Producto.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Producto eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'ID de producto inválido.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el producto.', error: error.message });
  }
};
exports.activarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { disponible: true },
      { new: true }
    );
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Producto activado correctamente.', producto });
  } catch (error) {
    console.error('Error al activar producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

exports.desactivarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { disponible: false },
      { new: true }
    );
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Producto desactivado correctamente.', producto });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
