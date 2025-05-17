// Archivo para definir las asociaciones entre modelos
const Trabajo = require('./trabajo');
const Cliente = require('./cliente');
const Cobro = require('./cobro');
const Venta = require('./venta');
const Caja = require('./caja');
const Gasto = require('./gasto');

console.log('=== CONFIGURANDO ASOCIACIONES DE MODELOS ===');

// Relación Cliente-Trabajo (Un cliente puede tener muchos trabajos)
Cliente.hasMany(Trabajo, { 
  foreignKey: 'cliente_id',
  as: 'trabajos'
});
Trabajo.belongsTo(Cliente, { 
  foreignKey: 'cliente_id',
  as: 'clienteInfo'
});
console.log('✅ Cliente-Trabajo: Asociación configurada');

// Relación Trabajo-Cobro (Un trabajo puede tener muchos cobros)
Trabajo.hasMany(Cobro, { 
  foreignKey: 'trabajo_id',
  as: 'cobros'
});
Cobro.belongsTo(Trabajo, { 
  foreignKey: 'trabajo_id',
  as: 'trabajo'
});
console.log('✅ Trabajo-Cobro: Asociación configurada');

// Relación Cliente-Venta (Un cliente puede tener muchas ventas)
Cliente.hasMany(Venta, {
  foreignKey: 'cliente_id',
  as: 'ventas'
});
Venta.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente'
});
console.log('✅ Cliente-Venta: Asociación configurada');

// Relación Trabajo-Venta (Un trabajo puede tener muchas ventas)
Trabajo.hasMany(Venta, {
  foreignKey: 'trabajo_id',
  as: 'ventas'
});
Venta.belongsTo(Trabajo, {
  foreignKey: 'trabajo_id',
  as: 'trabajo'
});
console.log('✅ Trabajo-Venta: Asociación configurada');

// Relación Cobro-Venta (Un cobro puede tener una venta)
Cobro.hasOne(Venta, {
  foreignKey: 'cobro_id',
  as: 'venta'
});
Venta.belongsTo(Cobro, {
  foreignKey: 'cobro_id',
  as: 'cobro'
});
console.log('✅ Cobro-Venta: Asociación configurada');

// Asegúrate de que este archivo se importe en algún lugar para que se ejecuten las asociaciones
console.log('=== ASOCIACIONES DE MODELOS CONFIGURADAS ===');

module.exports = {
  Cliente,
  Trabajo,
  Cobro,
  Venta,
  Caja,
  Gasto
};
