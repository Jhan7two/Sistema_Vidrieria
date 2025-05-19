const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Caja = sequelize.define('Caja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('entrada', 'salida'),
    allowNull: false
  },
  concepto: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  saldo_resultante: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo_referencia: {
    type: DataTypes.ENUM('venta', 'gasto', 'cobro', 'ajuste'),
    allowNull: false
  },
  forma_pago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'otro'),
    allowNull: false,
    defaultValue: 'efectivo'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'caja',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Caja;
