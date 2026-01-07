const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies.token) {
        token = req.cookies.token;
      }

      // Check if token exists
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this route'
        });
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get admin from database
        const admin = await Admin.findById(decoded.id).select('-__v');
        
        if (!admin) {
          return res.status(401).json({
            success: false,
            error: 'Admin not found'
          });
        }

        // Check if admin is active
        if (!admin.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Admin account is deactivated'
          });
        }

        // Check role permissions if roles are specified
        if (roles.length > 0 && !roles.includes(admin.role)) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to perform this action'
          });
        }

        // Attach admin to request object
        req.user = admin;
        next();

      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            error: 'Invalid token'
          });
        }

        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token has expired'
          });
        }

        throw error;
      }

    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during authentication'
      });
    }
  };
};

module.exports = auth;