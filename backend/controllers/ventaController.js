const Venta = require('../models/venta');
const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ajustarFechaBolivia, crearFechaBolivia, formatearFechaBolivia } = require('../utils/fechas');

// Obtener todas las ventas
exports.getVentas = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      order: [['fecha', 'DESC']],
      raw: true
    });
    
    // Formatear fechas para la respuesta
    const ventasFormateadas = ventas.map(venta => ({
      ...venta,
      fecha: formatearFechaBolivia(venta.fecha),
      monto: parseFloat(venta.monto)
    }));
    
    res.json({
      success: true,
      data: ventasFormateadas
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
    const firstDay = ajustarFechaBolivia(new Date(now.getFullYear(), now.getMonth(), 1));
    const lastDay = ajustarFechaBolivia(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [firstDay, lastDay]
        }
      },
      order: [['fecha', 'ASC']],
      raw: true
    });

    const totalMes = ventas.reduce((sum, v) => sum + parseFloat(v.monto || 0), 0);
    
    const ventasFormateadas = ventas.map(v => ({
      dia: formatearFechaBolivia(v.fecha),
      monto: parseFloat(v.monto || 0),
      descripcion: v.descripcion
    }));

    res.json({
      totalMes: parseFloat(totalMes.toFixed(2)),
      ventas: ventasFormateadas
    });
  } catch (error) {
    console.error('Error al obtener ventas del mes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener ventas del mes',
      error: error.message 
    });
  }
};

// Obtener estadísticas generales de ventas
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalVentas, totalIngresos] = await Promise.all([
      Venta.count(),
      Venta.sum('monto')
    ]);

    res.json({
      success: true,
      totalVentas,
      totalIngresos: parseFloat(totalIngresos || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas de ventas',
      error: error.message 
    });
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
    const montoNumerico = parseFloat(monto);
    if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }
    
    // Crear la venta con fecha ajustada a Bolivia
    const fechaVenta = fecha ? ajustarFechaBolivia(new Date(fecha)) : crearFechaBolivia();
    
    const venta = await Venta.create({
      fecha: fechaVenta,
      monto: montoNumerico.toFixed(2),
      tipo: tipo || 'venta completa',
      descripcion,
      cliente_id,
      trabajo_id,
      cobro_id
    }, { transaction });
    
    // Obtener el último saldo de caja
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']],
      transaction
    });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    const nuevoSaldo = parseFloat((saldoActual + montoNumerico).toFixed(2));
    
    // Obtener el ID del usuario que está realizando la operación
    const usuarioId = req.user ? req.user.id : 1;
    
    // Registrar el movimiento en la tabla caja
    await Caja.create({
      fecha_hora: fechaVenta,
      tipo_movimiento: 'entrada',
      concepto: tipo === 'adelanto' ? 'Adelanto' : 
                tipo === 'pago final' ? 'Pago final' : 
                'Venta completa',
      monto: montoNumerico.toFixed(2),
      saldo_resultante: nuevoSaldo,
      descripcion: descripcion || 'Venta registrada',
      referencia_id: venta.id,
      tipo_referencia: 'venta',
      forma_pago,
      usuario_id: usuarioId,
      observaciones: `Venta ID: ${venta.id}${trabajo_id ? `, Trabajo ID: ${trabajo_id}` : ''}`
    }, { transaction });
    
    await transaction.commit();
    
    // Formatear la respuesta
    const ventaFormateada = {
      ...venta.toJSON(),
      fecha: formatearFechaBolivia(venta.fecha),
      monto: parseFloat(venta.monto)
    };
    
    res.status(201).json({
      success: true,
      data: ventaFormateada
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al crear venta'
    });
  }
};

// Editar una venta
exports.updateVenta = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
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
    const montoNumerico = parseFloat(monto);
    if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }
    
    // Buscar la venta existente
    const ventaExistente = await Venta.findByPk(id, { transaction });
    if (!ventaExistente) {
      throw new Error('Venta no encontrada');
    }
    
    // Calcular la diferencia en el monto
    const diferenciaMonto = montoNumerico - parseFloat(ventaExistente.monto);
    
    // Actualizar la venta
    const fechaVenta = fecha ? ajustarFechaBolivia(new Date(fecha)) : ventaExistente.fecha;
    
    await ventaExistente.update({
      fecha: fechaVenta,
      monto: montoNumerico.toFixed(2),
      tipo: tipo || ventaExistente.tipo,
      descripcion,
      cliente_id,
      trabajo_id,
      cobro_id
    }, { transaction });
    
    // Actualizar el movimiento en caja
    const movimientoCaja = await Caja.findOne({
      where: {
        tipo_referencia: 'venta',
        referencia_id: id
      },
      transaction
    });
    
    if (movimientoCaja) {
      // Obtener el saldo anterior al movimiento
      const saldoAnterior = parseFloat(movimientoCaja.saldo_resultante) - parseFloat(movimientoCaja.monto);
      const nuevoSaldo = parseFloat((saldoAnterior + montoNumerico).toFixed(2));
      
      await movimientoCaja.update({
        fecha_hora: fechaVenta,
        monto: montoNumerico.toFixed(2),
        saldo_resultante: nuevoSaldo,
        descripcion: descripcion || 'Venta actualizada',
        forma_pago,
        observaciones: `Venta ID: ${id}${trabajo_id ? `, Trabajo ID: ${trabajo_id}` : ''}`
      }, { transaction });
      
      // Actualizar saldos de movimientos posteriores
      await Caja.update(
        {
          saldo_resultante: sequelize.literal(`saldo_resultante + ${diferenciaMonto}`)
        },
        {
          where: {
            id: { [Op.gt]: movimientoCaja.id }
          },
          transaction
        }
      );
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Venta actualizada exitosamente',
      data: {
        ...ventaExistente.toJSON(),
        fecha: formatearFechaBolivia(ventaExistente.fecha),
        monto: parseFloat(ventaExistente.monto)
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al actualizar venta'
    });
  }
};

// Eliminar una venta
exports.deleteVenta = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Buscar la venta
    const venta = await Venta.findByPk(id, { transaction });
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    
    // Buscar el movimiento en caja asociado
    const movimientoCaja = await Caja.findOne({
      where: {
        tipo_referencia: 'venta',
        referencia_id: id
      },
      transaction
    });
    
    if (movimientoCaja) {
      const montoVenta = parseFloat(venta.monto);
      
      // Actualizar saldos de movimientos posteriores
      await Caja.update(
        {
          saldo_resultante: sequelize.literal(`saldo_resultante - ${montoVenta}`)
        },
        {
          where: {
            id: { [Op.gt]: movimientoCaja.id }
          },
          transaction
        }
      );
      
      // Eliminar el movimiento en caja
      await movimientoCaja.destroy({ transaction });
    }
    
    // Eliminar la venta
    await venta.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al eliminar venta'
    });
  }
};