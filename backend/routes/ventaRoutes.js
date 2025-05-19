const express = require('express');
const ventaController = require('../controllers/ventaController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas específicas
router.get('/mes', authorize('admin', 'vendedor'), ventaController.getVentasDelMes);
router.get('/stats', authorize('admin', 'vendedor'), ventaController.getDashboardStats);

// Ruta básica
router.get('/', authorize('admin', 'vendedor'), ventaController.getVentas);
router.post('/', authorize('admin', 'vendedor'), ventaController.createVenta);

module.exports = router;