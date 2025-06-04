const postgres = require('postgres')
require('dotenv').config()

// Verificar variables de entorno necesarias
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno necesarias:');
  missingEnvVars.forEach(varName => console.log(`   - ${varName}`));
  process.exit(1);
}

// Construir la URL de conexión
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Configuración del cliente postgres
const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10, // número máximo de conexiones en el pool
  idle_timeout: 20, // tiempo máximo de inactividad en segundos
  connect_timeout: 10, // tiempo máximo de conexión en segundos
})

module.exports = sql