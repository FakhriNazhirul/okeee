// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Helper function untuk mendapatkan URL gambar
    const getMenuImageUrl = (gambar) => {
        if (!gambar || gambar === 'null' || gambar === 'undefined' || gambar === '' || gambar === 'NULL') {
            return '/assets/default-menu.png';
        }
        
        if (gambar.startsWith('http://') || gambar.startsWith('https://') || gambar.startsWith('data:')) {
            return gambar;
        }
        
        if (gambar.startsWith('/uploads/')) {
            return gambar;
        }
        
        return `/uploads/${gambar}`;
    };

    // 1. CREATE NEW ORDER/TRANSACTION
    router.post('/orders', (req, res) => {
        console.log('🛒 POST /api/orders - Creating new order');
        console.log('📦 Order data:', req.body);
        
        const { 
            id_menu, 
            nama_pelanggan, 
            jumlah, 
            total_harga, 
            catatan = '' 
        } = req.body;
        
        // Validasi
        if (!id_menu || !nama_pelanggan || !jumlah || !total_harga) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'ID menu, nama pelanggan, jumlah, dan total harga harus diisi'
            });
        }
        
        const sql = `
            INSERT INTO transaksi (id_menu, nama_pelanggan, jumlah, total_harga, catatan, tanggal) 
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [id_menu, nama_pelanggan, jumlah, total_harga, catatan];
        
        console.log('📊 SQL values:', values);
        
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('❌ Database insert error:', err.message);
                console.error('❌ Error code:', err.code);
                
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            console.log('✅ Order created successfully!');
            console.log('✅ Insert ID:', result.insertId);
            
            // Get the newly created transaction
            const getSql = `
                SELECT t.*, m.nama_menu, m.harga as harga_satuan 
                FROM transaksi t 
                JOIN menu m ON t.id_menu = m.id 
                WHERE t.id_transaksi = ?
            `;
            
            db.query(getSql, [result.insertId], (err, results) => {
                if (err) {
                    console.error('❌ Error fetching created order:', err.message);
                    
                    return res.json({
                        success: true,
                        id: result.insertId,
                        message: 'Pesanan berhasil dibuat!'
                    });
                }
                
                const newOrder = results[0];
                
                res.json({
                    success: true,
                    id: newOrder.id_transaksi,
                    order_number: `ORD${newOrder.id_transaksi.toString().padStart(6, '0')}`,
                    data: newOrder,
                    message: 'Pesanan berhasil dibuat!'
                });
            });
        });
    });

    // 2. GET ALL TRANSACTIONS
    router.get('/orders', (req, res) => {
        console.log('📋 GET /api/orders - Fetching all transactions');
        
        const sql = `
            SELECT 
                t.id_transaksi,
                t.id_menu,
                t.nama_pelanggan,
                t.jumlah,
                t.total_harga,
                t.catatan,
                t.tanggal,
                m.nama_menu,
                m.harga as harga_satuan,
                m.gambar,
                m.kategori
            FROM transaksi t 
            JOIN menu m ON t.id_menu = m.id 
            ORDER BY t.tanggal DESC
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('❌ Error fetching orders:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            console.log(`✅ Found ${results.length} transactions`);
            
            // Transform data for frontend
            const transformedResults = results.map(order => {
                // Generate order number
                const orderNumber = `ORD${order.id_transaksi.toString().padStart(6, '0')}`;
                
                return {
                    id: order.id_transaksi,
                    order_number: orderNumber,
                    id_menu: order.id_menu,
                    menu_name: order.nama_menu,
                    menu_price: order.harga_satuan,
                    quantity: order.jumlah,
                    total_amount: order.total_harga,
                    customer_name: order.nama_pelanggan,
                    order_note: order.catatan || '',
                    order_date: order.tanggal,
                    status: 'completed',
                    gambar: getMenuImageUrl(order.gambar),
                    kategori: order.kategori
                };
            });
            
            res.json({
                success: true,
                data: transformedResults
            });
        });
    });

    // 3. GET TRANSACTION BY ID
    router.get('/orders/:id', (req, res) => {
        const { id } = req.params;
        console.log(`📋 GET /api/orders/${id}`);
        
        const sql = `
            SELECT 
                t.id_transaksi,
                t.id_menu,
                t.nama_pelanggan,
                t.jumlah,
                t.total_harga,
                t.catatan,
                t.tanggal,
                m.nama_menu,
                m.harga as harga_satuan,
                m.gambar,
                m.kategori,
                m.deskripsi
            FROM transaksi t 
            JOIN menu m ON t.id_menu = m.id 
            WHERE t.id_transaksi = ?
        `;
        
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('❌ Error fetching order:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaksi tidak ditemukan'
                });
            }
            
            const order = results[0];
            const orderNumber = `ORD${order.id_transaksi.toString().padStart(6, '0')}`;
            
            const transformedOrder = {
                id: order.id_transaksi,
                order_number: orderNumber,
                id_menu: order.id_menu,
                menu_name: order.nama_menu,
                menu_price: order.harga_satuan,
                quantity: order.jumlah,
                total_amount: order.total_harga,
                customer_name: order.nama_pelanggan,
                order_note: order.catatan || '',
                order_date: order.tanggal,
                status: 'completed',
                gambar: getMenuImageUrl(order.gambar),
                kategori: order.kategori,
                deskripsi: order.deskripsi
            };
            
            res.json({
                success: true,
                data: transformedOrder
            });
        });
    });

    // 4. GET TRANSACTION STATISTICS
    router.get('/orders/stats', (req, res) => {
        console.log('📊 GET /api/orders/stats');
        
        const sql = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_harga) as total_revenue,
                COUNT(DISTINCT DATE(tanggal)) as days_with_orders,
                MAX(tanggal) as last_order_date
            FROM transaksi
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('❌ Error fetching stats:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            const stats = results && results[0] ? {
                total_orders: results[0].total_orders || 0,
                total_revenue: results[0].total_revenue || 0,
                days_with_orders: results[0].days_with_orders || 0,
                last_order_date: results[0].last_order_date
            } : {
                total_orders: 0,
                total_revenue: 0,
                days_with_orders: 0,
                last_order_date: null
            };
            
            console.log('📊 Transaction Statistics:', stats);
            
            res.json({
                success: true,
                data: stats
            });
        });
    });

    // 5. DELETE TRANSACTION
    router.delete('/orders/:id', (req, res) => {
        const { id } = req.params;
        console.log(`🗑️ DELETE /api/orders/${id}`);
        
        // Check if transaction exists
        const checkSql = 'SELECT * FROM transaksi WHERE id_transaksi = ?';
        
        db.query(checkSql, [id], (err, results) => {
            if (err) {
                console.error('❌ Error checking transaction:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaksi tidak ditemukan'
                });
            }
            
            const transactionToDelete = results[0];
            
            // Delete from database
            const deleteSql = 'DELETE FROM transaksi WHERE id_transaksi = ?';
            
            db.query(deleteSql, [id], (err, result) => {
                if (err) {
                    console.error('❌ Delete error:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error: ' + err.message
                    });
                }
                
                console.log(`✅ Transaction ${id} deleted`);
                
                res.json({
                    success: true,
                    message: 'Transaksi berhasil dihapus',
                    deleted_item: {
                        id: transactionToDelete.id_transaksi,
                        customer_name: transactionToDelete.nama_pelanggan,
                        total_harga: transactionToDelete.total_harga
                    }
                });
            });
        });
    });

    // 6. FILTER TRANSACTIONS BY DATE
    router.get('/orders/filter', (req, res) => {
        console.log('🔍 GET /api/orders/filter');
        console.log('📋 Query params:', req.query);
        
        const { date } = req.query;
        
        let sql = `
            SELECT 
                t.id_transaksi,
                t.id_menu,
                t.nama_pelanggan,
                t.jumlah,
                t.total_harga,
                t.catatan,
                t.tanggal,
                m.nama_menu,
                m.harga as harga_satuan,
                m.gambar,
                m.kategori
            FROM transaksi t 
            JOIN menu m ON t.id_menu = m.id 
        `;
        
        const values = [];
        
        if (date) {
            sql += ' WHERE DATE(t.tanggal) = ?';
            values.push(date);
        }
        
        sql += ' ORDER BY t.tanggal DESC';
        
        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('❌ Error filtering orders:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            console.log(`✅ Found ${results.length} transactions for filter`);
            
            const transformedResults = results.map(order => {
                const orderNumber = `ORD${order.id_transaksi.toString().padStart(6, '0')}`;
                
                return {
                    id: order.id_transaksi,
                    order_number: orderNumber,
                    id_menu: order.id_menu,
                    menu_name: order.nama_menu,
                    menu_price: order.harga_satuan,
                    quantity: order.jumlah,
                    total_amount: order.total_harga,
                    customer_name: order.nama_pelanggan,
                    order_note: order.catatan || '',
                    order_date: order.tanggal,
                    status: 'completed',
                    gambar: getMenuImageUrl(order.gambar),
                    kategori: order.kategori
                };
            });
            
            res.json({
                success: true,
                data: transformedResults
            });
        });
    });

    return router;
};