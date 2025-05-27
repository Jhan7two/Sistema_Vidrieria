// backend/config/config.js
require('dotenv').config();

// Configuración para conectar a Render desde local
module.exports = {
  db: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necesario para Render
      }
    },
    logging: false
  }
};