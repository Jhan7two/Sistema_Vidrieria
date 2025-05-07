// backend/controllers/userController.js
const User = require('../models/user');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nombre_usuario', 'nombre_completo', 'rol', 'activo', 'ultimo_acceso', 'created_at', 'updated_at']
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// Obtener un usuario por ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'nombre_usuario', 'nombre_completo', 'rol', 'activo', 'ultimo_acceso', 'created_at', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

// Crear usuario
exports.createUser = async (req, res) => {
  try {
    const { nombre_usuario, password, nombre_completo, rol } = req.body;

    // Validar datos requeridos
    if (!nombre_usuario || !password || !nombre_completo || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({
      where: { nombre_usuario }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario ya está en uso'
      });
    }

    // Crear usuario
    const user = await User.create({
      nombre_usuario,
      password_hash: password, // Se hashea automáticamente en el hook beforeCreate
      nombre_completo,
      rol,
      activo: true
    });

    res.status(201).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { nombre_completo, rol, activo, password } = req.body;

    // Buscar usuario
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    
    if (nombre_completo) updateData.nombre_completo = nombre_completo;
    if (rol) updateData.rol = rol;
    if (typeof activo === 'boolean') updateData.activo = activo;
    if (password) updateData.password_hash = password;

    // Actualizar usuario
    await user.update(updateData);

    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
};

// Cambiar contraseña de usuario
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Buscar usuario
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isMatch = await user.validPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    user.password_hash = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};