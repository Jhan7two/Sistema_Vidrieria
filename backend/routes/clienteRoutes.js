const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Obtener todos los clientes
router.get('/', clienteController.getAllClientes);

// Buscar clientes (debe ir antes de getClienteById para evitar conflictos de rutas)
router.get('/buscar', clienteController.buscarClientes);

// Obtener un cliente por ID
router.get('/:id', clienteController.getClienteById);

// Crear un nuevo cliente
router.post('/', clienteController.createCliente);

// Actualizar un cliente existente
router.put('/:id', clienteController.updateCliente);

// Eliminar un cliente
router.delete('/:id', clienteController.deleteCliente);

module.exports = router; 