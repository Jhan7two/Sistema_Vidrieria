const { Sequelize } = require('sequelize');
require('dotenv').config();
const config = require('./config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: console.log, // Habilitado para debug
    dialectOptions: config.db.dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función de prueba mejorada
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL en Render establecida correctamente');
    
    // Mostrar información de la conexión
    console.log(`📊 Base de datos: ${config.db.database}`);
    console.log(`🏠 Host: ${config.db.host}`);
    console.log(`👤 Usuario: ${config.db.username}`);
    
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:');
    console.error('Detalles del error:', error.message);
    
    // Sugerencias basadas en el tipo de error
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Sugerencia: Verifica que el host de Render sea correcto');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Sugerencia: Verifica usuario y contraseña de Render');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Sugerencia: Verifica el nombre de la base de datos en Render');
    } else if (error.message.includes('SSL/TLS')) {
      console.log('💡 Sugerencia: La configuración SSL es necesaria para Render');
    }
  }
};

// Ejecutar prueba de conexión
testConnection();

module.exports = sequelize;