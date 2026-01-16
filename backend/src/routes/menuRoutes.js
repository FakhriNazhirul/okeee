const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET ALL MENU
router.get('/menus', async (req, res) => {
    try {
        console.log('📦 Fetching all menus from database...');
        
        // Query semua menu
        const [menus] = await db.query(`
            SELECT * FROM menus 
            ORDER BY created_at DESC
        `);
        
        console.log(`✅ Found ${menus.length} menus`);
        
        res.json({
            success: true,
            count: menus.length,
            data: menus
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menus',
            error: error.message
        });
    }
});

// GET MENU STATS
router.get('/menus/stats', async (req, res) => {
    try {
        console.log('📊 Fetching menu statistics...');
        
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as totalMenu,
                COUNT(CASE WHEN kategori = 'coffee' THEN 1 END) as menuCoffee,
                COUNT(CASE WHEN kategori = 'non-coffee' THEN 1 END) as nonCoffee,
                COUNT(CASE WHEN kategori = 'makanan' THEN 1 END) as menuMakanan
            FROM menus
        `);
        
        console.log('✅ Stats:', stats[0]);
        
        res.json({
            success: true,
            data: stats[0]
        });
        
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
});

// GET RECENT MENU (5 terbaru)
router.get('/menus/recent', async (req, res) => {
    try {
        console.log('🕐 Fetching recent menus...');
        
        const [menus] = await db.query(`
            SELECT * FROM menus 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        res.json({
            success: true,
            count: menus.length,
            data: menus
        });
        
    } catch (error) {
        console.error('❌ Recent menu error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent menus',
            error: error.message
        });
    }
});

module.exports = router;