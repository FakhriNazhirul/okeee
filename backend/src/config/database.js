const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kopi_nusantara');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('💡 Tips: Pastikan MongoDB sudah berjalan');
    console.log('   Untuk Windows: Buka MongoDB Compass');
    console.log('   Untuk Mac: brew services start mongodb-community');
    console.log('   Untuk Linux: sudo systemctl start mongod');
  }
};

module.exports = connectDB;