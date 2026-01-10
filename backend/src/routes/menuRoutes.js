const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuControllers');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

// Protected routes (admin only)
router.post('/', authenticate, menuController.createMenu);
router.put('/:id', authenticate, menuController.updateMenu);
router.delete('/:id', authenticate, menuController.deleteMenu);

// Filter routes
router.get('/category/:category', menuController.getMenusByCategory);
router.get('/available/true', menuController.getAvailableMenus);

module.exports = router;