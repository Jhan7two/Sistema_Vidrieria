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
  console.log('Datos recibidos del frontend:', JSON.stringify(req.body));
  
  const transaction = await sequelize.transaction();
  
  try {
    // Adaptación para compatibilidad con frontend
    const { trabajo_id, monto, metodo_pago, forma_pago, observaciones, observacion } = req.body;
    
    // Validar los datos recibidos
    if (!trabajo_id) {
      console.error('ERROR: trabajo_id es requerido');
      await transaction.rollback();
      return res.status(400).json({ message: 'ID de trabajo es requerido' });
    }
    
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      console.error('ERROR: monto inválido:', monto);
      await transaction.rollback();
      return res.status(400).json({ message: 'Monto debe ser un número positivo' });
    }
    
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
    
    // Convertir a números para comparación segura
    const montoNum = parseFloat(monto);
    const costoTotal = parseFloat(trabajo.costo_total);
    const montoPagado = parseFloat(trabajo.monto_pagado);
    const saldoPendiente = costoTotal - montoPagado;
    
    console.log('Trabajo encontrado:', {
      id: trabajo.id,
      descripcion: trabajo.descripcion,
      costo_total: costoTotal,
      monto_pagado: montoPagado,
      saldo_pendiente: saldoPendiente
    });
    
    // Verificar que el monto no exceda el saldo pendiente
    if (montoNum > saldoPendiente) {
      console.log('ERROR: El monto excede el saldo pendiente', {
        monto: montoNum,
        saldo_pendiente: saldoPendiente
      });
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'El monto del cobro no puede exceder el saldo pendiente',
        saldoPendiente: saldoPendiente
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
    
    // Crear el cobro
    const datosCobro = {
      trabajo_id,
      cliente_id: trabajo.cliente_id,
      fecha: new Date(),
      monto: montoNum,
      tipo_pago: formaPagoFinal,
      observacion: observacionesFinal
    };
    
    console.log('Datos a insertar en la tabla cobros:', datosCobro);
    
    const cobro = await Cobro.create(datosCobro, { transaction });
    console.log('Cobro creado con ID:', cobro.id);
    
    // Actualizar el trabajo con el nuevo monto pagado
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
    console.log('Trabajo actualizado con nuevo monto pagado:', nuevoMontoPagado);
    
    // Registrar el movimiento en caja
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']]
    }, { transaction });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    const nuevoSaldo = saldoActual + montoNum;
    
    await Caja.create({
      fecha_hora: new Date(),
      tipo_movimiento: 'entrada',
      concepto: 'Cobro de trabajo',
      monto: montoNum,
      saldo_resultante: nuevoSaldo,
      descripcion: `Cobro de trabajo #${trabajo.id} - ${trabajo.descripcion || 'Sin descripción'}`,
      referencia_id: cobro.id,
      tipo_referencia: 'cobro',
      forma_pago: formaPagoFinal,
      usuario_id: usuarioId,
      observaciones: observacionesFinal || 'Cobro registrado automáticamente'
    }, { transaction });
    
    console.log('Movimiento de caja registrado con saldo:', nuevoSaldo);
    
    await transaction.commit();
    console.log('Transacción completada exitosamente');
    console.log('=== FIN REGISTRO COBRO ===');
    
    // Devolver el cobro creado
    res.status(201).json({
      id: cobro.id,
      trabajo_id: cobro.trabajo_id,
      cliente_id: cobro.cliente_id,
      fecha: cobro.fecha,
      monto: cobro.monto,
      tipo_pago: cobro.tipo_pago,
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
    res.status(500).json({ message: 'Error al crear cobro: ' + error.message, error: true });
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
      observaciones,
      cliente_id: trabajo.cliente_id
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
        fecha_hora: new Date(),
        tipo_movimiento: 'entrada',
        concepto: 'Cobro de trabajo',
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
    console.log('=== INICIO CONSULTA COBROS DIARIOS ===');
    // Definir el rango de fechas para el día actual
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    console.log('Consultando cobros desde:', fechaInicio, 'hasta:', fechaFin);
    
    // Importar los modelos requeridos
    const Cliente = require('../models/cliente');
    const Trabajo = require('../models/trabajo');
    
    // Buscar los cobros del día
    try {
      const cobros = await Cobro.findAll({
        where: {
          fecha: {
            [Op.gte]: fechaInicio,
            [Op.lt]: fechaFin
          }
        },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre', 'apellido'],
            required: false
          },
          {
            model: Trabajo,
            as: 'trabajo',
            attributes: ['id', 'descripcion'],
            required: false
          }
        ],
        order: [['fecha', 'DESC']]
      });
      
      console.log('Cobros encontrados:', cobros.length);
      
      // Calcular el total cobrado
      const totalCobrado = cobros.reduce((sum, cobro) => sum + parseFloat(cobro.monto), 0);
      console.log('Total cobrado:', totalCobrado);
      
      console.log('=== FIN CONSULTA COBROS DIARIOS ===');
      
      // Devolver los resultados
      res.json({
        cobros,
        totalCobrado,
        fecha: fechaInicio
      });
    } catch (error) {
      console.error('Error en la consulta de cobros con relaciones:', error);
      
      // Si falla con las relaciones, intentar sin ellas
      console.log('Intentando consulta sin relaciones...');
      const cobrosSimple = await Cobro.findAll({
        where: {
          fecha: {
            [Op.gte]: fechaInicio,
            [Op.lt]: fechaFin
          }
        },
        order: [['fecha', 'DESC']]
      });
      
      const totalCobradoSimple = cobrosSimple.reduce((sum, cobro) => sum + parseFloat(cobro.monto), 0);
      
      console.log('=== FIN CONSULTA COBROS DIARIOS (MODO SIMPLE) ===');
      
      res.json({
        cobros: cobrosSimple,
        totalCobrado: totalCobradoSimple,
        fecha: fechaInicio
      });
    }
  } catch (error) {
    console.error('Error al obtener cobros diarios:', error);
    res.status(500).json({ message: 'Error al obtener cobros diarios', error: error.message });
  }
};

