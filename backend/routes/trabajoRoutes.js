const express = require('express');
const router = express.Router();
const trabajoController = require('../controllers/trabajoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/estado', trabajoController.getTrabajosPorEstado);
router.get('/recientes', trabajoController.getTrabajosRecientes);

// Rutas protegidas (requieren autenticación)
router.get('/', protect, trabajoController.getAllTrabajos);
router.get('/:id', protect, trabajoController.getTrabajoById);
router.post('/', protect, trabajoController.createTrabajo);
router.put('/:id', protect, trabajoController.updateTrabajo);
router.delete('/:id', protect, authorize('admin'), trabajoController.deleteTrabajo);

module.exports = router;
