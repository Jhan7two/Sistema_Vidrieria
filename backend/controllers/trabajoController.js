const Trabajo = require('../models/trabajo');
const { Op } = require('sequelize');

// Obtener todos los trabajos
exports.getAllTrabajos = async (req, res) => {
  try {
    const trabajos = await Trabajo.findAll();
    res.json(trabajos);
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
      order: [['createdAt', 'DESC']],
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
