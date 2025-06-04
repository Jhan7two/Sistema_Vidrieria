const Cobro = require('../models/cobro');
const Trabajo = require('../models/trabajo');
const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { getBoliviaDateTime } = require('../utils/dateUtils');

// Obtener todos los cobros
exports.getAllCobros = async (req, res) => {
  try {
    const cobros = await Cobro.findAll({
      order: [['fecha', 'DESC']]
    });
    res.json(cobros);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cobros' });
  }
};

// Obtener cobro por ID
exports.getCobroById = async (req, res) => {
  try {
    const cobro = await Cobro.findByPk(req.params.id);
    if (!cobro) {
      return res.status(404).json({ message: 'Cobro no encontrado' });
    }
    res.json(cobro);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cobro' });
  }
};

// Obtener cobros por trabajo ID
exports.getCobrosByTrabajoId = async (req, res) => {
  try {
    const cobros = await Cobro.findAll({
      where: { trabajo_id: req.params.trabajoId },
      order: [['fecha', 'DESC']]
    });
    res.json(cobros);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cobros del trabajo' });
  }
};

// Crear un nuevo cobro
exports.createCobro = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { trabajo_id, monto, metodo_pago, forma_pago, observaciones, observacion } = req.body;
    
    if (!trabajo_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'ID de trabajo es requerido' });
    }
    
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Monto debe ser un número positivo' });
    }
    
    const trabajo = await Trabajo.findByPk(trabajo_id, { transaction });
    if (!trabajo) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Trabajo no encontrado' });
    }
    
    const montoNum = parseFloat(monto);
    const costoTotal = parseFloat(trabajo.costo_total);
    const montoPagado = parseFloat(trabajo.monto_pagado);
    const saldoPendiente = costoTotal - montoPagado;
    
    if (montoNum > saldoPendiente) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'El monto del cobro no puede exceder el saldo pendiente',
        saldoPendiente: saldoPendiente
      });
    }
    
    const usuarioId = req.user ? req.user.id : 1;
    const formaPagoFinal = forma_pago || metodo_pago || 'efectivo';
    const observacionesFinal = observaciones || observacion || '';
    
    const datosCobro = {
      trabajo_id,
      fecha: getBoliviaDateTime(),
      monto: montoNum,
      tipo_pago: formaPagoFinal,
      observacion: observacionesFinal
    };
    
    const cobro = await Cobro.create(datosCobro, { transaction });
    
    const nuevoMontoPagado = montoPagado + montoNum;
    let nuevoEstadoPago = 'Pendiente';
    
    if (nuevoMontoPagado >= costoTotal) {
      nuevoEstadoPago = 'Pagado';
    } else if (nuevoMontoPagado > 0) {
      nuevoEstadoPago = 'Parcial';
    }
    
    await trabajo.update({
      monto_pagado: nuevoMontoPagado,
      estado_pago: nuevoEstadoPago
    }, { transaction });
    
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']]
    }, { transaction });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    const nuevoSaldo = saldoActual + montoNum;
    
    await Caja.create({
      fecha_hora: getBoliviaDateTime(),
      tipo_movimiento: 'entrada',
      concepto: 'Cobro',
      monto: montoNum,
      saldo_resultante: nuevoSaldo,
      descripcion: `Cobro de trabajo #${trabajo.id} - ${trabajo.descripcion || 'Sin descripción'}`,
      referencia_id: cobro.id,
      tipo_referencia: 'cobro',
      forma_pago: formaPagoFinal,
      usuario_id: usuarioId,
      observaciones: observacionesFinal || 'Cobro registrado automáticamente'
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      id: cobro.id,
      trabajo_id: cobro.trabajo_id,
      fecha: cobro.fecha,
      monto: cobro.monto,
      tipo_pago: cobro.tipo_pago,
      observacion: cobro.observacion,
      message: 'Cobro registrado exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al crear cobro' });
  }
};

