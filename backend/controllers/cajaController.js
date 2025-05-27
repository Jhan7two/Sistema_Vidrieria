const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ajustarFechaBolivia, crearFechaBolivia, formatearFechaBolivia } = require('../utils/fechas');
const CierreCaja = require('../models/cierreCaja');

// Constantes para validaciones
const tiposMovimientoValidos = ['entrada', 'salida'];
const tiposReferenciaValidos = ['venta', 'gasto', 'cobro', 'ajuste'];
const formasPagoValidas = ['efectivo', 'transferencia', 'otro'];

// Obtener el saldo actual de la caja
exports.getSaldoActual = async (req, res) => {
  try {
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']],
      raw: true
    });
    
    const saldo = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    
    res.json({
      saldo,
      fecha: formatearFechaBolivia(crearFechaBolivia())
    });
  } catch (error) {
    console.error('Error al obtener saldo de caja:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener saldo de caja', 
      error: error.message 
    });
  }
};

// Obtener los movimientos de caja del día actual
exports.getMovimientosDiarios = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaInicio = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    const fechaFin = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    
    const movimientos = await Caja.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      order: [['fecha_hora', 'DESC']],
      include: [
        {
          model: require('../models/user'),
          as: 'usuario',
          attributes: ['nombre_completo']
        }
      ]
    });
    
    // Formatear fechas y montos para mostrar
    const movimientosFormateados = movimientos.map(mov => {
      // Asegurarnos de que los montos sean números
      const monto = parseFloat(mov.monto);
      const saldo = parseFloat(mov.saldo_resultante);
      
      return {
        ...mov.toJSON(),
        fecha_hora: formatearFechaBolivia(mov.fecha_hora),
        monto: isNaN(monto) ? '0.00' : monto.toFixed(2),
        saldo_resultante: isNaN(saldo) ? '0.00' : saldo.toFixed(2)
      };
    });
    
    res.json({
      movimientos: movimientosFormateados
    });
  } catch (error) {
    console.error('Error al obtener movimientos diarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener movimientos diarios', 
      error: error.message 
    });
  }
};

