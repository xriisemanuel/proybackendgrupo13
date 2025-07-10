const Combo = require('../models/Combo');
const Producto = require('../models/producto'); // Necesario para validar productos en el combo

// --- Funciones CRUD y de Negocio ---

/**
 * @route POST /api/combos
 * @desc Crea un nuevo combo
 * @access Admin
 */
exports.crearCombo = async (req, res) => {
    try {
        const { nombre, descripcion, productosIds, precioCombo, descuento, imagen, activo } = req.body;

        // 1. Validar que se hayan proporcionado productosIds y que sea un array
        if (!productosIds || !Array.isArray(productosIds) || productosIds.length === 0) {
            return res.status(400).json({ mensaje: 'El combo debe contener al menos un producto.' });
        }

        // 2. Verificar que todos los productos existan y estén disponibles
        const productosExistentes = await Producto.find({ _id: { $in: productosIds } });
        if (productosExistentes.length !== productosIds.length) {
            return res.status(404).json({ mensaje: 'Uno o más productos no fueron encontrados o no son válidos.' });
        }
        const productosNoDisponibles = productosExistentes.filter(p => !p.disponible || p.stock <= 0);
        if (productosNoDisponibles.length > 0) {
            return res.status(400).json({
                mensaje: 'Algunos productos en el combo no están disponibles o no tienen stock.',
                productosNoDisponibles: productosNoDisponibles.map(p => ({ id: p._id, nombre: p.nombre }))
            });
        }

        // 3. Calcular el precio base del combo (suma de productos individuales)
        const precioBaseProductos = productosExistentes.reduce((sum, prod) => sum + prod.precio, 0);
        
        // 4. Validar y procesar el descuento
        let descuentoFinal = descuento || 0;
        if (descuentoFinal < 0) descuentoFinal = 0;
        if (descuentoFinal > 100) descuentoFinal = 100;

        // 5. Calcular el precio final con descuento
        let precioFinalCalculado = precioBaseProductos * (1 - (descuentoFinal / 100));
        
        // Si el descuento es 100%, el precio final debe ser 0
        if (descuentoFinal === 100) {
            precioFinalCalculado = 0;
        }

        // 6. Crear el combo con todos los campos calculados
        const nuevoCombo = new Combo({
            nombre,
            descripcion,
            productosIds,
            precioCombo: precioBaseProductos, // Precio base (suma de productos)
            descuento: descuentoFinal, // Porcentaje de descuento
            precioFinal: precioFinalCalculado, // Precio final después del descuento
            imagen,
            activo: activo !== undefined ? activo : true, // Por defecto activo
        });

        await nuevoCombo.save();

        res.status(201).json({
            mensaje: 'Combo creado exitosamente.',
            combo: nuevoCombo
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'Ya existe un combo con este nombre.', detalle: error.message });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensaje: 'Error de validación al crear el combo.', detalle: error.message });
        }
        console.error('Error al crear el combo:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al crear el combo.',
            error: error.message
        });
    }
};

/**
 * @route GET /api/combos
 * @desc Lista todos los combos disponibles
 * @access Público
 */
exports.listarCombos = async (req, res) => {
    try {
        const query = {};
        if (req.query.activo !== undefined) {
            query.activo = req.query.activo === 'true';
        }

        const combos = await Combo.find(query).sort({ nombre: 1 });
        res.status(200).json(combos);
    } catch (error) {
        console.error('Error al listar combos:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al listar combos.',
            error: error.message
        });
    }
};

/**
 * @route GET /api/combos/:id
 * @desc Obtiene un combo por su ID, incluyendo detalles de sus productos
 * @access Público
 */
