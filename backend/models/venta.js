const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./cliente');
const Trabajo = require('./trabajo');
const Cobro = require('./cobro');

const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['adelanto', 'pago final', 'venta completa']]
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  trabajo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'trabajos',
      key: 'id'
    }
  },
  cobro_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: 'cobros',
      key: 'id'
    }
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
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['fecha']
    },
    {
      fields: ['cliente_id']
    }
  ]
});

// Definir las relaciones
Venta.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  onDelete: 'SET NULL'
});

Venta.belongsTo(Trabajo, {
  foreignKey: 'trabajo_id',
  onDelete: 'SET NULL'
});

Venta.belongsTo(Cobro, {
  foreignKey: 'cobro_id',
  onDelete: 'SET NULL'
});

module.exports = Venta;