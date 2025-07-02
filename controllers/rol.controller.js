const Rol = require('../models/rol'); // Asegúrate de que la ruta a tu modelo Rol sea correcta (rol.model.js)

/**
 * @desc Obtener todos los roles
 * @route GET /api/rol
 * @access Admin
 */
exports.getRoles = async (req, res) => {
    try {
        const roles = await Rol.find({}); // Encuentra todos los roles
        res.status(200).json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener roles.', error: error.message });
    }
};

/**
 * @desc Crear un nuevo rol
 * @route POST /api/rol
 * @access Admin
 */
exports.createRol = async (req, res) => {
    try {
        const { nombre, estado } = req.body;

        // Validar campo 'nombre'
        if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre del rol es obligatorio y debe ser una cadena de texto válida.' });
        }

        // Convertir el nombre a minúsculas para la búsqueda (consistencia con el modelo)
        const nombreLowerCase = nombre.toLowerCase().trim();

        // Verificar si el rol ya existe por su nombre (insensible a mayúsculas/minúsculas)
        const rolExistente = await Rol.findOne({ nombre: nombreLowerCase });
        if (rolExistente) {
            return res.status(400).json({ mensaje: `El rol '${nombreLowerCase}' ya existe.` });
        }

        const nuevoRol = new Rol({
            nombre: nombreLowerCase, // Guardar en minúsculas
            estado: estado !== undefined ? estado : true, // Si estado no se provee, por defecto es true
            fechaCreacion: new Date()
        });

        await nuevoRol.save();
        res.status(201).json({ mensaje: 'Rol creado exitosamente', rol: nuevoRol });
    } catch (error) {
        console.error('Error al crear rol:', error);
        // Manejo de errores específicos de Mongoose si es necesario (ej. duplicados si unique no funcionó por alguna razón)
        if (error.code === 11000) { // Error de clave duplicada de MongoDB
            return res.status(400).json({ mensaje: `El nombre de rol ya existe: ${error.keyValue.nombre}.` });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al crear el rol.', error: error.message });
    }
};

/**
 * @desc Obtener un rol por ID
 * @route GET /api/rol/:id
 * @access Admin
 */
exports.getRolById = async (req, res) => {
    try {
        const rol = await Rol.findById(req.params.id);
        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }
        res.status(200).json(rol);
    } catch (error) {
        console.error('Error al obtener rol por ID:', error);
        // Si el ID no es un ObjectId válido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de rol inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el rol por ID.', error: error.message });
    }
};

/**
 * @desc Actualizar un rol por ID
 * @route PUT /api/rol/:id
 * @access Admin
 */
exports.updateRol = async (req, res) => {
    try {
        const { nombre, estado } = req.body;
        const rol = await Rol.findById(req.params.id);

        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        // Si se intenta cambiar el nombre, verificar que el nuevo nombre no exista ya en otro rol
        if (nombre && nombre.toLowerCase().trim() !== rol.nombre) {
            const nombreLowerCase = nombre.toLowerCase().trim();
            const rolExistente = await Rol.findOne({ nombre: nombreLowerCase });
            if (rolExistente && rolExistente._id.toString() !== req.params.id) {
                return res.status(400).json({ mensaje: `El nombre de rol '${nombreLowerCase}' ya está en uso por otro rol.` });
            }
            rol.nombre = nombreLowerCase; // Actualiza el nombre
        }

        // Actualizar el estado si se provee
        if (estado !== undefined) {
            rol.estado = estado;
        }

        await rol.save(); // Usar save() para que los hooks pre-save (si los hubiera) y validaciones de esquema se ejecuten
        res.status(200).json({ mensaje: 'Rol actualizado exitosamente', rol });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de rol inválido.' });
        }
        if (error.code === 11000) { // Error de clave duplicada de MongoDB
            return res.status(400).json({ mensaje: `El nombre de rol ya existe: ${error.keyValue.nombre}.` });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el rol.', error: error.message });
    }
};

/**
 * @desc Eliminar un rol por ID
 * @route DELETE /api/rol/:id
 * @access Admin
 */
exports.deleteRol = async (req, res) => {
    try {
        const rol = await Rol.findById(req.params.id);

        if (!rol) {
            return res.status(404).json({ mensaje: 'Rol no encontrado.' });
        }

        await Rol.deleteOne({ _id: req.params.id });
        res.status(200).json({ mensaje: 'Rol eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de rol inválido.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el rol.', error: error.message });
    }
};
