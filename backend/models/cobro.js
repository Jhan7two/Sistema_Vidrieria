const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Trabajo = require('./trabajo');

const Cobro = sequelize.define('Cobro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trabajo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trabajos',
      key: 'id'
    }
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  observacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cobros',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['trabajo_id']
    },
    {
      fields: ['fecha']
    }
  ]
});

// Definir la relación con Trabajo
Cobro.belongsTo(Trabajo, {
  foreignKey: 'trabajo_id',
  onDelete: 'CASCADE'
});

module.exports = Cobro;
