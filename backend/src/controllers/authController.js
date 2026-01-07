const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const authController = {
  // Admin login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email and password'
        });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email'
        });
      }

      // Find admin by email
      const admin = await Admin.findOne({ email }).select('+password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated. Please contact administrator.'
        });
      }

      // Check password
      const isPasswordMatch = await admin.comparePassword(password);
      
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Update last login
      await admin.updateLastLogin();

      // Generate token
      const token = generateToken(admin._id, admin.role);

      // Remove password from response
      const adminData = admin.toJSON();

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: adminData
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during login'
      });
    }
  },

  // Register new admin (protected - superadmin only)
  register: async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide username, email, and password'
        });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ email }, { username }]
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Admin with this email or username already exists'
        });
      }

      // Create new admin
      const admin = await Admin.create({
        username,
        email,
        password,
        role: role || 'admin'
      });

      // Generate token
      const token = generateToken(admin._id, admin.role);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        token,
        user: admin
      });

    } catch (error) {
      console.error('Register error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      res.status(500).json({
        success: false,
        error: 'Server error during registration'
      });
    }
  },

  // Get current admin info
  getCurrentAdmin: async (req, res) => {
    try {
      const admin = await Admin.findById(req.user.id);
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Admin not found'
        });
      }

      res.json({
        success: true,
        data: admin
      });

    } catch (error) {
      console.error('Get current admin error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin information'
      });
    }
  },

  // Logout (client-side token removal)
  logout: (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = authController;