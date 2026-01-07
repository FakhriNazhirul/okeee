const Menu = require('../models/Menu');

exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const menu = new Menu(req.body);
    await menu.save();
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};