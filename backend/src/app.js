const express = require('express');
const cors = require('cors');
const app = express();
const menuRoutes = require('./routes/menuRoutes');
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Redirect root to API
app.get('/', (req, res) => {
  res.redirect('/api');
});

// API Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '☕ Kopi Nusantara API',
    version: '1.0.0',
    documentation: 'Available endpoints are listed below',
    endpoints: {
      health: { method: 'GET', path: '/api/health', description: 'Health check' },
      getAllMenus: { method: 'GET', path: '/api/menu', description: 'Get all menu items' },
      getMenuById: { method: 'GET', path: '/api/menu/:id', description: 'Get specific menu' },
      login: { method: 'POST', path: '/api/auth/login', description: 'Admin login' },
      register: { method: 'POST', path: '/api/auth/register', description: 'Register new admin (protected)' },
      createMenu: { method: 'POST', path: '/api/menu', description: 'Create new menu (protected)' },
      updateMenu: { method: 'PUT', path: '/api/menu/:id', description: 'Update menu (protected)' },
      getByCategory: { method: 'GET', path: '/api/menu/category/:category', description: 'Get menus by category' },
      getAvailable: { method: 'GET', path: '/api/menu/available/true', description: 'Get available menus' }
    },
    database: 'MySQL',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Load routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kopi Nusantara API is running',
    version: '1.0.0',
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// 404 handler with helpful message
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    suggestion: 'Try one of the available endpoints below',
    availableEndpoints: [
      'GET  /api',
      'GET  /api/health',
      'GET  /api/menu',
      'GET  /api/menu/:id',
      'GET  /api/menu/category/:category',
      'GET  /api/menu/available/true',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/menu',
      'PUT  /api/menu/:id',
      'DELETE /api/menu/:id'
    ],
    help: 'Visit /api for complete documentation'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;