// Registrar un nuevo movimiento en la caja
exports.registrarMovimiento = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      tipo_movimiento, 
      concepto, 
      monto, 
      descripcion, 
      forma_pago,
      observaciones 
    } = req.body;
    
    // Validaciones
    if (!tiposMovimientoValidos.includes(tipo_movimiento)) {
      throw new Error('Tipo de movimiento inválido');
    }
    
    if (!formasPagoValidas.includes(forma_pago)) {
      throw new Error('Forma de pago inválida');
    }
    
    if (!concepto || !monto) {
      throw new Error('Concepto y monto son obligatorios');
    }
    
    // Formatear montos
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }
    
    // Obtener último saldo
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']],
      transaction
    });
    
    // Asegurarnos de que el saldo actual sea un número
    let saldoActual = 0;
    if (ultimoMovimiento) {
      const saldoStr = ultimoMovimiento.saldo_resultante.toString();
      saldoActual = parseFloat(saldoStr);
      if (isNaN(saldoActual)) {
        console.error('Error: saldo_resultante no es un número válido:', ultimoMovimiento.saldo_resultante);
        saldoActual = 0;
      }
    }
    
    // Calcular nuevo saldo
    let nuevoSaldo = 0;
    if (tipo_movimiento === 'entrada') {
      nuevoSaldo = saldoActual + montoNumerico;
    } else {
      nuevoSaldo = saldoActual - montoNumerico;
    }
    
    // Asegurarnos de que el nuevo saldo sea un número válido
    if (isNaN(nuevoSaldo)) {
      throw new Error('Error al calcular el nuevo saldo');
    }
    
    // Verificar que el usuario existe
    const usuarioId = req.user ? req.user.id : 1;
    const usuarioExiste = await sequelize.query(
      'SELECT id FROM usuarios WHERE id = $1',
      {
        bind: [usuarioId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );
    
    if (!usuarioExiste.length) {
      throw new Error('Usuario no encontrado');
    }
    
    // Crear movimiento con fecha ajustada a Bolivia
    const fecha_hora = crearFechaBolivia();
    
    // Crear el movimiento con valores numéricos
    const movimiento = await Caja.create({
      fecha_hora,
      tipo_movimiento,
      concepto,
      monto: montoNumerico,
      saldo_resultante: nuevoSaldo,
      descripcion: descripcion || null,
      referencia_id: null,
      tipo_referencia: 'ajuste',
      forma_pago,
      usuario_id: usuarioId,
      observaciones: observaciones || null
    }, { transaction });
    
    // Si es entrada, crear venta
    if (tipo_movimiento === 'entrada') {
      const venta = await sequelize.query(
        'INSERT INTO ventas (fecha, monto, tipo, descripcion, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        {
          bind: [
            fecha_hora,
            montoNumerico,
            'venta completa',
            descripcion || 'Venta registrada desde caja',
            fecha_hora
          ],
          type: sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      
      if (venta && venta[0] && venta[0].id) {
        await movimiento.update({
          referencia_id: venta[0].id,
          tipo_referencia: 'venta'
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Formatear fecha para la respuesta
    const movimientoFormateado = {
      ...movimiento.toJSON(),
      fecha_hora: formatearFechaBolivia(movimiento.fecha_hora)
    };
    
    return res.status(201).json({ 
      success: true,
      movimiento: movimientoFormateado
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar movimiento:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Realizar cierre de caja
exports.cerrarCaja = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });
  
  try {
    const hoy = new Date();
    const fechaInicio = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    const fechaFin = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    
    // Verificar cierre existente
    const cierreExistente = await CierreCaja.findOne({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      transaction
    });
    
    if (cierreExistente) {
      throw new Error('Ya existe un cierre de caja para el día de hoy');
    }
    
    // Obtener movimientos del día
    const movimientos = await Caja.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      transaction
    });
    
    // Calcular totales
    const totalEntradas = movimientos
      .filter(m => m.tipo_movimiento === 'entrada')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const totalSalidas = movimientos
      .filter(m => m.tipo_movimiento === 'salida')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    // Obtener saldo actual
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']],
      transaction
    });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    
    // Crear cierre con fecha ajustada a Bolivia
    const fecha_cierre = crearFechaBolivia();
    const cierre = await CierreCaja.create({
      fecha: fecha_cierre,
      total_ventas: totalEntradas,
      total_gastos: totalSalidas,
      saldo_final: saldoActual,
      observaciones: req.body.observaciones || 'Cierre de caja diario',
      usuario_id: req.user ? req.user.id : 1
    }, { transaction });
    
    await transaction.commit();
    
    // Formatear fecha para la respuesta
    const cierreFormateado = {
      ...cierre.toJSON(),
      fecha: formatearFechaBolivia(cierre.fecha)
    };
    
    res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      cierre: cierreFormateado,
      total_entradas: totalEntradas,
      total_salidas: totalSalidas,
      saldo_final: saldoActual
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Obtener historial de cierres
exports.getHistorialCierres = async (req, res) => {
  try {
    let { page = 1, limit = 10, desde, hasta } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    
    const offset = (page - 1) * limit;
    const whereCondition = {};
    
    if (desde || hasta) {
      whereCondition.fecha = {};
      
      if (desde) {
        whereCondition.fecha[Op.gte] = ajustarFechaBolivia(new Date(desde));
      }
      
      if (hasta) {
        const fechaHasta = ajustarFechaBolivia(new Date(hasta));
        fechaHasta.setHours(23, 59, 59, 999);
        whereCondition.fecha[Op.lte] = fechaHasta;
      }
    }
    
    const { count, rows: cierres } = await CierreCaja.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: require('../models/user'),
          as: 'usuario',
          attributes: ['id', 'nombre_completo', 'nombre_usuario'],
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      limit,
      offset,
      subQuery: false
    });
    
    // Formatear fechas para mostrar
    const cierresFormateados = cierres.map(cierre => ({
      ...cierre.toJSON(),
      fecha: formatearFechaBolivia(cierre.fecha)
    }));
    
    const totalEntradas = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.total_ventas || 0), 0);
    const totalSalidas = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.total_gastos || 0), 0);
    const totalSaldo = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.saldo_final || 0), 0);
    
    res.status(200).json({
      success: true,
      cierres: cierresFormateados,
      meta: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        totalEntradas,
        totalSalidas,
        totalSaldo
      }
    });
  } catch (error) {
    console.error('Error al obtener historial de cierres:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener historial de cierres', 
      error: error.message 
    });
  }
};

// Verificar cierre diario
exports.verificarCierreDiario = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaInicio = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    const fechaFin = ajustarFechaBolivia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    
    const cierreExistente = await CierreCaja.findOne({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      }
    });
    
    res.json({
      success: true,
      existeCierre: !!cierreExistente,
      cierre: cierreExistente ? {
        id: cierreExistente.id,
        fecha: formatearFechaBolivia(cierreExistente.fecha),
        total_entradas: cierreExistente.total_ventas,
        total_salidas: cierreExistente.total_gastos,
        saldo_final: cierreExistente.saldo_final
      } : null
    });
  } catch (error) {
    console.error('Error al verificar cierre diario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar cierre diario', 
      error: error.message 
    });
  }
};
