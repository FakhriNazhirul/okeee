const Menu = require('../models/Menu');

/**
 * Controller untuk mengelola data Menu Kopi Nusantara
 */
const menuController = {
  
  // 1. Mengambil semua data menu dari database
  getAllMenus: async (req, res) => {
    try {
      const menus = await Menu.find();
      
      res.json({ 
        success: true, 
        count: menus.length,
        data: menus 
      });
    } catch (error) {
      console.error('Error saat mengambil menu:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Gagal mengambil data menu dari server' 
      });
    }
  },

  // 2. Membuat menu baru
  createMenu: async (req, res) => {
    try {
      const { name, description, price, category, imageUrl, isAvailable } = req.body;

      // Validasi input wajib (Nama dan Harga)
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          error: 'Nama menu dan harga wajib diisi'
        });
      }

      // Membuat instance menu baru sesuai skema Model
      const menu = new Menu({
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      });

      // Menyimpan ke MongoDB
      await menu.save();

      res.status(201).json({ 
        success: true, 
        message: 'Menu berhasil ditambahkan',
        data: menu 
      });
    } catch (error) {
      console.error('Error saat membuat menu:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
};

module.exports = menuController;