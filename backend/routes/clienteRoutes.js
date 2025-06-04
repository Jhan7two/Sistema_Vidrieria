const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { protect } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para clientes
router.get('/', clienteController.getClientes);
router.get('/buscar', clienteController.buscarClientes);
router.post('/', clienteController.crearCliente);
router.put('/:id', clienteController.updateCliente);
router.delete('/:id', clienteController.deleteCliente);
router.get('/:id', clienteController.getClienteById);

module.exports = router; 