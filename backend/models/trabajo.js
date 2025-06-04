const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./cliente');

const Trabajo = sequelize.define('Trabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  fecha_programada: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_finalizacion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_entrega: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'inicio',
    validate: {
      isIn: [['inicio', 'proceso', 'terminado']]
    }
  },
  direccion_trabajo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  monto_pagado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  saldo_pendiente: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.costo_total - this.monto_pagado;
    }
  },
  estado_pago: {
    type: DataTypes.STRING(20),
    defaultValue: 'Pendiente',
    validate: {
      isIn: [['Pendiente', 'Parcial', 'Pagado']]
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
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
  tableName: 'trabajos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['cliente_id']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['estado_pago']
    },
    {
      fields: ['fecha_programada']
    },
    {
      fields: ['tipo']
    }
  ]
});

// Definir la relación con Cliente
Trabajo.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  onDelete: 'SET NULL'
});

module.exports = Trabajo;
