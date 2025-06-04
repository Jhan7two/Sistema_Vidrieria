const Cliente = require('../models/cliente');
const { Op } = require('sequelize');

/**
 * Obtiene todos los clientes
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [['nombre', 'ASC']]
    });
    
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la lista de clientes'
    });
  }
};

/**
 * Obtiene un cliente por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false,
        message: `Cliente con ID ${id} no encontrado` 
      });
    }
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el cliente'
    });
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    
    // Validar campos requeridos
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre del cliente es obligatorio' 
      });
    }
    
    // Crear nuevo cliente
    const nuevoCliente = await Cliente.create({
      nombre,
      telefono: telefono || null
    });
    
    res.status(201).json({
      success: true,
      data: nuevoCliente
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al crear el cliente'
    });
  }
};

/**
 * Actualiza un cliente existente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono } = req.body;
    
    // Buscar el cliente
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false,
        message: `Cliente con ID ${id} no encontrado` 
      });
    }
    
    // Validar campos requeridos
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre del cliente es obligatorio' 
      });
    }
    
    // Actualizar cliente
    await cliente.update({
      nombre,
      telefono: telefono || null
    });
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el cliente'
    });
  }
};

/**
 * Elimina un cliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el cliente
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false,
        message: `Cliente con ID ${id} no encontrado` 
      });
    }
    
    // Eliminar cliente
    await cliente.destroy();
    
    res.json({ 
      success: true,
      message: 'Cliente eliminado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar el cliente'
    });
  }
};

/**
 * Busca clientes por nombre o teléfono
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const buscarClientes = async (req, res) => {
  try {
    const { termino } = req.query;
    
    if (!termino) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    const clientes = await Cliente.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${termino}%` } },
          { telefono: { [Op.like]: `%${termino}%` } }
        ]
      },
      order: [['nombre', 'ASC']]
    });
    
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar clientes'
    });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  crearCliente,
  updateCliente,
  deleteCliente,
  buscarClientes
}; 