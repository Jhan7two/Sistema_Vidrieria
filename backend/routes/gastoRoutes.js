const express = require('express');
const gastoController = require('../controllers/gastoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas específicas
router.get('/mes', authorize('admin', 'vendedor'), gastoController.getGastosDelMes);
router.get('/stats', authorize('admin', 'vendedor'), gastoController.getDashboardStats);
router.get('/categorias', authorize('admin', 'vendedor'), gastoController.getGastosPorCategoria);

// Rutas básicas
router.get('/', authorize('admin', 'vendedor'), gastoController.getGastos);
router.post('/', authorize('admin', 'vendedor'), gastoController.createGasto);

module.exports = router;
