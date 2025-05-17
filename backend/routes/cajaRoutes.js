const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Proteger todas las rutas
router.use(protect);

// Obtener movimientos diarios de caja
router.get(
    '/movimientos/diarios', 
    authorize('admin', 'vendedor'),
    cajaController.getMovimientosDiarios
);

// Obtener saldo actual de caja
router.get(
    '/saldo-actual', 
    authorize('admin', 'vendedor'),
    cajaController.getSaldoActual
);

// Registrar un nuevo movimiento de caja (ingreso/egreso)
router.post(
    '/', 
    authorize('admin', 'vendedor'),
    cajaController.registrarMovimiento
);

// Endpoint para cierre de día
router.post(
    '/cerrar',
    authorize('admin'),
    cajaController.cerrarCaja
);

module.exports = router;
