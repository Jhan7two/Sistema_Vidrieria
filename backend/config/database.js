const { Sequelize } = require('sequelize');
require('dotenv').config();

// Verificar variables de entorno necesarias
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno necesarias:');
  missingEnvVars.forEach(varName => console.log(`   - ${varName}`));
  process.exit(1);
}

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión establecida correctamente con Supabase');
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err);
    if (err.message.includes('SASL')) {
      console.log('💡 Sugerencia: Verifica que:');
      console.log('   1. El usuario sea "postgres" (sin el prefijo del proyecto)');
      console.log('   2. La contraseña no tenga caracteres especiales');
      console.log('   3. El host sea el correcto (db.xxx.supabase.co)');
      console.log('   4. El puerto sea 5432');
    }
  });

module.exports = sequelize;