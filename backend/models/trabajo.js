const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trabajo = sequelize.define('Trabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true
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
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_entrega: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('inicio', 'proceso', 'terminado'),
    defaultValue: 'inicio'
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
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  estado_pago: {
    type: DataTypes.ENUM('Pendiente', 'Parcial', 'Pagado'),
    defaultValue: 'Pendiente'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'trabajos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Trabajo;
