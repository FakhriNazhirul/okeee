require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

// ========== FILE UPLOAD CONFIGURATION ==========
// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
}

// Konfigurasi multer untuk file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nama file: timestamp + original name (replace spaces)
        const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const uniqueName = Date.now() + '-' + safeName;
        cb(null, uniqueName);
    }
});

// Filter file (hanya gambar)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan (JPEG, JPG, PNG, GIF, WebP)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== SERVE STATIC FILES ==========
app.use('/uploads', express.static(uploadDir)); // Serve uploaded files
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve frontend

// ========== DATABASE CONNECTION ==========
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kopi_nusantara',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('🔌 Database Configuration:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user,
    port: dbConfig.port
});

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('❌ Error code:', err.code);
        console.error('❌ Error sqlMessage:', err.sqlMessage);
        process.exit(1);
    }
    
    console.log('✅ Connected to MySQL database:', dbConfig.database);
    
    // Setup database setelah terkoneksi
    setupDatabase(connection);
    
    // Release connection
    connection.release();
});

// ========== DATABASE SETUP FUNCTIONS ==========
function setupDatabase(connection) {
    console.log('🔧 Setting up database...');
    
    // 1. Cek apakah database ada, jika tidak buat
    const checkDBSql = `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`;
    
    connection.query(checkDBSql, [dbConfig.database], (err, results) => {
        if (err) {
            console.error('❌ Error checking database:', err.message);
            return;
        }
        
        if (results.length === 0) {
            console.log(`⚠️ Database '${dbConfig.database}' tidak ditemukan. Membuat...`);
            createDatabase(connection);
        } else {
            console.log(`✅ Database '${dbConfig.database}' ditemukan`);
            setupTable(connection);
        }
    });
}

function createDatabase(connection) {
    const createDBSql = `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
    
    connection.query(createDBSql, (err, result) => {
        if (err) {
            console.error('❌ Error creating database:', err.message);
            return;
        }
        
        console.log(`✅ Database '${dbConfig.database}' created successfully`);
        
        // Pilih database
        connection.changeUser({ database: dbConfig.database }, (err) => {
            if (err) {
                console.error('❌ Error selecting database:', err.message);
                return;
            }
            
            console.log(`✅ Using database '${dbConfig.database}'`);
            setupTable(connection);
        });
    });
}

function setupTable(connection) {
    console.log('🔧 Setting up table structure...');
    
    // SQL untuk membuat tabel jika belum ada
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS menu (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nama_menu VARCHAR(100) NOT NULL,
            deskripsi TEXT,
            harga DECIMAL(10,2) NOT NULL,
            gambar VARCHAR(255),
            kategori VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    connection.query(createTableSql, (err, result) => {
        if (err) {
            console.error('❌ Error creating table:', err.message);
            console.error('❌ SQL:', createTableSql);
            return;
        }
        
        console.log('✅ Table menu setup completed');
        
        // Cek struktur tabel
        checkTableStructure(connection);
    });
}

function checkTableStructure(connection) {
    console.log('🔍 Checking table structure...');
    
    const checkSql = `DESCRIBE menu`;
    
    connection.query(checkSql, (err, results) => {
        if (err) {
            console.error('❌ Error describing table:', err.message);
            return;
        }
        
        console.log('📋 Current table columns:');
        results.forEach(col => {
            console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Cek jika ada data contoh yang perlu ditambahkan
        addSampleDataIfEmpty(connection);
    });
}

function addSampleDataIfEmpty(connection) {
    const countSql = `SELECT COUNT(*) as count FROM menu`;
    
    connection.query(countSql, (err, results) => {
        if (err) {
            console.error('❌ Error counting menu items:', err.message);
            return;
        }
        
        if (results[0].count === 0) {
            console.log('📝 Adding sample data...');
            
            const sampleData = [
                ['Espresso', 'Kopi espresso klasik dengan rasa kuat', 25000, null, 'coffee'],
                ['Cappuccino', 'Espresso dengan susu steamed dan foam', 30000, null, 'coffee'],
                ['Latte', 'Espresso dengan lebih banyak susu steamed', 32000, null, 'coffee'],
                ['Green Tea Latte', 'Matcha dengan susu steamed', 28000, null, 'non-coffee'],
                ['Chocolate', 'Minuman cokelat panas', 25000, null, 'non-coffee'],
                ['Croissant', 'Croissant mentega renyah', 18000, null, 'makanan'],
                ['Sandwich', 'Sandwich isi ayam dan sayuran', 22000, null, 'makanan']
            ];
            
            const insertSql = `
                INSERT INTO menu (nama_menu, deskripsi, harga, gambar, kategori) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            let inserted = 0;
            sampleData.forEach((data, index) => {
                connection.query(insertSql, data, (err, result) => {
                    if (err) {
                        console.error(`❌ Error inserting sample ${data[0]}:`, err.message);
                    } else {
                        inserted++;
                        console.log(`✅ Added: ${data[0]}`);
                    }
                    
                    if (index === sampleData.length - 1) {
                        console.log(`📊 Total sample data added: ${inserted}/${sampleData.length}`);
                    }
                });
            });
        } else {
            console.log(`📊 Database already has ${results[0].count} menu items`);
        }
    });
}

