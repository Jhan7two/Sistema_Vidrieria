const express = require('express');
const router = express.Router();
const cobroController = require('../controllers/cobroController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Rutas protegidas que requieren autenticación
router.use(protect);

// Rutas específicas (deben ir ANTES de las rutas con parámetros)
router.get('/diarios', authorize('admin', 'vendedor'), cobroController.getCobrosDiarios);

// Rutas para todos los usuarios autenticados
router.get('/', authorize('admin', 'vendedor'), cobroController.getAllCobros);
router.post('/', authorize('admin', 'vendedor'), cobroController.createCobro);

// Rutas con parámetros
router.get('/trabajo/:trabajoId', authorize('admin', 'vendedor'), cobroController.getCobrosByTrabajoId);
router.get('/:id', authorize('admin', 'vendedor'), cobroController.getCobroById);
router.put('/:id', authorize('admin', 'vendedor'), cobroController.updateCobro);
router.delete('/:id', authorize('admin'), cobroController.deleteCobro);

// Ruta para actualizar todos los cobros existentes con cliente_id (solo para administradores)
// router.post('/update-clientes', authorize('admin'), cobroController.updateCobrosCliente);

module.exports = router;
