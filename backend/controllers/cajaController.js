const Caja = require('../models/caja');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const CierreCaja = require('../models/cierreCaja');

// Obtener el saldo actual de la caja
exports.getSaldoActual = async (req, res) => {
  try {
    // Obtener el último movimiento de caja para conocer el saldo actual
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']]
    });
    
    const saldo = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    
    res.json({
      saldo,
       fecha: new Date() // Puedes mantener esto si lo necesitas en otro lado
    });
  } catch (error) {
    console.error('Error al obtener saldo de caja:', error);
    res.status(500).json({ message: 'Error al obtener saldo de caja', error: error.message });
  }
};

// Obtener los movimientos de caja del día actual
exports.getMovimientosDiarios = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    const movimientos = await Caja.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      order: [['fecha_hora', 'DESC']]
    });
    
    // El frontend espera un objeto { movimientos: [] }
    // Los cálculos adicionales pueden ser útiles, pero no son estrictamente lo que el frontend actual busca en `cargarDatos()`
    // const totalEntradas = movimientos
    //   .filter(m => m.tipo_movimiento === 'entrada')
    //   .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    // 
    // const totalSalidas = movimientos
    //   .filter(m => m.tipo_movimiento === 'salida')
    //   .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    res.json({
      movimientos, // Esto es lo que el frontend usa en cargarDatos()
      // totalEntradas,
      // totalSalidas,
      // saldoDia: totalEntradas - totalSalidas,
      // fecha: fechaInicio
    });
  } catch (error) {
    console.error('Error al obtener movimientos diarios:', error);
    res.status(500).json({ message: 'Error al obtener movimientos diarios', error: error.message });
  }
};