// ========== ROUTES FOR FRONTEND PAGES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/dashboard.html'));
});

app.get('/admin/menu', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/menu.html'));
});

app.get('/admin/orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/orders.html'));
});

// ========== API ENDPOINTS ==========

// 1. TEST API ENDPOINT
app.get('/api/test', (req, res) => {
    console.log('✅ API Test endpoint accessed');
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// 2. FIX DATABASE ENDPOINT (untuk manual fix)
app.get('/api/fix-database', (req, res) => {
    console.log('🔧 Manual database fix requested');
    
    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database connection failed: ' + err.message
            });
        }
        
        setupDatabase(connection);
        connection.release();
        
        res.json({
            success: true,
            message: 'Database fix process started. Check server logs.'
        });
    });
});

// 3. GET ALL MENU
app.get('/api/menu', (req, res) => {
    console.log('📋 GET /api/menu');
    
    const sql = 'SELECT * FROM menu ORDER BY kategori, nama_menu';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error fetching menu:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message,
                code: err.code
            });
        }
        
        console.log(`✅ Found ${results.length} menu items`);
        res.json(results);
    });
});

// 4. CREATE NEW MENU ITEM WITH FILE UPLOAD - SIMPLIFIED VERSION
app.post('/api/menu', upload.single('gambar'), (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('➕ POST /api/menu - Creating new menu');
    
    // Debug request
    console.log('📦 Form fields:', Object.keys(req.body));
    console.log('📦 Nama Menu:', req.body.nama_menu);
    console.log('📦 Harga:', req.body.harga);
    console.log('📦 Kategori:', req.body.kategori);
    console.log('📸 File uploaded:', req.file ? req.file.filename : 'No file');
    
    // Parse data dari form
    const { nama_menu, deskripsi = '', harga, kategori } = req.body;
    
    // Validasi dasar
    if (!nama_menu || !harga || !kategori) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
            success: false,
            message: 'Nama menu, harga, dan kategori harus diisi'
        });
    }
    
    // Parse harga
    let hargaNumber;
    try {
        // Hapus karakter non-numeric kecuali titik
        const cleanHarga = harga.toString().replace(/[^\d.]/g, '');
        hargaNumber = parseFloat(cleanHarga);
        
        if (isNaN(hargaNumber) || hargaNumber <= 0) {
            throw new Error('Invalid price');
        }
    } catch (error) {
        console.log('❌ Invalid harga:', harga);
        return res.status(400).json({
            success: false,
            message: 'Harga harus berupa angka positif'
        });
    }
    
    // Handle file upload
    let gambarPath = null;
    if (req.file) {
        gambarPath = `/uploads/${req.file.filename}`;
        console.log('📸 File path:', gambarPath);
    }
    
    // SQL dengan hanya kolom yang pasti ada
    const sql = `
        INSERT INTO menu (nama_menu, deskripsi, harga, gambar, kategori) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [nama_menu, deskripsi || null, hargaNumber, gambarPath, kategori];
    
    console.log('📊 SQL:', sql);
    console.log('📊 Values:', values);
    
    // Eksekusi query
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('❌ Database insert error:', err.message);
            console.error('❌ Error code:', err.code);
            console.error('❌ SQL message:', err.sqlMessage);
            
            // Coba dengan SQL yang lebih sederhana (tanpa gambar)
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ Trying fallback SQL without gambar column...');
                
                const fallbackSql = `
                    INSERT INTO menu (nama_menu, deskripsi, harga, kategori) 
                    VALUES (?, ?, ?, ?)
                `;
                
                const fallbackValues = [nama_menu, deskripsi || null, hargaNumber, kategori];
                
                db.query(fallbackSql, fallbackValues, (fallbackErr, fallbackResult) => {
                    if (fallbackErr) {
                        console.error('❌ Fallback also failed:', fallbackErr.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Database structure error. Please run /api/fix-database first.',
                            details: fallbackErr.message
                        });
                    }
                    
                    console.log('✅ Menu created without image');
                    console.log('✅ Insert ID:', fallbackResult.insertId);
                    console.log('='.repeat(60) + '\n');
                    
                    res.json({
                        success: true,
                        id: fallbackResult.insertId,
                        message: 'Menu berhasil ditambahkan (tanpa gambar)'
                    });
                });
                
                return;
            }
            
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message,
                code: err.code
            });
        }
        
        console.log('✅ Menu created successfully!');
        console.log('✅ Insert ID:', result.insertId);
        console.log('='.repeat(60) + '\n');
        
        res.json({
            success: true,
            id: result.insertId,
            message: 'Menu berhasil ditambahkan!',
            gambar: gambarPath
        });
    });
});

// 5. UPDATE MENU ITEM
app.put('/api/menu/:id', upload.single('gambar'), (req, res) => {
    const { id } = req.params;
    console.log(`🔄 PUT /api/menu/${id}`);
    
    const { nama_menu, deskripsi = '', harga, kategori, gambar_existing } = req.body;
    
    // Validasi
    if (!nama_menu || !harga || !kategori) {
        return res.status(400).json({
            success: false,
            message: 'Nama menu, harga, dan kategori harus diisi'
        });
    }
    
    // Parse harga
    let hargaNumber;
    try {
        const cleanHarga = harga.toString().replace(/[^\d.]/g, '');
        hargaNumber = parseFloat(cleanHarga);
        
        if (isNaN(hargaNumber) || hargaNumber <= 0) {
            throw new Error('Invalid price');
        }
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Harga harus berupa angka positif'
        });
    }
    
    // Handle file upload
    let gambarPath = gambar_existing || null;
    if (req.file) {
        gambarPath = `/uploads/${req.file.filename}`;
        console.log('📸 New file:', gambarPath);
    }
    
    // SQL update
    let sql, values;
    
    if (gambarPath !== null) {
        sql = `UPDATE menu SET nama_menu = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ? WHERE id = ?`;
        values = [nama_menu, deskripsi, hargaNumber, gambarPath, kategori, id];
    } else {
        sql = `UPDATE menu SET nama_menu = ?, deskripsi = ?, harga = ?, kategori = ? WHERE id = ?`;
        values = [nama_menu, deskripsi, hargaNumber, kategori, id];
    }
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('❌ Update error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu tidak ditemukan'
            });
        }
        
        console.log(`✅ Menu ${id} updated`);
        
        res.json({
            success: true,
            message: 'Menu berhasil diupdate',
            gambar: gambarPath
        });
    });
});

// 6. DELETE MENU ITEM
app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/menu/${id}`);
    
    const sql = 'DELETE FROM menu WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Delete error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu tidak ditemukan'
            });
        }
        
        console.log(`✅ Menu ${id} deleted`);
        
        res.json({
            success: true,
            message: 'Menu berhasil dihapus'
        });
    });
});

