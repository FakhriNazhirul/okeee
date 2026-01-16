const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Pastikan file ini ada

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors()); // Izinkan semua origin untuk development
app.use(express.json());

// ========== TEST ENDPOINTS ==========
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend API is running',
        database: 'MySQL connected',
        timestamp: new Date().toISOString()
    });
});

// ========== MENU ENDPOINTS ==========

// GET ALL MENU
app.get('/api/menu', async (req, res) => {
    console.log('📦 API: GET /api/menu');
    
    try {
        // Query ke tabel MENU
        const [rows] = await db.query('SELECT * FROM menu ORDER BY created_at DESC');
        
        console.log(`✅ Found ${rows.length} records in 'menu' table`);
        
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database query failed',
            error: error.message
        });
    }
});

// GET MENU STATISTICS
app.get('/api/menu/stats', async (req, res) => {
    console.log('📊 API: GET /api/menu/stats');
    
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN kategori = 'coffee' THEN 1 ELSE 0 END) as coffee,
                SUM(CASE WHEN kategori = 'non-coffee' THEN 1 ELSE 0 END) as nonCoffee,
                SUM(CASE WHEN kategori = 'makanan' THEN 1 ELSE 0 END) as makanan
            FROM menu
        `);
        
        res.json({
            success: true,
            data: stats[0] || { total: 0, coffee: 0, nonCoffee: 0, makanan: 0 }
        });
        
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📌 API Endpoints:`);
    console.log(`   GET http://localhost:${PORT}/api/test`);
    console.log(`   GET http://localhost:${PORT}/api/menu`);
    console.log(`   GET http://localhost:${PORT}/api/menu/stats`);
});