const app = require('./src/app');
const { connectDB } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Start server with database connection
async function startServer() {
  try {
    // Connect to MySQL database
    await connectDB();
    console.log('✅ Database connection established');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API available at: http://localhost:${PORT}/api`);
      console.log(`💾 Database: MySQL (${process.env.DB_NAME || 'kopi_nusantara'})`);
      console.log('='.repeat(50));
      console.log('\n📋 Available endpoints:');
      console.log(`   GET  /api/health           - Health check`);
      console.log(`   GET  /api/menu             - Get all menus`);
      console.log(`   POST /api/auth/login       - Admin login`);
      console.log(`   POST /api/menu             - Create menu (protected)`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('💡 Server will run in limited mode (no database)');
    
    // Start server without database (fallback mode)
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`⚠️  Server running in LIMITED MODE (port ${PORT})`);
      console.log('❌ Database connection failed');
      console.log('💡 Basic routes will work, but database features disabled');
      console.log('='.repeat(50));
    });
  }
}

// Start the server
startServer();