// Registrar un nuevo movimiento en la caja
exports.registrarMovimiento = async (req, res) => {
  // Logs de depuración mejorados
  console.log('=== INICIO REGISTRO MOVIMIENTO CAJA ===');
  console.log('URL completa:', req.originalUrl);
  console.log('Método HTTP:', req.method);
  console.log('Cabeceras:', JSON.stringify(req.headers, null, 2));
  console.log('Datos recibidos del frontend (body):', JSON.stringify(req.body, null, 2));
  console.log('Parámetros de URL:', JSON.stringify(req.params, null, 2));
  console.log('Parámetros de consulta:', JSON.stringify(req.query, null, 2));
  
  // Verificar que el body no sea undefined o null
  if (!req.body) {
    console.error('ERROR: req.body es undefined o null');
    return res.status(400).json({
      success: false,
      message: 'No se recibieron datos en el cuerpo de la petición'
    });
  }
  
  // Crear transacción
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    // Destructuring con valores predeterminados seguros
    const { 
      tipo_movimiento = null, 
      concepto = null, 
      monto = null, 
      descripcion = '', 
      forma_pago = null, 
      observaciones = '' 
    } = req.body;
    
    console.log('Datos procesados después de destructuring:');
    console.log('- tipo_movimiento:', tipo_movimiento);
    console.log('- concepto:', concepto);
    console.log('- monto:', monto);
    console.log('- forma_pago:', forma_pago);
    console.log('- descripcion:', descripcion);
    console.log('- observaciones:', observaciones);
    
    // Validar datos con mensajes específicos para cada validación
    if (!tipo_movimiento) {
      console.log('ERROR: Falta tipo_movimiento');
      await transaction.rollback();
      return res.status(400).json({ message: 'El tipo de movimiento es obligatorio.' });
    }
    
    if (!concepto) {
      console.log('ERROR: Falta concepto');
      await transaction.rollback();
      return res.status(400).json({ message: 'El concepto es obligatorio.' });
    }
    
    if (monto === null || monto === undefined) {
      console.log('ERROR: Falta monto');
      await transaction.rollback();
      return res.status(400).json({ message: 'El monto es obligatorio.' });
    }
    
    if (!forma_pago) {
      console.log('ERROR: Falta forma_pago');
      await transaction.rollback();
      return res.status(400).json({ message: 'La forma de pago es obligatoria.' });
    }
    
    // Validar tipo_movimiento
    if (tipo_movimiento !== 'entrada' && tipo_movimiento !== 'salida') {
      console.log('ERROR: tipo_movimiento inválido:', tipo_movimiento);
      await transaction.rollback();
      return res.status(400).json({ message: 'El tipo de movimiento debe ser "entrada" o "salida".' });
    }
    
    // Validar forma_pago
    if (!['efectivo', 'transferencia', 'otro'].includes(forma_pago)) {
      console.log('ERROR: forma_pago inválida:', forma_pago);
      await transaction.rollback();
      return res.status(400).json({ message: 'La forma de pago debe ser "efectivo", "transferencia" o "otro".' });
    }
    
    // Convertir monto a número
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      console.log('ERROR: El monto debe ser un número positivo');
      await transaction.rollback();
      return res.status(400).json({ message: 'El monto debe ser un número positivo.'});
    }
    
    // Obtener el último saldo con manejo de errores mejorado
    console.log('Obteniendo último movimiento...');
    try {
      const ultimoMovimiento = await Caja.findOne({
        order: [['id', 'DESC']],
        transaction
      });
      
      console.log('Último movimiento encontrado:', ultimoMovimiento ? 'SÍ' : 'NO');
      if (ultimoMovimiento) {
        console.log('ID último movimiento:', ultimoMovimiento.id);
        console.log('Saldo último movimiento:', ultimoMovimiento.saldo_resultante);
      }
      
      const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
      console.log('Saldo actual (parseado):', saldoActual);
      
      // Calcular nuevo saldo
      const nuevoSaldo = tipo_movimiento === 'entrada' 
        ? saldoActual + montoNumerico
        : saldoActual - montoNumerico;
      console.log('Nuevo saldo calculado:', nuevoSaldo);
      
      // Usar ID de usuario predeterminado (1)
      const usuarioId = req.user ? req.user.id : 1;
      console.log('ID de usuario utilizado:', usuarioId);
      
      // Crear el movimiento - Validamos cada campo
      const datosMovimiento = {
        fecha_hora: new Date(),
        tipo_movimiento,
        concepto,
        monto: montoNumerico,
        saldo_resultante: nuevoSaldo,
        descripcion: descripcion || null,
        referencia_id: null,
        tipo_referencia: 'ajuste',
        forma_pago,
        usuario_id: usuarioId,
        observaciones: observaciones || `Movimiento manual de caja: ${concepto}`
      };
      
      console.log('Datos a insertar en la tabla caja:', JSON.stringify(datosMovimiento, null, 2));
      
      // Verificar la existencia de la tabla y el usuario antes de insertar
      try {
        // Verificar que la tabla existe
        await sequelize.query('SHOW TABLES LIKE "caja"', { transaction });
        
        // Verificar que el usuario existe
        const verificarUsuario = await sequelize.query(
          'SELECT * FROM usuarios WHERE id = ?', 
          { 
            replacements: [usuarioId],
            type: sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        
        if (verificarUsuario.length === 0) {
          console.error('ERROR: El usuario_id no existe en la tabla usuarios');
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'El usuario especificado no existe en la base de datos.',
            usuario_id: usuarioId
          });
        }
        
        console.log('Verificaciones previas pasadas. Creando movimiento...');
        
        // Crear el movimiento
        const movimiento = await Caja.create(datosMovimiento, { transaction });
        console.log('Movimiento creado con ID:', movimiento.id);
        
        // Consultar si el trigger creó una venta o gasto correspondiente
        let tipoReferencia, referenciaId;
        
        if (tipo_movimiento === 'entrada') {
          // Buscar la venta más reciente que coincida con el monto y fecha
          const venta = await sequelize.query(
            'SELECT id FROM ventas WHERE monto = ? AND fecha = DATE(?) ORDER BY id DESC LIMIT 1',
            {
              replacements: [montoNumerico, datosMovimiento.fecha_hora],
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          if (venta && venta.length > 0) {
            tipoReferencia = 'venta';
            referenciaId = venta[0].id;
            console.log(`Encontrada venta relacionada con ID: ${referenciaId}`);
          }
        } else {
          // Buscar el gasto más reciente que coincida con el monto y fecha
          const gasto = await sequelize.query(
            'SELECT id FROM gastos WHERE monto = ? AND fecha = DATE(?) ORDER BY id DESC LIMIT 1',
            {
              replacements: [montoNumerico, datosMovimiento.fecha_hora],
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          if (gasto && gasto.length > 0) {
            tipoReferencia = 'gasto';
            referenciaId = gasto[0].id;
            console.log(`Encontrado gasto relacionado con ID: ${referenciaId}`);
          }
        }
        
        // Si se encontró una referencia, actualizar el movimiento de caja
        if (referenciaId) {
          await sequelize.query(
            'UPDATE caja SET referencia_id = ?, tipo_referencia = ? WHERE id = ?',
            {
              replacements: [referenciaId, tipoReferencia, movimiento.id],
              transaction
            }
          );
          console.log(`Movimiento de caja actualizado con referencia: ${tipoReferencia} ID: ${referenciaId}`);
          
          // Actualizar el objeto de movimiento para la respuesta
          movimiento.referencia_id = referenciaId;
          movimiento.tipo_referencia = tipoReferencia;
        }
        
        await transaction.commit();
        console.log('Transacción completada exitosamente');
        console.log('=== FIN REGISTRO MOVIMIENTO CAJA ===');
        
        // Devolver respuesta exitosa
        return res.status(201).json({ 
          success: true,
          message: 'Movimiento registrado exitosamente', 
          movimiento 
        });
        
      } catch (dbError) {
        await transaction.rollback();
        console.error('ERROR EN OPERACIÓN DE BASE DE DATOS:', dbError);
        console.log('=== FIN ERROR REGISTRO MOVIMIENTO CAJA ===');
        return res.status(500).json({ 
          success: false,
          message: 'Error en operación de base de datos', 
          error: dbError.message 
        });
      }
      
    } catch (saldoError) {
      await transaction.rollback();
      console.error('ERROR AL OBTENER SALDO:', saldoError);
      console.log('=== FIN ERROR REGISTRO MOVIMIENTO CAJA ===');
      return res.status(500).json({ 
        success: false,
        message: 'Error al obtener saldo actual', 
        error: saldoError.message 
      });
    }
    
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('ERROR GENERAL EN REGISTRO MOVIMIENTO CAJA:', error);
    console.log('Detalles adicionales del error:');
    console.log('- Mensaje:', error.message);
    console.log('- Stack:', error.stack);
    if (error.errors) {
      console.log('- Errores de validación:', JSON.stringify(error.errors, null, 2));
    }
    console.log('=== FIN ERROR REGISTRO MOVIMIENTO CAJA ===');
    
    return res.status(500).json({ 
      success: false,
      message: 'Error al registrar movimiento de caja', 
      error: error.message 
    });
  }
};

// Realizar cierre de caja
exports.cerrarCaja = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    // Verificar si ya existe un cierre para el día actual
    const cierreExistente = await CierreCaja.findOne({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      transaction
    });
    
    if (cierreExistente) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Ya existe un cierre de caja para el día de hoy',
        cierre_id: cierreExistente.id
      });
    }
    
    // Usar directamente el ID de usuario de la sesión o ID predeterminado
    const usuarioId = req.user ? req.user.id : 1;
    console.log('ID de usuario para cierre de caja:', usuarioId);
    
    const { observaciones } = req.body;
    
    // Obtener los movimientos del día
    const movimientosDia = await Caja.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      transaction
    });
    
    // Calcular totales
    const totalEntradas = movimientosDia
      .filter(m => m.tipo_movimiento === 'entrada')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);
      
    const totalSalidas = movimientosDia
      .filter(m => m.tipo_movimiento === 'salida')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const saldoFinal = totalEntradas - totalSalidas;
    
    // Obtener el saldo actual
    const ultimoMovimiento = await Caja.findOne({
      order: [['id', 'DESC']],
      transaction
    });
    
    const saldoActual = ultimoMovimiento ? parseFloat(ultimoMovimiento.saldo_resultante) : 0;
    
    // Guardar el cierre en la tabla cierres_caja con los nombres de columnas correctos
    const cierreCaja = await CierreCaja.create({
      fecha: fechaInicio,
      total_ventas: totalEntradas, // Cambiado de total_entradas a total_ventas
      total_gastos: totalSalidas, // Cambiado de total_salidas a total_gastos
      saldo_final: saldoFinal,
      usuario_id: usuarioId,
      observaciones: observaciones || 'Cierre de caja diario'
    }, { transaction });
    
    console.log('Cierre de caja guardado con ID:', cierreCaja.id);
    
    await transaction.commit();
    
    // Devolver respuesta con los datos del cierre
    res.status(200).json({
      message: 'Caja cerrada correctamente',
      fecha: fechaInicio,
      total_entradas: totalEntradas, // Mantenemos estos nombres en la respuesta para no romper el frontend
      total_salidas: totalSalidas,
      saldo_final: saldoFinal,
      saldo_actual: saldoActual,
      cierre_id: cierreCaja.id
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al intentar cerrar caja:', error);
    res.status(500).json({ message: 'Error al cerrar caja', error: error.message });
  }
};

