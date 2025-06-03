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

    if (!token || token === 'none') {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, debe iniciar sesión',
        isAuthError: true
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sistema_vidrieria_secret_key');

      // Buscar el usuario
      const user = await User.findByPk(decoded.id);

      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          isAuthError: true
        });
      }

      // Actualizar último acceso
      await user.update({ ultimo_acceso: new Date() });

      // Verificar si el nombre de usuario coincide con el token
      if (user.nombre_usuario !== decoded.username) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          isAuthError: true
        });
      }

      // Agregar usuario a la solicitud
      req.user = user;
      // Agregar información decodificada del token para referencia
      req.decoded = decoded;
      
      // Calcular tiempo restante del token
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExp = decoded.exp;
      const timeRemaining = tokenExp - currentTime;
      
      // Solo renovar el token si está a menos de 4 horas de expirar
      if (timeRemaining < 14400) { // 4 horas en segundos
        // Renovar token para mantener la sesión activa
        const newToken = jwt.sign(
          { id: user.id, username: user.nombre_usuario, role: user.rol },
          process.env.JWT_SECRET || 'sistema_vidrieria_secret_key',
          { expiresIn: process.env.JWT_EXPIRE || '2d' }
        );
        
        // Configurar cookie con el nuevo token
        res.cookie('token', newToken, {
          expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
          ),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        isAuthError: true
      });
    }
  } catch (error) {
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
        message: 'No autorizado, debe iniciar sesión',
        isAuthError: true
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