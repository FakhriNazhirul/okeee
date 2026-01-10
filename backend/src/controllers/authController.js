const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authController = {
  // Login
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      // Find user
      const user = await Admin.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const isPasswordValid = await Admin.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Register
  register: async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      
      // Create new user
      const newUser = await Admin.create({
        username,
        password,
        role: role || 'user'
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: newUser
      });
      
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get profile
  getProfile: async (req, res) => {
    try {
      // This requires authentication middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const user = await Admin.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

module.exports = authController;