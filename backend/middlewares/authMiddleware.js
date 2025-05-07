// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware para verificar token JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verificar si hay token en headers de autorización
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // También buscar en cookies si está configurado
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, debe iniciar sesión'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar el usuario
      const user = await User.findByPk(decoded.id);

      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      // Actualizar último acceso
      await user.update({ ultimo_acceso: new Date() });

      // Agregar usuario a la solicitud
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, debe iniciar sesión'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Rol ${req.user.rol} no autorizado para acceder a este recurso`
      });
    }

    next();
  };
};