exports.obtenerComboByID = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) {
            return res.status(404).json({ mensaje: 'Combo no encontrado.' });
        }

        // Obtener los detalles completos de los productos
        const productosEnCombo = await combo.obtenerDetallesProductos();

        res.status(200).json({
            combo: combo,
            productos: productosEnCombo
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de combo inválido.', detalle: error.message });
        }
        console.error('Error al obtener combo por ID:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al obtener combo.',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/combos/:id
 * @desc Actualiza un combo existente
 * @access Admin
 */
exports.actualizarCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Si se actualizan los productos, validar que existan y estén disponibles
        if (updateData.productosIds) {
            if (!Array.isArray(updateData.productosIds) || updateData.productosIds.length === 0) {
                return res.status(400).json({ mensaje: 'El combo debe contener al menos un producto.' });
            }
            const productosExistentes = await Producto.find({ _id: { $in: updateData.productosIds } });
            if (productosExistentes.length !== updateData.productosIds.length) {
                return res.status(404).json({ mensaje: 'Uno o más productos no fueron encontrados o no son válidos.' });
            }
            const productosNoDisponibles = productosExistentes.filter(p => !p.disponible || p.stock <= 0);
            if (productosNoDisponibles.length > 0) {
                return res.status(400).json({
                    mensaje: 'Algunos productos en la actualización del combo no están disponibles o no tienen stock.',
                    productosNoDisponibles: productosNoDisponibles.map(p => ({ id: p._id, nombre: p.nombre }))
                });
            }

            // Recalcular precio base si se cambiaron los productos
            const precioBaseProductos = productosExistentes.reduce((sum, prod) => sum + prod.precio, 0);
            updateData.precioCombo = precioBaseProductos;
        }

        // Si se actualiza el descuento, recalcular el precio final
        if (updateData.descuento !== undefined) {
            let descuentoFinal = updateData.descuento;
            if (descuentoFinal < 0) descuentoFinal = 0;
            if (descuentoFinal > 100) descuentoFinal = 100;
            
            updateData.descuento = descuentoFinal;
            
            // Calcular nuevo precio final
            const precioCombo = updateData.precioCombo || (await Combo.findById(id)).precioCombo;
            let precioFinalCalculado = precioCombo * (1 - (descuentoFinal / 100));
            
            // Si el descuento es 100%, el precio final debe ser 0
            if (descuentoFinal === 100) {
                precioFinalCalculado = 0;
            }
            
            updateData.precioFinal = precioFinalCalculado;
        }

        const comboActualizado = await Combo.findByIdAndUpdate(id, updateData, {
            new: true, // Devuelve el documento actualizado
            runValidators: true // Corre las validaciones definidas en el esquema
        });

        if (!comboActualizado) {
            return res.status(404).json({ mensaje: 'Combo no encontrado para actualizar.' });
        }
        res.status(200).json({
            mensaje: 'Combo actualizado exitosamente.',
            combo: comboActualizado
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'Ya existe otro combo con el nombre proporcionado.', detalle: error.message });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensaje: 'Error de validación al actualizar el combo.', detalle: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de combo inválido.', detalle: error.message });
        }
        console.error('Error al actualizar el combo:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al actualizar el combo.',
            error: error.message
        });
    }
};

/**
 * @route DELETE /api/combos/:id
 * @desc Elimina un combo por su ID
 * @access Admin
 */
exports.eliminarCombo = async (req, res) => {
    try {
        const comboEliminado = await Combo.findByIdAndDelete(req.params.id);
        if (!comboEliminado) {
            return res.status(404).json({ mensaje: 'Combo no encontrado para eliminar.' });
        }
        res.status(200).json({
            mensaje: 'Combo eliminado exitosamente.'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de combo inválido.', detalle: error.message });
        }
        console.error('Error al eliminar el combo:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al eliminar el combo.',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/combos/:id/activar
 * @desc Activa un combo
 * @access Admin
 */
exports.activarCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await Combo.findById(id);
        if (!combo) {
            return res.status(404).json({ mensaje: 'Combo no encontrado.' });
        }
        if (combo.activo) {
            return res.status(200).json({ mensaje: 'El combo ya está activo.', combo });
        }
        combo.activo = true;
        await combo.save();
        res.status(200).json({ mensaje: 'Combo activado exitosamente.', combo });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de combo inválido.', detalle: error.message });
        }
        console.error('Error al activar combo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al activar combo.', error: error.message });
    }
};

/**
 * @route PATCH /api/combos/:id/desactivar
 * @desc Desactiva un combo
 * @access Admin
 */
exports.desactivarCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await Combo.findById(id);
        if (!combo) {
            return res.status(404).json({ mensaje: 'Combo no encontrado.' });
        }
        if (!combo.activo) {
            return res.status(200).json({ mensaje: 'El combo ya está inactivo.', combo });
        }
        combo.activo = false;
        await combo.save();
        res.status(200).json({ mensaje: 'Combo desactivado exitosamente.', combo });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de combo inválido.', detalle: error.message });
        }
        console.error('Error al desactivar combo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al desactivar combo.', error: error.message });
    }
};