// backend/routes/authRoutes.js
const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/login', login);

// Rutas protegidas (requieren autenticación)
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
