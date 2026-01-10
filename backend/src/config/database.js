const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kopi_nusantara',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected to database: ${process.env.DB_NAME || 'kopi_nusantara'}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. MySQL service is running');
    console.log('   2. Database exists: kopi_nusantara');
    console.log('   3. Credentials in .env are correct');
    process.exit(1);
  }
};

module.exports = { connectDB, pool };