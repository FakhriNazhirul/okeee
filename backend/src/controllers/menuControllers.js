const Menu = require('../models/Menu');

const menuController = {
  // Get all menus
  getAllMenus: async (req, res) => {
    try {
      const menus = await Menu.findAll();
      
      // Transform data ke format response
      const transformedMenus = menus.map(Menu.transformToResponse);
      
      res.json({
        success: true,
        count: transformedMenus.length,
        data: transformedMenus
      });
    } catch (error) {
      console.error('Get all menus error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get single menu
  getMenuById: async (req, res) => {
    try {
      const menu = await Menu.findById(req.params.id);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
      
      res.json({
        success: true,
        data: Menu.transformToResponse(menu)
      });
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Create new menu
  createMenu: async (req, res) => {
    try {
      const menuData = req.body;
      
      // Validation
      if (!menuData.name || !menuData.price) {
        return res.status(400).json({
          success: false,
          message: 'Name and price are required'
        });
      }
      
      const newMenu = await Menu.create(menuData);
      
      res.status(201).json({
        success: true,
        message: 'Menu created successfully',
        data: Menu.transformToResponse(newMenu)
      });
    } catch (error) {
      console.error('Create menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Update menu
  updateMenu: async (req, res) => {
    try {
      const updatedMenu = await Menu.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Menu updated successfully',
        data: Menu.transformToResponse(updatedMenu)
      });
    } catch (error) {
      console.error('Update menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Delete menu
  deleteMenu: async (req, res) => {
    try {
      await Menu.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Menu deleted successfully'
      });
    } catch (error) {
      console.error('Delete menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get menus by category
  getMenusByCategory: async (req, res) => {
    try {
      const menus = await Menu.findByCategory(req.params.category);
      
      res.json({
        success: true,
        count: menus.length,
        category: req.params.category,
        data: menus.map(Menu.transformToResponse)
      });
    } catch (error) {
      console.error('Get by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get available menus
  getAvailableMenus: async (req, res) => {
    try {
      const menus = await Menu.findAvailable();
      
      res.json({
        success: true,
        count: menus.length,
        data: menus.map(Menu.transformToResponse)
      });
    } catch (error) {
      console.error('Get available error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

module.exports = menuController;