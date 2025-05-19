// Script unificado para actualizar la estructura y datos de la tabla cobros
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const cobroController = require('../controllers/cobroController');

async function runMigration() {
  console.log('=== INICIO DE ACTUALIZACIÓN DE TABLA COBROS ===');
  
  try {
    // 1. Verificar si la columna ya existe
    console.log('Verificando si la columna cliente_id ya existe...');
    try {
      await sequelize.query(`SELECT cliente_id FROM cobros LIMIT 1`);
      console.log('La columna cliente_id ya existe en la tabla cobros.');
    } catch (error) {
      console.log('La columna cliente_id no existe, procediendo a crearla...');
      
      // 2. Leer el archivo SQL
      const sqlFilePath = path.join(__dirname, 'add_cliente_id_to_cobros.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      const statements = sqlContent
        .split(';')
        .filter(statement => statement.trim() !== '')
        .map(statement => statement.trim() + ';');
      
      // 3. Ejecutar cada sentencia SQL (alter table, add index, etc.)
      console.log('Ejecutando sentencias SQL para modificar la estructura de la tabla...');
      for (const statement of statements) {
        if (statement.trim() !== '') {
          try {
            console.log(`Ejecutando: ${statement.substring(0, 100)}...`);
            await sequelize.query(statement);
          } catch (error) {
            console.error(`Error al ejecutar: ${statement}`, error);
            // Continuar con la siguiente sentencia
          }
        }
      }
    }
    
    // 4. Ejecutar la función del controlador para actualizar los registros existentes
    console.log('Actualizando registros existentes con cliente_id usando el controlador...');
    
    // Como estamos llamando directamente a la función del controlador, no pasamos req ni res
    const resultado = await cobroController.updateCobrosCliente();
    
    console.log(`=== RESULTADO DE LA ACTUALIZACIÓN ===`);
    console.log(`- Total de cobros procesados: ${resultado.total}`);
    console.log(`- Cobros actualizados: ${resultado.actualizados}`);
    console.log(`- Cobros no actualizados: ${resultado.fallidos}`);
    
    console.log('=== FIN DE ACTUALIZACIÓN DE TABLA COBROS ===');
    console.log('La tabla cobros ha sido actualizada exitosamente con cliente_id');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Si este archivo se ejecuta directamente, correr la migración
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migración completada exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en la migración:', error);
      process.exit(1);
    });
} 