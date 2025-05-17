const Gasto = require('../models/gasto');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los gastos
exports.getGastos = async (req, res) => {
  try {
    const gastos = await Gasto.findAll({
      order: [['fecha', 'DESC']]
    });
    
    res.json({
      success: true,
      data: gastos
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener gastos',
      error: error.message 
    });
  }
};

// Crear nuevo gasto
exports.createGasto = async (req, res) => {
  try {
    const gasto = await Gasto.create(req.body);
    
    res.status(201).json({
      success: true,
      data: gasto
    });
  } catch (error) {
    console.error('Error al crear gasto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear gasto',
      error: error.message 
    });
  }
};

// Obtener gastos del mes actual
exports.getGastosDelMes = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const gastos = await Gasto.findAll({
      where: {
        fecha: {
          [Op.between]: [firstDay, lastDay]
        }
      },
      order: [['fecha', 'ASC']]
    });

    const totalMes = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    res.json({
      totalMes: Number.isNaN(totalMes) ? 0 : totalMes,
      gastos: Array.isArray(gastos) ? gastos.map(g => ({
        dia: g.fecha,
        monto: g.monto,
        descripcion: g.descripcion,
        categoria: g.categoria
      })) : []
    });
    console.log("Respuesta enviada desde getGastosDelMes:", {
      totalMes: Number.isNaN(totalMes) ? 0 : totalMes,
      gastos: Array.isArray(gastos) ? gastos.map(g => ({
        dia: g.fecha,
        monto: g.monto,
        descripcion: g.descripcion,
        categoria: g.categoria
      })) : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener gastos del mes', details: error.message });
  }
};

// Obtener estadísticas generales de gastos
exports.getDashboardStats = async (req, res) => {
  try {
    const totalGastos = await Gasto.count();
    const totalEgresos = await Gasto.sum('monto');
    res.json({
      totalGastos,
      totalEgresos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas de gastos', details: error.message });
  }
};

// Obtener gastos por categoría
exports.getGastosPorCategoria = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const gastos = await Gasto.findAll({
      where: {
        fecha: {
          [Op.between]: [firstDay, lastDay]
        }
      },
      attributes: ['categoria', [sequelize.fn('SUM', sequelize.col('monto')), 'total']],
      group: ['categoria'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener gastos por categoría', details: error.message });
  }
};
