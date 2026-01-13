const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS untuk frontend yang di-serve dari server yang sama
app.use(cors());

app.use(express.json());

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/menu', menuRoutes);
app.use('/auth', authRoutes);

// API Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Kopi Nusantara API',
    version: '1.0.0',
    note: 'Frontend di-serve dari server yang sama'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = app;