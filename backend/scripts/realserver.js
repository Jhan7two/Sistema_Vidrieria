// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const sequelize = require('./config/database');
const path = require('path');

// Importar el archivo de asociaciones
require('./models/associations');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const trabajoRoutes = require('./routes/trabajoRoutes');
const cobroRoutes = require('./routes/cobroRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

// Crear la aplicación Express
const app = express();

// Middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' } 
})); // Seguridad HTTP con ajuste para recursos

// Configuración de CORS mejorada
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

// Middleware para verificar cookies y tokens en cada solicitud
app.use((req, res, next) => {
  // Log para depuración
  if (req.cookies && req.cookies.token) {
    console.log(`Cookie de sesión presente para: ${req.originalUrl}`);
  }
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/trabajos', trabajoRoutes);
app.use('/api/cobros', cobroRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/clientes', clienteRoutes);

// Ruta para verificar si el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del sistema de vidriería funcionando correctamente',
    timestamp: new Date()
  });
});

// Manejo de errores para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({
    success: false, 
    message: 'Recurso no encontrado'
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const startServer = async () => {
  try {
    // Sincronizar modelos con la base de datos (no forzar recreación)
    await sequelize.sync({ alter: false });
    console.log('Base de datos sincronizada');

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();