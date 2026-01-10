const bcrypt = require('bcryptjs');
const validator = require('validator');
const DB = require('../utils/db');

class Admin {
  // Find by email (table user tidak ada email, jadi pakai username)
  static async findByEmail(email) {
    try {
      const sql = `
        SELECT id, username, password, role
        FROM user 
        WHERE username = ? 
        LIMIT 1
      `;
      return await DB.findOne(sql, [email]); // Pakai username sebagai email
    } catch (error) {
      console.error('Find by email error:', error);
      throw error;
    }
  }

  // Find by username
  static async findByUsername(username) {
    try {
      const sql = `
        SELECT id, username, password, role
        FROM user 
        WHERE username = ? 
        LIMIT 1
      `;
      return await DB.findOne(sql, [username]);
    } catch (error) {
      console.error('Find by username error:', error);
      throw error;
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const sql = `
        SELECT id, username, role
        FROM user 
        WHERE id = ?
        LIMIT 1
      `;
      return await DB.findOne(sql, [id]);
    } catch (error) {
      console.error('Find by ID error:', error);
      throw error;
    }
  }

  // Create new admin/user
  static async create(adminData) {
    try {
      // Validation
      if (!adminData.username) {
        throw new Error('Username is required');
      }

      if (!adminData.password || adminData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check if username already exists
      const existingUser = await this.findByUsername(adminData.username);
      if (existingUser) {
        throw new Error('Username already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const data = {
        username: adminData.username,
        password: hashedPassword,
        role: adminData.role || 'user' // 'admin' atau 'user'
      };

      // Insert into database
      const result = await DB.insert('user', data);
      
      // Return without password
      const { password, ...userWithoutPassword } = result;
      return userWithoutPassword;

    } catch (error) {
      console.error('Create admin error:', error);
      throw error;
    }
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      console.error('Compare password error:', error);
      throw error;
    }
  }

  // Get all users (for admin only)
  static async findAll() {
    try {
      const sql = `
        SELECT id, username, role
        FROM user 
        ORDER BY id DESC
      `;
      return await DB.query(sql);
    } catch (error) {
      console.error('Find all users error:', error);
      throw error;
    }
  }
}

module.exports = Admin;