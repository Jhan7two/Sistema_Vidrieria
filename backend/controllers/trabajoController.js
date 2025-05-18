const Trabajo = require('../models/trabajo');
const { Op } = require('sequelize');
const Cliente = require('../models/cliente');
const sequelize = require('../config/database');

// Obtener todos los trabajos
exports.getAllTrabajos = async (req, res) => {
  try {
    console.log('=== INICIO OBTENER TODOS LOS TRABAJOS ===');
    console.log('Usuario solicitante:', req.user ? req.user.nombre_usuario : 'No autenticado');
    
    const trabajos = await Trabajo.findAll({
      include: [{
        model: Cliente,
        as: 'clienteInfo',
        attributes: ['id', 'nombre', 'telefono']
      }],
      order: [['updated_at', 'DESC']]
    });
    console.log(`Se encontraron ${trabajos.length} trabajos`);
    
    // Formatear la respuesta para el cliente
    const trabajosFormateados = trabajos.map(trabajo => {
      // Obtener información del cliente si existe
      const clienteInfo = trabajo.clienteInfo ? {
        id: trabajo.clienteInfo.id,
        nombre: trabajo.clienteInfo.nombre,
        telefono: trabajo.clienteInfo.telefono
      } : null;
      
      // Asegurarse de que los valores numéricos estén como números
      return {
        id: trabajo.id,
        cliente_id: trabajo.cliente_id,
        cliente: clienteInfo ? clienteInfo.nombre : (trabajo.cliente_id ? `Cliente #${trabajo.cliente_id}` : 'Sin cliente'),
        clienteInfo: clienteInfo,
        descripcion: trabajo.descripcion,
        tipo: trabajo.tipo,
        fecha_programada: trabajo.fecha_programada,
        fecha_inicio: trabajo.fecha_inicio,
        fecha_finalizacion: trabajo.fecha_finalizacion,
        fecha_entrega: trabajo.fecha_entrega,
        estado: trabajo.estado,
        direccion_trabajo: trabajo.direccion_trabajo,
        costo_total: parseFloat(trabajo.costo_total),
        monto_pagado: parseFloat(trabajo.monto_pagado),
        saldo_pendiente: parseFloat(trabajo.costo_total) - parseFloat(trabajo.monto_pagado),
        estado_pago: trabajo.estado_pago,
        observaciones: trabajo.observaciones,
        created_at: trabajo.created_at,
        updated_at: trabajo.updated_at
      };
    });
    
    console.log('=== FIN OBTENER TODOS LOS TRABAJOS ===');
    res.json(trabajosFormateados);
  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    res.status(500).json({ message: 'Error al obtener trabajos', error: error.message });
  }
};

// Obtener trabajo por ID
exports.getTrabajoById = async (req, res) => {
  try {
    const trabajo = await Trabajo.findByPk(req.params.id);
    if (!trabajo) {
      return res.status(404).json({ message: 'Trabajo no encontrado' });
    }
    res.json(trabajo);
  } catch (error) {
    console.error('Error al obtener trabajo:', error);
    res.status(500).json({ message: 'Error al obtener trabajo', error: error.message });
  }
};

// Crear un nuevo trabajo
exports.createTrabajo = async (req, res) => {
  try {
    const trabajo = await Trabajo.create(req.body);
    res.status(201).json(trabajo);
  } catch (error) {
    console.error('Error al crear trabajo:', error);
    res.status(500).json({ message: 'Error al crear trabajo', error: error.message });
  }
};

// Actualizar un trabajo existente
exports.updateTrabajo = async (req, res) => {
  try {
    const trabajo = await Trabajo.findByPk(req.params.id);
    if (!trabajo) {
      return res.status(404).json({ message: 'Trabajo no encontrado' });
    }
    await trabajo.update(req.body);
    res.json(trabajo);
  } catch (error) {
    console.error('Error al actualizar trabajo:', error);
    res.status(500).json({ message: 'Error al actualizar trabajo', error: error.message });
  }
};

// Eliminar un trabajo
exports.deleteTrabajo = async (req, res) => {
  try {
    const trabajo = await Trabajo.findByPk(req.params.id);
    if (!trabajo) {
      return res.status(404).json({ message: 'Trabajo no encontrado' });
    }
    await trabajo.destroy();
    res.json({ message: 'Trabajo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar trabajo:', error);
    res.status(500).json({ message: 'Error al eliminar trabajo', error: error.message });
  }
};

// Obtener conteo de trabajos por estado para el dashboard
exports.getTrabajosPorEstado = async (req, res) => {
  try {
    const pendientes = await Trabajo.count({ where: { estado: 'inicio' } });
    const enProceso = await Trabajo.count({ where: { estado: 'proceso' } });
    const terminados = await Trabajo.count({ where: { estado: 'terminado' } });
    
    res.json({
      pendientes,
      enProceso,
      terminados,
      total: pendientes + enProceso + terminados
    });
  } catch (error) {
    console.error('Error al obtener conteo de trabajos por estado:', error);
    res.status(500).json({ 
      message: 'Error al obtener conteo de trabajos por estado', 
      error: error.message 
    });
  }
};

// Obtener trabajos recientes (últimos 5 por defecto)
exports.getTrabajosRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const trabajos = await Trabajo.findAll({
      order: [['created_at', 'DESC']],
      limit
    });
    
    res.json(trabajos);
  } catch (error) {
    console.error('Error al obtener trabajos recientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener trabajos recientes', 
      error: error.message 
    });
  }
};