// Actualizar un cobro existente
exports.updateCobro = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { monto, tipo_pago, observaciones } = req.body;
    
    // Verificar que el cobro existe
    const cobro = await Cobro.findByPk(id, { transaction });
    if (!cobro) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cobro no encontrado' });
    }
    
    // Obtener el trabajo asociado
    const trabajo = await Trabajo.findByPk(cobro.trabajo_id, { transaction });
    if (!trabajo) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Trabajo asociado no encontrado' });
    }
    
    // Calcular la diferencia de monto
    const diferenciaMonto = parseFloat(monto) - parseFloat(cobro.monto);
    
    // Verificar que el nuevo monto no exceda el saldo pendiente + monto actual del cobro
    const nuevoMontoPagado = parseFloat(trabajo.monto_pagado) + diferenciaMonto;
    
    if (nuevoMontoPagado > trabajo.costo_total) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'El nuevo monto haría que el total pagado exceda el costo total del trabajo',
        montoMaximoPermitido: parseFloat(trabajo.costo_total) - parseFloat(trabajo.monto_pagado) + parseFloat(cobro.monto)
      });
    }
    
    // Actualizar el cobro
    await cobro.update({
      monto,
      tipo_pago,
      observaciones
    }, { transaction });
    
    // Actualizar el trabajo
    let nuevoEstadoPago = 'Pendiente';
    
    if (nuevoMontoPagado >= trabajo.costo_total) {
      nuevoEstadoPago = 'Pagado';
    } else if (nuevoMontoPagado > 0) {
      nuevoEstadoPago = 'Parcial';
    }
    
    await trabajo.update({
      monto_pagado: nuevoMontoPagado,
      estado_pago: nuevoEstadoPago
    }, { transaction });
    
    // Buscar el movimiento de caja asociado al cobro
    const movimientoCaja = await Caja.findOne({
      where: {
        referencia_id: id,
        tipo_referencia: 'cobro'
      }
    }, { transaction });
    
    if (movimientoCaja) {
      // Obtener el último saldo
      const ultimoMovimiento = await Caja.findOne({
        order: [['id', 'DESC']],
        where: {
          id: {
            [Op.ne]: movimientoCaja.id
          }
        }
      }, { transaction });
      
      const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
      const nuevoSaldo = saldoActual + parseFloat(monto);
      
      // Actualizar el movimiento en caja
      await movimientoCaja.update({
        monto,
        saldo_resultante: nuevoSaldo,
        forma_pago: tipo_pago,
        observaciones: observaciones || 'Cobro actualizado automáticamente'
      }, { transaction });
    } else {
      // Si no existe un movimiento de caja para este cobro, crearlo
      // Obtener el último saldo
      const ultimoMovimiento = await Caja.findOne({
        order: [['id', 'DESC']]
      }, { transaction });
      
      const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
      const nuevoSaldo = saldoActual + parseFloat(monto);
      
      // Crear el movimiento en caja
      await Caja.create({
        fecha_hora: getBoliviaDateTime(),
        tipo_movimiento: 'entrada',
        concepto: 'Cobro',
        monto,
        saldo_resultante: nuevoSaldo,
        descripcion: `Cobro de trabajo #${trabajo.id} - ${trabajo.descripcion || 'Sin descripción'}`,
        referencia_id: id,
        tipo_referencia: 'cobro',
        forma_pago: tipo_pago,
        usuario_id: req.user ? req.user.id : 1,
        observaciones: observaciones || 'Cobro registrado automáticamente'
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.json(cobro);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al actualizar cobro' });
  }
};

// Eliminar un cobro
exports.deleteCobro = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar que el cobro existe
    const cobro = await Cobro.findByPk(id, { transaction });
    if (!cobro) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cobro no encontrado' });
    }
    
    // Obtener el trabajo asociado
    const trabajo = await Trabajo.findByPk(cobro.trabajo_id, { transaction });
    if (!trabajo) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Trabajo asociado no encontrado' });
    }
    
    // Buscar el movimiento de caja asociado al cobro
    const movimientoCaja = await Caja.findOne({
      where: {
        referencia_id: id,
        tipo_referencia: 'cobro'
      }
    }, { transaction });
    
    // Si existe un movimiento de caja para este cobro, eliminarlo
    if (movimientoCaja) {
      await movimientoCaja.destroy({ transaction });
      
      // Actualizar los saldos de los movimientos posteriores
      const movimientosPosteriores = await Caja.findAll({
        where: {
          id: {
            [Op.gt]: movimientoCaja.id
          }
        },
        order: [['id', 'ASC']]
      }, { transaction });
      
      if (movimientosPosteriores.length > 0) {
        // Obtener el saldo anterior al movimiento eliminado
        const movimientoAnterior = await Caja.findOne({
          where: {
            id: {
              [Op.lt]: movimientoCaja.id
            }
          },
          order: [['id', 'DESC']]
        }, { transaction });
        
        let saldoActual = movimientoAnterior ? parseFloat(movimientoAnterior.saldo_resultante) : 0;
        
        // Actualizar cada movimiento posterior
        for (const movimiento of movimientosPosteriores) {
          if (movimiento.tipo_movimiento === 'entrada') {
            saldoActual += parseFloat(movimiento.monto);
          } else {
            saldoActual -= parseFloat(movimiento.monto);
          }
          
          await movimiento.update({
            saldo_resultante: saldoActual
          }, { transaction });
        }
      }
    }
    
    // Actualizar el trabajo restando el monto del cobro
    const nuevoMontoPagado = parseFloat(trabajo.monto_pagado) - parseFloat(cobro.monto);
    let nuevoEstadoPago = 'Pendiente';
    
    if (nuevoMontoPagado >= trabajo.costo_total) {
      nuevoEstadoPago = 'Pagado';
    } else if (nuevoMontoPagado > 0) {
      nuevoEstadoPago = 'Parcial';
    }
    
    await trabajo.update({
      monto_pagado: nuevoMontoPagado,
      estado_pago: nuevoEstadoPago
    }, { transaction });
    
    // Eliminar el cobro
    await cobro.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({ message: 'Cobro eliminado correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al eliminar cobro' });
  }
};

// Obtener cobros del día actual
exports.getCobrosDiarios = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    const cobros = await Cobro.findAll({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      order: [['fecha', 'DESC']]
    });
    
    const totalCobrado = cobros.reduce((sum, cobro) => sum + parseFloat(cobro.monto), 0);
    
    const cobrosConInfo = [];
    
    for (const cobro of cobros) {
      try {
        const trabajo = await Trabajo.findByPk(cobro.trabajo_id);
        
        let cliente = null;
        if (trabajo && trabajo.cliente_id) {
          const Cliente = require('../models/cliente');
          cliente = await Cliente.findByPk(trabajo.cliente_id);
        }
        
        cobrosConInfo.push({
          ...cobro.toJSON(),
          trabajo: trabajo ? {
            id: trabajo.id,
            descripcion: trabajo.descripcion
          } : null,
          cliente: cliente ? {
            id: cliente.id,
            nombre: cliente.nombre
          } : null
        });
      } catch (error) {
        cobrosConInfo.push(cobro.toJSON());
      }
    }
    
    res.json({
      cobros: cobrosConInfo,
      totalCobrado,
      fecha: fechaInicio
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cobros diarios' });
  }
};
