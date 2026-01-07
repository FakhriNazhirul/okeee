const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.post('/register', authMiddleware('superadmin'), authController.register);
router.get('/me', authMiddleware(), authController.getCurrentAdmin);

module.exports = router;