// Obtener historial de cierres de caja
exports.getHistorialCierres = async (req, res) => {
  try {
    // Parámetros de paginación y filtros
    let { page = 1, limit = 10, desde, hasta } = req.query;
    
    // Convertir explícitamente page y limit a números enteros
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      
      // Validar que sean números válidos
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
    } catch (err) {
      console.error('Error al parsear parámetros de paginación:', err);
      page = 1;
      limit = 10;
    }
    
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    const whereCondition = {};
    
    if (desde || hasta) {
      whereCondition.fecha = {};
      
      if (desde) {
        const fechaDesde = new Date(desde);
        whereCondition.fecha[Op.gte] = fechaDesde;
      }
      
      if (hasta) {
        const fechaHasta = new Date(hasta);
        // Ajustar al final del día
        fechaHasta.setHours(23, 59, 59, 999);
        whereCondition.fecha[Op.lte] = fechaHasta;
      }
    }
    
    // Obtener cierres de caja con paginación
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
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Calcular totales generales usando los nombres de columnas correctos
    const totalEntradas = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.total_ventas || 0), 0);
    const totalSalidas = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.total_gastos || 0), 0);
    const totalSaldo = cierres.reduce((sum, cierre) => sum + parseFloat(cierre.saldo_final || 0), 0);
    
    // Transformar los datos para que coincidan con lo que espera el frontend
    const cierresTransformados = cierres.map(cierre => {
      const cierreJSON = cierre.toJSON();
      return {
        ...cierreJSON,
        // Agregar propiedades con los nombres que espera el frontend
        total_entradas: cierreJSON.total_ventas,
        total_salidas: cierreJSON.total_gastos
      };
    });
    
    // Devolver respuesta
    res.status(200).json({
      cierres: cierresTransformados,
      meta: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalEntradas,
        totalSalidas,
        totalSaldo
      }
    });
    
  } catch (error) {
    console.error('Error al obtener historial de cierres de caja:', error);
    console.error('Detalles del error:', JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name
    }));
    res.status(500).json({ 
      message: 'Error al obtener historial de cierres de caja', 
      error: error.message 
    });
  }
};

// Verificar si existe un cierre para el día actual
exports.verificarCierreDiario = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    
    const cierreExistente = await CierreCaja.findOne({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      }
    });
    
    res.json({
      existeCierre: !!cierreExistente,
      cierre: cierreExistente ? {
        id: cierreExistente.id,
        fecha: cierreExistente.fecha,
        total_entradas: cierreExistente.total_ventas,
        total_salidas: cierreExistente.total_gastos,
        saldo_final: cierreExistente.saldo_final
      } : null
    });
  } catch (error) {
    console.error('Error al verificar cierre diario:', error);
    res.status(500).json({ message: 'Error al verificar cierre diario', error: error.message });
  }
};
