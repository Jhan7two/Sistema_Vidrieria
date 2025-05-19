const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tipo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  observacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'cobros',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Cobro;
