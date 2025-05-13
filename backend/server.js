// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const sequelize = require('./config/database');
const path = require('path');
const ventaRoutes = require('./routes/ventaRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const trabajoRoutes = require('./routes/trabajoRoutes');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Crear la aplicación Express
const app = express();

// Middleware
app.use(helmet()); // Seguridad HTTP
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/trabajos', trabajoRoutes);

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