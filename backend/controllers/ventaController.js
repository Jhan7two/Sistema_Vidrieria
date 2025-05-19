const Venta = require('../models/venta');
const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todas las ventas
exports.getVentas = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      order: [['fecha', 'DESC']]
    });
    
    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener ventas',
      error: error.message 
    });
  }
};

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

// Crear nueva venta
exports.createVenta = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      fecha, 
      monto, 
      tipo, 
      descripcion, 
      cliente_id, 
      trabajo_id, 
      cobro_id,
      forma_pago = 'efectivo'
    } = req.body;
    
    // Validar datos
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'El monto debe ser un número positivo' 
      });
    }
    
    // Crear la venta
    const venta = await Venta.create({
      fecha: fecha || new Date(),
      monto,
      tipo: tipo || 'venta completa',
      descripcion,
      cliente_id,
      trabajo_id,
      cobro_id
    }, { transaction });
    
    // Obtener el último saldo de caja
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']]
    }, { transaction });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    const montoNumerico = parseFloat(monto);
    const nuevoSaldo = saldoActual + montoNumerico;
    
    // Obtener el ID del usuario que está realizando la operación
    const usuarioId = req.user ? req.user.id : 1; // Si no hay usuario en la sesión, usar ID 1 por defecto
    
    // Registrar el movimiento en la tabla caja
    await Caja.create({
      fecha_hora: new Date(),
      tipo_movimiento: 'entrada',
      concepto: tipo === 'adelanto' ? 'Adelanto' : 
                tipo === 'pago final' ? 'Pago final' : 
                'Venta completa',
      monto: montoNumerico,
      saldo_resultante: nuevoSaldo,
      descripcion: descripcion || 'Venta registrada',
      referencia_id: venta.id,
      tipo_referencia: 'venta',
      forma_pago: forma_pago,
      usuario_id: usuarioId,
      observaciones: `Venta ID: ${venta.id}${trabajo_id ? `, Trabajo ID: ${trabajo_id}` : ''}`
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: venta
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear venta',
      error: error.message 
    });
  }
};