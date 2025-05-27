const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./user');

const CierreCaja = sequelize.define('CierreCaja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  total_ventas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_gastos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  saldo_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cierres_caja',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['fecha']
    },
    {
      fields: ['fecha'],
      unique: true
    }
  ]
});

// Definir la relación con Usuario
CierreCaja.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  onDelete: 'SET NULL'
});

module.exports = CierreCaja; 