// Buscar trabajos por cobrar filtrados por cliente o ID
exports.buscarTrabajosPorCobrar = async (req, res) => {
  try {
    console.log('=== INICIO BÚSQUEDA TRABAJOS POR COBRAR ===');
    const { termino } = req.query;
    console.log('Término de búsqueda:', termino);
    
    let trabajos = [];
    let whereCondition = {
      estado_pago: { [Op.ne]: 'Pagado' }
    };
    
    // Si no hay término, traer todos los trabajos con saldo pendiente
    if (!termino) {
      trabajos = await Trabajo.findAll({
        where: whereCondition,
        include: [{
          model: Cliente,
          as: 'clienteInfo',
          attributes: ['id', 'nombre', 'telefono']
        }],
        order: [['updated_at', 'DESC']],
        limit: 20
      });
    } else {
      // Buscar por ID si el término es numérico
      if (!isNaN(termino)) {
        const trabajoPorId = await Trabajo.findOne({
          where: { 
            id: termino,
            estado_pago: { [Op.ne]: 'Pagado' }
          },
          include: [{
            model: Cliente,
            as: 'clienteInfo',
            attributes: ['id', 'nombre', 'telefono']
          }]
        });
        
        if (trabajoPorId) {
          trabajos = [trabajoPorId];
        }
      }
      
      // Si no se encontró por ID o si el término no es numérico
      if (trabajos.length === 0) {
        // Buscar en la descripción y también por nombre de cliente
        trabajos = await Trabajo.findAll({
          where: whereCondition,
          include: [{
            model: Cliente,
            as: 'clienteInfo',
            attributes: ['id', 'nombre', 'telefono'],
            where: {
              nombre: { [Op.like]: `%${termino}%` }
            },
            required: false
          }],
          order: [['updated_at', 'DESC']],
          limit: 20
        });
        
        // Si no hay resultados buscando por cliente, intentar buscar por descripción
        if (trabajos.length === 0) {
          trabajos = await Trabajo.findAll({
            where: {
              descripcion: { [Op.like]: `%${termino}%` },
              estado_pago: { [Op.ne]: 'Pagado' }
            },
            include: [{
              model: Cliente,
              as: 'clienteInfo',
              attributes: ['id', 'nombre', 'telefono']
            }],
            order: [['updated_at', 'DESC']],
            limit: 20
          });
        }
      }
    }
    
    console.log('Trabajos encontrados:', trabajos.length);
    
    // Filtrar trabajos por saldo pendiente (hacerlo en memoria)
    trabajos = trabajos.filter(trabajo => {
      const costoTotal = parseFloat(trabajo.costo_total);
      const montoPagado = parseFloat(trabajo.monto_pagado);
      return costoTotal > montoPagado;
    });
    
    console.log('Trabajos con saldo pendiente:', trabajos.length);
    console.log('=== FIN BÚSQUEDA TRABAJOS POR COBRAR ===');
    
    // Formatear la respuesta para el cliente
    const trabajosFormateados = trabajos.map(trabajo => {
      // Obtener información del cliente si existe
      const clienteInfo = trabajo.clienteInfo ? {
        id: trabajo.clienteInfo.id,
        nombre: trabajo.clienteInfo.nombre,
        telefono: trabajo.clienteInfo.telefono
      } : null;
      
      // Calcular el saldo pendiente
      const costoTotal = parseFloat(trabajo.costo_total);
      const montoPagado = parseFloat(trabajo.monto_pagado);
      const saldoPendiente = costoTotal - montoPagado;
      
      return {
        id: trabajo.id,
        cliente_id: trabajo.cliente_id,
        cliente: clienteInfo ? clienteInfo.nombre : (trabajo.cliente_id ? `Cliente #${trabajo.cliente_id}` : 'Sin cliente'),
        clienteInfo: clienteInfo,
        descripcion: trabajo.descripcion,
        costo_total: costoTotal,
        monto_pagado: montoPagado,
        saldo_pendiente: saldoPendiente,
        estado_pago: trabajo.estado_pago
      };
    });
    
    res.json({ trabajos: trabajosFormateados });
  } catch (error) {
    console.error('Error al buscar trabajos por cobrar:', error.message, error.stack);
    res.status(500).json({ 
      message: 'Error al buscar trabajos: ' + error.message,
      error: true 
    });
  }
};
