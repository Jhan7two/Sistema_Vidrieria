const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Endpoint para obtener ventas del mes
router.get('/mes', ventaController.getVentasDelMes);

// Endpoint para obtener estadísticas generales de ventas
router.get('/stats', ventaController.getDashboardStats);

module.exports = router;