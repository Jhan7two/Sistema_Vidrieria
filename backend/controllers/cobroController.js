const Cobro = require('../models/cobro');
const Trabajo = require('../models/trabajo');
const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los cobros
exports.getAllCobros = async (req, res) => {
  try {
    const cobros = await Cobro.findAll({
      order: [['fecha', 'DESC']]
    });
    res.json(cobros);
  } catch (error) {
    console.error('Error al obtener cobros:', error);
    res.status(500).json({ message: 'Error al obtener cobros', error: error.message });
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
    console.error('Error al obtener cobro:', error);
    res.status(500).json({ message: 'Error al obtener cobro', error: error.message });
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
    console.error('Error al obtener cobros del trabajo:', error);
    res.status(500).json({ message: 'Error al obtener cobros del trabajo', error: error.message });
  }
};

// Crear un nuevo cobro
exports.createCobro = async (req, res) => {
  console.log('=== INICIO REGISTRO COBRO ===');
  console.log('Datos recibidos del frontend:', req.body);
  
  const transaction = await sequelize.transaction();
  
  try {
    // Adaptación para compatibilidad con frontend
    const { trabajo_id, monto, metodo_pago, forma_pago, observaciones, observacion } = req.body;
    
    console.log('Datos procesados:');
    console.log('- trabajo_id:', trabajo_id);
    console.log('- monto:', monto);
    console.log('- metodo_pago:', metodo_pago);
    console.log('- forma_pago:', forma_pago);
    console.log('- observaciones:', observaciones);
    console.log('- observacion:', observacion);
    
    // Verificar que el trabajo existe
    const trabajo = await Trabajo.findByPk(trabajo_id, { transaction });
    if (!trabajo) {
      console.log('ERROR: Trabajo no encontrado con ID:', trabajo_id);
      await transaction.rollback();
      return res.status(404).json({ message: 'Trabajo no encontrado' });
    }
    
    console.log('Trabajo encontrado:', {
      id: trabajo.id,
      descripcion: trabajo.descripcion,
      costo_total: trabajo.costo_total,
      monto_pagado: trabajo.monto_pagado,
      saldo_pendiente: trabajo.saldo_pendiente
    });
    
    // Verificar que el monto no exceda el saldo pendiente
    if (monto > trabajo.saldo_pendiente) {
      console.log('ERROR: El monto excede el saldo pendiente', {
        monto: monto,
        saldo_pendiente: trabajo.saldo_pendiente
      });
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'El monto del cobro no puede exceder el saldo pendiente',
        saldoPendiente: trabajo.saldo_pendiente
      });
    }
    
    // Obtener el ID del usuario que está realizando la operación
    const usuarioId = req.user ? req.user.id : 1; // Si no hay usuario en la sesión, usar ID 1 por defecto
    console.log('Usuario ID:', usuarioId);
    
    // Determinar la forma de pago final (para compatibilidad con diferentes nombres de campo)
    const formaPagoFinal = forma_pago || metodo_pago || 'efectivo';
    console.log('Forma de pago final:', formaPagoFinal);
    
    // Determinar las observaciones finales (para compatibilidad con diferentes nombres de campo)
    const observacionesFinal = observaciones || observacion || '';
    console.log('Observaciones finales:', observacionesFinal);
    
    // Crear el cobro - LOS TRIGGERS SE ENCARGARÁN DE ACTUALIZAR TRABAJO, VENTAS Y CAJA
    const datosCobro = {
      trabajo_id,
      fecha: new Date(),
      monto,
      metodo_pago: formaPagoFinal,
      observacion: observacionesFinal
    };
    
    console.log('Datos a insertar en la tabla cobros:', datosCobro);
    
    const cobro = await Cobro.create(datosCobro, { transaction });
    console.log('Cobro creado con ID:', cobro.id);
    
    await transaction.commit();
    console.log('Transacción completada exitosamente');
    console.log('=== FIN REGISTRO COBRO ===');
    
    // Devolver el cobro creado
    res.status(201).json({
      id: cobro.id,
      trabajo_id: cobro.trabajo_id,
      fecha: cobro.fecha,
      monto: cobro.monto,
      metodo_pago: cobro.metodo_pago,
      observacion: cobro.observacion,
      message: 'Cobro registrado exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('ERROR EN REGISTRO COBRO:', error);
    console.log('Detalles adicionales del error:');
    console.log('- Mensaje:', error.message);
    console.log('- Stack:', error.stack);
    if (error.errors) {
      console.log('- Errores de validación:', JSON.stringify(error.errors));
    }
    console.log('=== FIN ERROR REGISTRO COBRO ===');
    res.status(500).json({ message: 'Error al crear cobro', error: error.message });
  }
};

// Actualizar un cobro existente
exports.updateCobro = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { monto, metodo_pago, observaciones } = req.body;
    
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
      metodo_pago,
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
        forma_pago: metodo_pago,
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
        fecha_hora: new Date(),
        tipo_movimiento: 'entrada',
        concepto: 'Cobro de trabajo',
        monto,
        saldo_resultante: nuevoSaldo,
        descripcion: `Cobro de trabajo #${trabajo.id} - ${trabajo.descripcion || 'Sin descripción'}`,
        referencia_id: id,
        tipo_referencia: 'cobro',
        forma_pago: metodo_pago,
        usuario_id: req.user ? req.user.id : 1,
        observaciones: observaciones || 'Cobro registrado automáticamente'
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.json(cobro);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar cobro:', error);
    res.status(500).json({ message: 'Error al actualizar cobro', error: error.message });
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
    console.error('Error al eliminar cobro:', error);
    res.status(500).json({ message: 'Error al eliminar cobro', error: error.message });
  }
};

// Obtener cobros del día actual
exports.getCobrosDiarios = async (req, res) => {
  try {
    // Enfoque simple sin asociaciones para evitar errores
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    // Usar Sequelize sin asociaciones
    const cobros = await Cobro.findAll({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      order: [['createdAt', 'DESC']],
      raw: true // Obtener objetos planos en lugar de instancias de modelo
    });
    
    // Calcular el total cobrado del día
    let totalCobrado = 0;
    if (cobros && cobros.length > 0) {
      totalCobrado = cobros.reduce((total, cobro) => {
        const monto = parseFloat(cobro.monto || 0);
        return isNaN(monto) ? total : total + monto;
      }, 0);
    }
    
    // Enviar respuesta
    return res.json({
      cobros: cobros || [],
      totalCobrado,
      fecha: fechaInicio
    });
  } catch (error) {
    console.error('Error al obtener cobros diarios:', error);
    res.status(500).json({ message: 'Error al obtener cobros diarios', error: error.message });
  }
};
