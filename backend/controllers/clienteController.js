const Cliente = require('../models/cliente');
const { Op } = require('sequelize');

/**
 * Obtiene todos los clientes
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [['nombre', 'ASC']]
    });
    
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la lista de clientes',
      error: error.message 
    });
  }
};

/**
 * Obtiene un cliente por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getClienteById = async (req, res) => {
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
    console.error('Error al obtener cliente por ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message 
    });
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.createCliente = async (req, res) => {
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
    
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear el cliente',
      error: error.message 
    });
  }
};

/**
 * Actualiza un cliente existente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.updateCliente = async (req, res) => {
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
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el cliente',
      error: error.message 
    });
  }
};

/**
 * Elimina un cliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.deleteCliente = async (req, res) => {
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
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar el cliente',
      error: error.message 
    });
  }
};

/**
 * Busca clientes por nombre o teléfono
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.buscarClientes = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    const clientes = await Cliente.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${q}%` } },
          { telefono: { [Op.like]: `%${q}%` } }
        ]
      },
      order: [['nombre', 'ASC']]
    });
    
    res.json(clientes);
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar clientes',
      error: error.message 
    });
  }
}; 