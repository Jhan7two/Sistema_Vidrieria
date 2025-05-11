const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');

// Endpoint para obtener gastos del mes
router.get('/mes', gastoController.getGastosDelMes);

// Endpoint para obtener estadísticas generales de gastos
router.get('/stats', gastoController.getDashboardStats);

// Endpoint para obtener gastos por categoría
router.get('/categorias', gastoController.getGastosPorCategoria);

module.exports = router;