// 7. GET MENU STATISTICS
app.get('/api/menu/stats', (req, res) => {
    console.log('📊 GET /api/menu/stats');
    
    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN kategori = 'coffee' THEN 1 ELSE 0 END) as coffee,
            SUM(CASE WHEN kategori = 'non-coffee' THEN 1 ELSE 0 END) as nonCoffee,
            SUM(CASE WHEN kategori = 'makanan' THEN 1 ELSE 0 END) as makanan
        FROM menu
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Stats error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        const stats = results[0] || { total: 0, coffee: 0, nonCoffee: 0, makanan: 0 };
        console.log('📈 Stats:', stats);
        
        res.json({
            success: true,
            data: stats
        });
    });
});

// 8. GET RECENT MENU
app.get('/api/menu/recent', (req, res) => {
    console.log('🕐 GET /api/menu/recent');
    
    const sql = 'SELECT * FROM menu ORDER BY created_at DESC LIMIT 5';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Recent menu error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});

// 9. CHECK DATABASE STATUS
app.get('/api/db-status', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Database connection failed',
                error: err.message
            });
        }
        
        // Cek tabel
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM menu) as menu_count,
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = 'menu') as table_exists
        `;
        
        connection.query(sql, [dbConfig.database], (err, results) => {
            connection.release();
            
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database query failed',
                    error: err.message
                });
            }
            
            const result = results[0];
            
            res.json({
                success: true,
                database: dbConfig.database,
                table_exists: result.table_exists > 0,
                menu_count: result.menu_count,
                upload_dir: uploadDir,
                upload_dir_exists: fs.existsSync(uploadDir)
            });
        });
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File terlalu besar. Maksimal 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    } else if (err) {
        console.error('❌ Server error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error: ' + err.message
        });
    }
    next();
});

// ========== CATCH ALL ROUTE ==========
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint tidak ditemukan'
        });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║     🚀 KOPI NUSANTARA BACKEND API v3.0           ║
    ╚═══════════════════════════════════════════════════╝
    
    📍 Server: http://localhost:${PORT}
    📊 Database: ${dbConfig.database}
    
    📁 Upload Directory: ${uploadDir}
    
    🔧 AUTO-SETUP FEATURES:
    • Auto-create database if missing
    • Auto-create table with correct structure
    • Auto-add sample data if empty
    • Fallback SQL if column missing
    
    🔌 DEBUG ENDPOINTS:
    • GET  /api/test          → Test API
    • GET  /api/db-status     → Database status
    • GET  /api/fix-database  → Manual database fix
    
    📋 MAIN ENDPOINTS:
    • GET    /api/menu        → All menu
    • POST   /api/menu        → Add menu (+upload)
    • PUT    /api/menu/:id    → Update menu
    • DELETE /api/menu/:id    → Delete menu
    • GET    /api/menu/stats  → Statistics
    • GET    /api/menu/recent → Recent menu
    
    👨‍💼 ADMIN PANEL:
    • Dashboard:     http://localhost:${PORT}/admin/dashboard
    • Menu Manager:  http://localhost:${PORT}/admin/menu
    
    ✅ Server ready! Press Ctrl+C to stop.
    `);
});