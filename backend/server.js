const express = require('express');
const path = require('path');
const { connectDB } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files dari folder FRONTEND (satu level di atas)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ======================
// IMPORT API ROUTES
// ======================
const apiApp = require('./src/app');  // ← PATH DIPERBAIKI!
app.use('/api', apiApp);

// ======================
// ROUTES UNTUK FRONTEND
// ======================
// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'assets', 'index.html'));
});

// Customer login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'assets', 'login.html'));
});

// Admin pages
app.get('/admin/*', (req, res) => {
  const requestedPage = req.params[0];
  const adminPath = path.join(__dirname, '..', 'frontend', 'admin', requestedPage);
  
  const fs = require('fs');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin page not found');
  }
});

// API Documentation page (sederhana)
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>API Docs</title></head>
    <body>
      <h1>API Documentation</h1>
      <p><a href="/api/menu" target="_blank">/api/menu</a> - Get menus</p>
      <p><a href="/">← Back to Home</a></p>
    </body>
    </html>
  `);
});

// ======================
// START SERVER
// ======================
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected: kopi_nusantara');
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🚀 SERVER BERJALAN: http://localhost:${PORT}`);
      console.log('='.repeat(60));
      console.log('\n🌐 WEBSITE:');
      console.log(`   • Home:      http://localhost:${PORT}/`);
      console.log(`   • Login:     http://localhost:${PORT}/login`);
      console.log(`   • Admin:     http://localhost:${PORT}/admin/dashboard.html`);
      console.log('\n🔧 API:');
      console.log(`   • Menu:      http://localhost:${PORT}/api/menu`);
      console.log(`   • Health:    http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    app.listen(PORT, () => {
      console.log(`⚠️  Server running WITHOUT database on port ${PORT}`);
      console.log(`🌐 Buka: http://localhost:${PORT}/`);
    });
  }
}

startServer();