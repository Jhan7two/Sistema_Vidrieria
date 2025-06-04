const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./user');

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
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['entrada', 'salida']]
    }
  },
  concepto: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  saldo_resultante: {
    type: DataTypes.DECIMAL(10, 2),
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
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['venta', 'gasto', 'cobro', 'ajuste']]
    }
  },
  forma_pago: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['efectivo', 'transferencia', 'otro']]
    }
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
  tableName: 'caja',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['fecha_hora']
    },
    {
      fields: ['usuario_id']
    },
    {
      fields: ['tipo_movimiento']
    },
    {
      fields: ['concepto']
    }
  ]
});

// Definir la relación con Usuario
Caja.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  onDelete: 'RESTRICT'
});

module.exports = Caja;
