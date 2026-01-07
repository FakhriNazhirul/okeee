const app = require('./src/app');
const connectDB = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('\n📋 Available endpoints:');
  console.log(`   GET  /api/health           - Health check`);
  console.log(`   GET  /api/menu             - Get all menus`);
  console.log(`   POST /api/auth/login       - Admin login`);
  console.log(`   POST /api/menu             - Create menu (protected)`);
  console.log('='.repeat(50));
});