// backend/scripts/initAdmin.js
require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/user');

// Función para crear el usuario administrador
async function createAdminUser() {
  try {
    // Sincronizar el modelo con la base de datos (no forzar recreación)
    await sequelize.sync({ alter: false });
    
    // Verificar si ya existe un usuario administrador
    const adminExists = await User.findOne({
      where: {
        rol: 'admin'
      }
    });

    if (adminExists) {
      console.log('Ya existe un usuario administrador en el sistema.');
      return;
    }

    // Crear el usuario administrador
    const adminUser = await User.create({
      nombre_usuario: 'admin',
      password_hash: 'admin123', // Se hasheará automáticamente por los hooks del modelo
      nombre_completo: 'Administrador Principal',
      rol: 'admin',
      activo: true
    });

    console.log('Usuario administrador creado exitosamente:', adminUser.toSafeObject());

  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

// Ejecutar la función
createAdminUser();

/*
Para ejecutar este script:
1. Asegúrate de que la base de datos esté configurada correctamente en .env
2. Ejecuta: node scripts/initAdmin.js

IMPORTANTE: Cambia la contraseña 'admin123' por una contraseña segura 
antes de usar este sistema en producción.
*/