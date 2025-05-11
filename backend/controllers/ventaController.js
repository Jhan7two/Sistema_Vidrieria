const Venta = require('../models/venta');
const { Op } = require('sequelize');

// Obtener ventas del mes actual
exports.getVentasDelMes = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [firstDay, lastDay]
        }
      },
      order: [['fecha', 'ASC']]
    });

    const totalMes = ventas.reduce((sum, v) => sum + parseFloat(v.monto), 0);
    res.json({
      totalMes: Number.isNaN(totalMes) ? 0 : totalMes,
      ventas: Array.isArray(ventas) ? ventas.map(v => ({
        dia: v.fecha,
        monto: v.monto,
        descripcion: v.descripcion
      })) : []
    });
    console.log("Respuesta enviada desde getVentasDelMes:", {
      totalMes: Number.isNaN(totalMes) ? 0 : totalMes,
      ventas: Array.isArray(ventas) ? ventas.map(v => ({
        dia: v.fecha,
        monto: v.monto,
        descripcion: v.descripcion
      })) : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas del mes', details: error.message });
  }
};

// Obtener estadísticas generales de ventas
exports.getDashboardStats = async (req, res) => {
  try {
    const totalVentas = await Venta.count();
    const totalIngresos = await Venta.sum('monto');
    res.json({
      totalVentas,
      totalIngresos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas de ventas', details: error.message });
  }
};