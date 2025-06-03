// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Generar token JWT
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }
  
  return jwt.sign(
    { id: user.id, username: user.nombre_usuario, role: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '2d' }
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

    // Buscar usuario
    const user = await User.findOne({
      where: {
        nombre_usuario: username,
        activo: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date() });

    // Generar token
    const token = generateToken(user);

    // Opciones para cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    // Enviar token como cookie
    res.cookie('token', token, cookieOptions);

    // También guardar información adicional para fácil acceso desde el cliente
    const userData = user.toSafeObject();
    
    // Enviar respuesta
    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
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
    
    // Renovar token para mantener la sesión activa
    const token = generateToken(user);
    
    // Configurar cookie con el nuevo token
    res.cookie('token', token, {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject(),
      token: token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};