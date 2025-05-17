const express = require('express');
const trabajoController = require('../controllers/trabajoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para obtener información específica (deben ir ANTES de las rutas con parámetros)
router.get('/estado', authorize('admin', 'vendedor', 'operario'), trabajoController.getTrabajosPorEstado);
router.get('/estado/contador', authorize('admin', 'vendedor', 'operario'), trabajoController.getTrabajosPorEstado);
router.get('/recientes', authorize('admin', 'vendedor', 'operario'), trabajoController.getTrabajosRecientes);
router.get('/buscar', authorize('admin', 'vendedor'), trabajoController.buscarTrabajosPorCobrar);

// Rutas para trabajos
router.get('/', authorize('admin', 'vendedor', 'operario'), trabajoController.getAllTrabajos);
router.post('/', authorize('admin', 'vendedor'), trabajoController.createTrabajo);
router.get('/:id', authorize('admin', 'vendedor', 'operario'), trabajoController.getTrabajoById);
router.put('/:id', authorize('admin', 'vendedor'), trabajoController.updateTrabajo);
router.delete('/:id', authorize('admin'), trabajoController.deleteTrabajo);

module.exports = router;
