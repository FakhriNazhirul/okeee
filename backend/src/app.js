const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/menu', menuRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Routes sementara
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kopi Nusantara API',
    version: '1.0.0'
  });
});

app.get('/api/menu', (req, res) => {
  // Data dummy untuk testing
  const menus = [
    {
      _id: '1',
      name: 'Espresso',
      description: 'Kopi espresso klasik dengan rasa yang kuat',
      price: 25000,
      category: 'espresso',
      imageUrl: '/assets/default-coffee.jpg',
      isAvailable: true
    },
    {
      _id: '2',
      name: 'Cappuccino',
      description: 'Espresso dengan susu steamed dan foam',
      price: 35000,
      category: 'espresso',
      imageUrl: '/assets/default-coffee.jpg',
      isAvailable: true
    }
  ];
  res.json({ success: true, data: menus });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;