// Actualizar todos los cobros existentes sin cliente_id
exports.updateCobrosCliente = async (req, res) => {
  try {
    console.log('=== INICIO ACTUALIZACIÓN DE COBROS EXISTENTES ===');
    
    // Importar el modelo de Trabajo si no está disponible
    const Trabajo = require('../models/trabajo');
    
    // Obtener todos los cobros que no tienen cliente_id
    const cobros = await Cobro.findAll({
      where: {
        cliente_id: null
      }
    });
    
    console.log(`Se encontraron ${cobros.length} cobros sin cliente_id.`);
    
    // Para cada cobro, obtener el trabajo y actualizar el cliente_id
    let actualizados = 0;
    let fallidos = 0;
    
    for (const cobro of cobros) {
      try {
        // Obtener el trabajo asociado al cobro
        const trabajo = await Trabajo.findByPk(cobro.trabajo_id);
        
        if (trabajo && trabajo.cliente_id) {
          // Actualizar el cobro con el cliente_id del trabajo
          await cobro.update({
            cliente_id: trabajo.cliente_id
          });
          
          actualizados++;
          console.log(`✅ Cobro #${cobro.id} actualizado con cliente_id: ${trabajo.cliente_id}`);
        } else {
          console.log(`⚠️ No se pudo actualizar el cobro #${cobro.id}, trabajo no encontrado o sin cliente_id`);
          fallidos++;
        }
      } catch (error) {
        console.error(`Error al actualizar cobro #${cobro.id}:`, error);
        fallidos++;
      }
    }
    
    console.log(`=== FIN ACTUALIZACIÓN DE COBROS EXISTENTES ===`);
    console.log(`Total de cobros procesados: ${cobros.length}`);
    console.log(`Cobros actualizados: ${actualizados}`);
    console.log(`Cobros no actualizados: ${fallidos}`);
    
    // Si se llama como API, devolver el resultado
    if (res) {
      res.json({
        success: true,
        message: 'Actualización de cobros completada',
        stats: {
          total: cobros.length,
          actualizados,
          fallidos
        }
      });
    }
    
    return {
      total: cobros.length,
      actualizados,
      fallidos
    };
  } catch (error) {
    console.error('Error durante la actualización de cobros:', error);
    
    // Si se llama como API, devolver el error
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cobros con cliente_id',
        error: error.message
      });
    }
    
    throw error;
  }
};
