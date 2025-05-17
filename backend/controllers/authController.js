// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.nombre_usuario, role: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '8h' }
  );
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione nombre de usuario y contraseña'
      });
    }

    console.log(`Intento de inicio de sesión: ${username}`);

    // Buscar usuario
    const user = await User.findOne({
      where: {
        nombre_usuario: username,
        activo: true
      }
    });

    if (!user) {
      console.log(`Usuario no encontrado: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      console.log(`Contraseña incorrecta para: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date() });
    console.log(`Inicio de sesión exitoso: ${username}`);

    // Generar token
    const token = generateToken(user);

    // Opciones para cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 30 * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    // Enviar token como cookie
    res.cookie('token', token, cookieOptions);

    // Enviar respuesta
    res.status(200).json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
};

// Obtener usuario actual
exports.getMe = async (req, res) => {
  try {
    // req.user debería estar disponible gracias al middleware protect
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};