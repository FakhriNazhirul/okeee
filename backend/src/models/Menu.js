class Menu {
  static async findAll() {
    const sql = 'SELECT * FROM menu ORDER BY id DESC';
    return await require('../utils/db').query(sql);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM menu WHERE id = ?';
    return await require('../utils/db').findOne(sql, [id]);
  }

  static async create(menuData) {
    // Map dari request body ke column database
    const data = {
      nama_menu: menuData.name || menuData.nama_menu,
      deskripsi: menuData.description || menuData.deskripsi,
      harga: menuData.price || menuData.harga,
      gambar: menuData.image_url || menuData.gambar || '/uploads/default-coffee.jpg'
    };
    
    return await require('../utils/db').insert('menu', data);
  }

  static async update(id, menuData) {
    const data = {};
    
    // Hanya update field yang dikirim
    if (menuData.name !== undefined) data.nama_menu = menuData.name;
    if (menuData.nama_menu !== undefined) data.nama_menu = menuData.nama_menu;
    if (menuData.description !== undefined) data.deskripsi = menuData.description;
    if (menuData.deskripsi !== undefined) data.deskripsi = menuData.deskripsi;
    if (menuData.price !== undefined) data.harga = menuData.price;
    if (menuData.harga !== undefined) data.harga = menuData.harga;
    if (menuData.image_url !== undefined) data.gambar = menuData.image_url;
    if (menuData.gambar !== undefined) data.gambar = menuData.gambar;
    
    if (Object.keys(data).length === 0) {
      throw new Error('No data to update');
    }
    
    return await require('../utils/db').update('menu', data, { id });
  }

  static async delete(id) {
    const sql = 'DELETE FROM menu WHERE id = ?';
    await require('../utils/db').query(sql, [id]);
    return true;
  }

  static async findByCategory(category) {
    // Table tidak ada column category, jadi kita filter di code
    const allMenus = await this.findAll();
    return allMenus.filter(menu => 
      (menu.deskripsi && menu.deskripsi.toLowerCase().includes(category.toLowerCase())) ||
      (menu.nama_menu && menu.nama_menu.toLowerCase().includes(category.toLowerCase()))
    );
  }

  static async findAvailable() {
    // Table tidak ada column is_available, jadi return semua
    return await this.findAll();
  }

  // Helper: Transform database row to API response format
  static transformToResponse(menuRow) {
    return {
      id: menuRow.id,
      name: menuRow.nama_menu,
      description: menuRow.deskripsi,
      price: parseFloat(menuRow.harga),
      category: 'general', // Default category
      imageUrl: menuRow.gambar,
      isAvailable: true
    };
  }
}

module.exports = Menu;