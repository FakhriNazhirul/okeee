require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

// ========== FILE UPLOAD CONFIGURATION ==========
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const uniqueName = Date.now() + '-' + safeName;
        cb(null, uniqueName);
    }
});

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

app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware untuk parse JSON body - TAMBAHKAN INI
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ========== AUTHENTICATION MIDDLEWARE ==========
function authenticateAdmin(req, res, next) {
    // Untuk demo, kita biarkan semua akses ke halaman HTML
    // Validasi login dilakukan di frontend melalui JavaScript
    // Di produksi, gunakan session atau JWT yang lebih aman
    
    console.log(`🔐 Accessing admin route: ${req.path}`);
    
    // Jika ini adalah request untuk halaman admin (.html atau /admin/*)
    if (req.path.startsWith('/admin') && !req.path.startsWith('/api/')) {
        console.log(`📄 Admin page access: ${req.path}`);
        // Biarkan akses ke halaman HTML, frontend akan handle login check
        return next();
    }
    
    // Untuk API endpoints, lanjutkan
    next();
}

// Terapkan middleware ke semua route admin
app.use('/admin*', authenticateAdmin);

// ========== SERVE STATIC FILES ==========
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, '../frontend')));

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

console.log('🔌 Connecting to database:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user
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
    console.log('📊 Table structure will use existing database schema');
    
    connection.release();
});

// ========== HELPER FUNCTIONS ==========
function getMenuImageUrl(gambar) {
    console.log('🖼️ Processing image URL for:', gambar);
    
    if (!gambar || gambar === 'null' || gambar === 'undefined' || gambar === '' || gambar === 'NULL') {
        console.log('🖼️ No image provided, using default');
        return '/assets/default-menu.png';
    }
    
    // Jika gambar sudah berupa URL lengkap
    if (gambar.startsWith('http://') || gambar.startsWith('https://') || gambar.startsWith('data:')) {
        console.log('🖼️ Already full URL:', gambar);
        return gambar;
    }
    
    // Jika gambar dimulai dengan /uploads
    if (gambar.startsWith('/uploads/')) {
        console.log('🖼️ Uploads path:', gambar);
        // Periksa apakah file benar-benar ada
        const filePath = path.join(__dirname, '../frontend', gambar);
        if (fs.existsSync(filePath)) {
            return gambar;
        } else {
            console.log('⚠️ Image file not found:', filePath);
            return '/assets/default-menu.png';
        }
    }
    
    // Jika gambar hanya nama file (tanpa path)
    if (gambar && !gambar.includes('/') && gambar.includes('.')) {
        console.log('🖼️ Filename only, adding /uploads/ path:', gambar);
        const filePath = path.join(uploadDir, gambar);
        if (fs.existsSync(filePath)) {
            return `/uploads/${gambar}`;
        } else {
            console.log('⚠️ Image file not found in uploads:', filePath);
            return '/assets/default-menu.png';
        }
    }
    
    // Default fallback
    console.log('🖼️ Using default image');
    return '/assets/default-menu.png';
}

// ========== API ENDPOINTS ==========

// 1. GET ALL MENU (sesuai dengan struktur database)
app.get('/api/menu', (req, res) => {
    console.log('📋 GET /api/menu');
    
    const sql = `
        SELECT 
            id,
            nama_menu,
            deskripsi,
            harga,
            gambar,
            kategori
        FROM menu 
        ORDER BY kategori, nama_menu
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error fetching menu:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message,
                code: err.code
            });
        }
        
        console.log(`✅ Found ${results.length} menu items from database`);
        
        // Debug: Tampilkan data mentah
        console.log('📊 Raw data from database:');
        results.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.nama_menu} - Gambar: "${item.gambar}"`);
        });
        
        // Transform data untuk frontend
        const transformedResults = results.map(item => {
            const imageUrl = getMenuImageUrl(item.gambar);
            console.log(`  🖼️ ${item.nama_menu}: ${item.gambar} → ${imageUrl}`);
            
            return {
                id: item.id,
                nama_menu: item.nama_menu,
                deskripsi: item.deskripsi,
                harga: Number(item.harga),
                gambar: imageUrl,
                kategori: item.kategori,
                tersedia: true,
                popular: false
            };
        });
        
        res.json(transformedResults);
    });
});

// 2. GET MENU BY CATEGORY
app.get('/api/menu/kategori/:kategori', (req, res) => {
    const { kategori } = req.params;
    console.log(`📋 GET /api/menu/kategori/${kategori}`);
    
    const validCategories = ['coffee', 'non-coffee', 'makanan'];
    if (!validCategories.includes(kategori)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori tidak valid. Gunakan: coffee, non-coffee, atau makanan'
        });
    }
    
    const sql = `
        SELECT 
            id,
            nama_menu,
            deskripsi,
            harga,
            gambar,
            kategori
        FROM menu 
        WHERE kategori = ?
        ORDER BY nama_menu
    `;
    
    db.query(sql, [kategori], (err, results) => {
        if (err) {
            console.error('❌ Error fetching menu by category:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        console.log(`✅ Found ${results.length} items in category: ${kategori}`);
        
        const transformedResults = results.map(item => ({
            id: item.id,
            nama_menu: item.nama_menu,
            deskripsi: item.deskripsi,
            harga: Number(item.harga),
            gambar: getMenuImageUrl(item.gambar),
            kategori: item.kategori,
            tersedia: true,
            popular: false
        }));
        
        res.json(transformedResults);
    });
});

// 3. GET SINGLE MENU BY ID
app.get('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    console.log(`📋 GET /api/menu/${id}`);
    
    const sql = `
        SELECT 
            id,
            nama_menu,
            deskripsi,
            harga,
            gambar,
            kategori
        FROM menu 
        WHERE id = ?
    `;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching menu by ID:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu tidak ditemukan'
            });
        }
        
        const item = results[0];
        const transformedItem = {
            id: item.id,
            nama_menu: item.nama_menu,
            deskripsi: item.deskripsi,
            harga: Number(item.harga),
            gambar: getMenuImageUrl(item.gambar),
            kategori: item.kategori,
            tersedia: true,
            popular: false
        };
        
        res.json(transformedItem);
    });
});

// Serve default image
app.get('/assets/default-menu.png', (req, res) => {
    const defaultImagePath = path.join(__dirname, '../frontend/assets/default-menu.png');
    
    if (fs.existsSync(defaultImagePath)) {
        res.sendFile(defaultImagePath);
    } else {
        // Buat gambar default sederhana jika tidak ada
        const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f0f0f0"/>
            <rect x="50" y="50" width="300" height="200" fill="#8b4513" opacity="0.1"/>
            <circle cx="200" cy="150" r="50" fill="#8b4513" opacity="0.3"/>
            <text x="200" y="150" font-family="Arial" font-size="20" fill="#666" text-anchor="middle" dy=".3em">No Image</text>
            <text x="200" y="180" font-family="Arial" font-size="14" fill="#888" text-anchor="middle">Kopi Nusantara</text>
        </svg>`;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    }
});

// ========== ROUTES FOR FRONTEND PAGES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Route untuk logout
app.get('/logout', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Logout - Kopi Nusantara</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .logout-container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                }
                .logout-icon {
                    font-size: 60px;
                    color: #8b4513;
                    margin-bottom: 20px;
                }
                h2 {
                    color: #8b4513;
                    margin-bottom: 15px;
                }
                p {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #8b4513;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 5px;
                    transition: background 0.3s;
                }
                .btn:hover {
                    background: #6d3410;
                }
                .btn-secondary {
                    background: #6c757d;
                }
                .btn-secondary:hover {
                    background: #5a6268;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            <div class="logout-container">
                <div class="logout-icon">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h2>Logout Berhasil</h2>
                <p>Anda telah berhasil logout dari panel admin Kopi Nusantara.</p>
                <p>Untuk keamanan, silakan tutup browser atau kembali ke halaman utama.</p>
                
                <div style="margin-top: 30px;">
                    <a href="/" class="btn">
                        <i class="fas fa-home"></i> Kembali ke Beranda
                    </a>
                    <a href="login.html" class="btn btn-secondary">
                        <i class="fas fa-sign-in-alt"></i> Login Kembali
                    </a>
                </div>
            </div>
            
            <script>
                // Hapus semua data autentikasi saat halaman ini dimuat
                document.addEventListener('DOMContentLoaded', function() {
                    localStorage.removeItem('auth');
                    sessionStorage.removeItem('auth');
                    
                    // Clear any cookies
                    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    
                    console.log('✅ Logged out successfully');
                });
            </script>
        </body>
        </html>
    `);
});

// ========== ROUTE DENGAN .html EXTENSION ==========
// Route untuk dashboard.html - TAMBAHKAN VALIDASI
app.get('/admin/dashboard.html', (req, res) => {
    const dashboardPath = path.join(__dirname, '../frontend/admin/dashboard.html');
    
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        // Fallback dashboard
        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard Admin - Kopi Nusantara</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { background: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                    .login-check { 
                        position: fixed; 
                        top: 0; left: 0; 
                        width: 100%; height: 100%; 
                        background: white; 
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .spinner-border { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div id="loginCheck" class="login-check">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h4>Memeriksa status login...</h4>
                    <p class="text-muted">Harap tunggu sebentar</p>
                </div>
                
                <div id="dashboardContent" style="display: none;">
                    <!-- Konten dashboard akan ditampilkan setelah login valid -->
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-md-2 p-0 sidebar" style="background: #3d2c2e; color: white; min-height: 100vh;">
                                <div class="logo" style="padding: 20px; text-align: center; border-bottom: 1px solid #4a3a3c;">
                                    <h4><i class="fas fa-coffee"></i> Kopi Nusantara</h4>
                                    <small>Admin Panel</small>
                                </div>
                                <a href="/admin/dashboard.html" style="color: #ddd; text-decoration: none; padding: 12px 20px; display: block; background: #8b4513; color: white;">
                                    <i class="fas fa-tachometer-alt"></i> Dashboard
                                </a>
                                <a href="/admin/menu.html" style="color: #ddd; text-decoration: none; padding: 12px 20px; display: block;">
                                    <i class="fas fa-utensils"></i> Menu Management
                                </a>
                                <a href="/admin/orders.html" style="color: #ddd; text-decoration: none; padding: 12px 20px; display: block;">
                                    <i class="fas fa-shopping-cart"></i> Orders
                                </a>
                                <a href="/" style="color: #ddd; text-decoration: none; padding: 12px 20px; display: block;">
                                    <i class="fas fa-home"></i> Back to Website
                                </a>
                                <a href="/logout" style="color: #ddd; text-decoration: none; padding: 12px 20px; display: block; margin-top: 50px;">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </a>
                            </div>
                            
                            <div class="col-md-10 main-content" style="padding: 20px;">
                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
                                    <div class="user-info">
                                        <span id="adminUsername">Welcome, Admin</span>
                                    </div>
                                </div>
                                
                                <!-- Stats Cards -->
                                <div class="row mb-4">
                                    <div class="col-md-3">
                                        <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                            <div class="stat-number" id="totalMenu" style="font-size: 2rem; font-weight: bold; color: #8b4513;">0</div>
                                            <div class="stat-label" style="color: #666; font-size: 0.9rem;">Total Menu</div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                            <div class="stat-number" id="totalCoffee" style="font-size: 2rem; font-weight: bold; color: #8b4513;">0</div>
                                            <div class="stat-label" style="color: #666; font-size: 0.9rem;">Coffee Items</div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                            <div class="stat-number" id="totalNonCoffee" style="font-size: 2rem; font-weight: bold; color: #8b4513;">0</div>
                                            <div class="stat-label" style="color: #666; font-size: 0.9rem;">Non-Coffee Items</div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                            <div class="stat-number" id="totalFood" style="font-size: 2rem; font-weight: bold; color: #8b4513;">0</div>
                                            <div class="stat-label" style="color: #666; font-size: 0.9rem;">Food Items</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle"></i> Selamat datang di Dashboard Admin Kopi Nusantara
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    // Fungsi untuk memeriksa login
                    function checkAdminLogin() {
                        const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
                        
                        if (!authData) {
                            // Tidak ada data login, redirect ke login page
                            window.location.href = '/login';
                            return;
                        }
                        
                        try {
                            const auth = JSON.parse(authData);
                            
                            if (!auth.isLoggedIn || auth.role !== 'admin') {
                                // Tidak valid, redirect ke login
                                window.location.href = '/login';
                                return;
                            }
                            
                            // Cek expiry time (1 jam)
                            if (auth.loginTime) {
                                const loginTime = new Date(auth.loginTime);
                                const currentTime = new Date();
                                const timeDiff = (currentTime - loginTime) / (1000 * 60 * 60); // dalam jam
                                
                                if (timeDiff >= 1) { // Session expired
                                    localStorage.removeItem('auth');
                                    sessionStorage.removeItem('auth');
                                    window.location.href = '/login';
                                    return;
                                }
                            }
                            
                            // Login valid, tampilkan dashboard
                            document.getElementById('loginCheck').style.display = 'none';
                            document.getElementById('dashboardContent').style.display = 'block';
                            
                            // Tampilkan username
                            if (auth.username) {
                                document.getElementById('adminUsername').textContent = 'Welcome, ' + auth.username;
                            }
                            
                            // Load dashboard stats
                            loadDashboardStats();
                            
                        } catch (error) {
                            console.error('Error checking login:', error);
                            window.location.href = '/login';
                        }
                    }
                    
                    // Load dashboard stats
                    async function loadDashboardStats() {
                        try {
                            const res = await fetch('/api/menu/count');
                            if (res.ok) {
                                const data = await res.json();
                                document.getElementById('totalMenu').textContent = data.total || 0;
                            }
                        } catch (error) {
                            console.error('Error loading stats:', error);
                        }
                    }
                    
                    // Check login saat halaman dimuat
                    document.addEventListener('DOMContentLoaded', checkAdminLogin);
                </script>
            </body>
            </html>
        `);
    }
});

// Route untuk menu.html
app.get('/admin/menu.html', (req, res) => {
    const menuPath = path.join(__dirname, '../frontend/admin/menu.html');
    
    if (fs.existsSync(menuPath)) {
        res.sendFile(menuPath);
    } else {
        console.log('⚠️ Menu file not found, using existing route...');
        res.redirect('/admin/menu');
    }
});

// Route untuk orders.html
app.get('/admin/orders.html', (req, res) => {
    const ordersPath = path.join(__dirname, '../frontend/admin/orders.html');
    
    if (fs.existsSync(ordersPath)) {
        res.sendFile(ordersPath);
    } else {
        console.log('⚠️ Orders file not found, using existing route...');
        res.redirect('/admin/orders');
    }
});

// ========== REDIRECT UNTUK ROUTE TANPA .html ==========
app.get('/admin/dashboard', (req, res) => {
    res.redirect('/admin/dashboard.html');
});

app.get('/admin/menu', (req, res) => {
    res.redirect('/admin/menu.html');
});

app.get('/admin/orders', (req, res) => {
    res.redirect('/admin/orders.html');
});

// 4. CREATE NEW MENU ITEM
app.post('/api/menu', upload.single('gambar'), (req, res) => {
    console.log('➕ POST /api/menu - Creating new menu');
    
    console.log('📦 Form fields:', req.body);
    console.log('📸 File uploaded:', req.file ? req.file.filename : 'No file');
    
    const { nama_menu, deskripsi = '', harga, kategori } = req.body;
    
    // Validasi
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
    let gambar = null;
    if (req.file) {
        gambar = req.file.filename; // Hanya simpan nama file
    }
    
    const sql = `
        INSERT INTO menu (nama_menu, deskripsi, harga, gambar, kategori) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [nama_menu, deskripsi, hargaNumber, gambar, kategori];
    
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
        
        console.log('✅ Menu created successfully!');
        console.log('✅ Insert ID:', result.insertId);
        
        // Get the newly created item
        const getSql = 'SELECT * FROM menu WHERE id = ?';
        db.query(getSql, [result.insertId], (err, results) => {
            if (err) {
                console.error('❌ Error fetching created menu:', err.message);
                
                return res.json({
                    success: true,
                    id: result.insertId,
                    message: 'Menu berhasil ditambahkan!'
                });
            }
            
            const newItem = results[0];
            const transformedItem = {
                id: newItem.id,
                nama_menu: newItem.nama_menu,
                deskripsi: newItem.deskripsi,
                harga: Number(newItem.harga),
                gambar: getMenuImageUrl(newItem.gambar),
                kategori: newItem.kategori,
                tersedia: true,
                popular: false
            };
            
            res.json({
                success: true,
                id: result.insertId,
                data: transformedItem,
                message: 'Menu berhasil ditambahkan!'
            });
        });
    });
});

// 5. UPDATE MENU ITEM
app.put('/api/menu/:id', upload.single('gambar'), (req, res) => {
    const { id } = req.params;
    console.log(`🔄 PUT /api/menu/${id}`);
    
    const { nama_menu, deskripsi = '', harga, kategori } = req.body;
    
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
    
    // Check if menu exists
    const checkSql = 'SELECT * FROM menu WHERE id = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            console.error('❌ Error checking menu:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu tidak ditemukan'
            });
        }
        
        const existingItem = results[0];
        
        // Handle file upload
        let gambar = existingItem.gambar;
        if (req.file) {
            gambar = req.file.filename;
        }
        
        // SQL update
        const updateSql = `
            UPDATE menu 
            SET nama_menu = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ?
            WHERE id = ?
        `;
        
        const values = [nama_menu, deskripsi, hargaNumber, gambar, kategori, id];
        
        db.query(updateSql, values, (err, result) => {
            if (err) {
                console.error('❌ Update error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            console.log(`✅ Menu ${id} updated`);
            
            // Get updated item
            db.query('SELECT * FROM menu WHERE id = ?', [id], (err, updatedResults) => {
                if (err) {
                    console.error('❌ Error fetching updated menu:', err.message);
                    
                    return res.json({
                        success: true,
                        message: 'Menu berhasil diupdate!'
                    });
                }
                
                const updatedItem = updatedResults[0];
                const transformedItem = {
                    id: updatedItem.id,
                    nama_menu: updatedItem.nama_menu,
                    deskripsi: updatedItem.deskripsi,
                    harga: Number(updatedItem.harga),
                    gambar: getMenuImageUrl(updatedItem.gambar),
                    kategori: updatedItem.kategori,
                    tersedia: true,
                    popular: false
                };
                
                res.json({
                    success: true,
                    data: transformedItem,
                    message: 'Menu berhasil diupdate!'
                });
            });
        });
    });
});

// 6. DELETE MENU ITEM
app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/menu/${id}`);
    
    // Check if menu exists
    const checkSql = 'SELECT * FROM menu WHERE id = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            console.error('❌ Error checking menu:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu tidak ditemukan'
            });
        }
        
        const itemToDelete = results[0];
        
        // Delete from database
        const deleteSql = 'DELETE FROM menu WHERE id = ?';
        
        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('❌ Delete error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            console.log(`✅ Menu ${id} deleted: ${itemToDelete.nama_menu}`);
            
            res.json({
                success: true,
                message: 'Menu berhasil dihapus',
                deletedItem: {
                    id: itemToDelete.id,
                    nama_menu: itemToDelete.nama_menu
                }
            });
        });
    });
});

// 7. SEARCH MENU
app.get('/api/menu/search', (req, res) => {
    const { q } = req.query;
    console.log(`🔍 GET /api/menu/search?q=${q}`);
    
    if (!q || q.trim() === '') {
        return res.json([]);
    }
    
    const searchTerm = `%${q}%`;
    const sql = `
        SELECT 
            id,
            nama_menu,
            deskripsi,
            harga,
            gambar,
            kategori
        FROM menu 
        WHERE nama_menu LIKE ? OR deskripsi LIKE ?
        ORDER BY nama_menu
    `;
    
    db.query(sql, [searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('❌ Search error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        console.log(`✅ Found ${results.length} items for search: ${q}`);
        
        const transformedResults = results.map(item => ({
            id: item.id,
            nama_menu: item.nama_menu,
            deskripsi: item.deskripsi,
            harga: Number(item.harga),
            gambar: getMenuImageUrl(item.gambar),
            kategori: item.kategori,
            tersedia: true,
            popular: false
        }));
        
        res.json(transformedResults);
    });
});

// 8. GET CATEGORIES
app.get('/api/menu/kategori', (req, res) => {
    console.log('📊 GET /api/menu/kategori');
    
    const sql = `
        SELECT DISTINCT kategori 
        FROM menu 
        WHERE kategori IS NOT NULL AND kategori != ''
        ORDER BY kategori
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error fetching categories:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        const categories = results.map(r => r.kategori);
        console.log(`✅ Found ${categories.length} categories:`, categories);
        
        res.json(categories);
    });
});

// 9. GET MENU STATISTICS - FIXED VERSION
app.get('/api/menu/stats', (req, res) => {
    console.log('📈 GET /api/menu/stats');
    
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
        
        const stats = results && results[0] ? {
            total: results[0].total || 0,
            coffee: results[0].coffee || 0,
            nonCoffee: results[0].nonCoffee || 0,
            makanan: results[0].makanan || 0
        } : {
            total: 0,
            coffee: 0,
            nonCoffee: 0,
            makanan: 0
        };
        
        console.log('📊 Statistics:', stats);
        
        res.json({
            success: true,
            data: stats
        });
    });
});

// Endpoint untuk mendapatkan count total saja
app.get('/api/menu/count', (req, res) => {
    console.log('🔢 GET /api/menu/count');
    
    const sql = 'SELECT COUNT(*) as total FROM menu';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Count error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        const total = results[0] ? results[0].total : 0;
        
        res.json({
            success: true,
            total: total
        });
    });
});

// 10. TEST ENDPOINT
app.get('/api/test', (req, res) => {
    console.log('✅ API Test endpoint accessed');
    
    // Test database connection
    db.getConnection((err, connection) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Database connection failed',
                error: err.message
            });
        }
        
        // Get menu count
        connection.query('SELECT COUNT(*) as count FROM menu', (err, results) => {
            connection.release();
            
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database query failed',
                    error: err.message
                });
            }
            
            const menuCount = results[0].count;
            
            res.json({
                success: true,
                message: 'API is working!',
                timestamp: new Date().toISOString(),
                database: {
                    name: dbConfig.database,
                    connected: true,
                    menu_count: menuCount
                },
                uploads: {
                    directory: uploadDir,
                    exists: fs.existsSync(uploadDir)
                },
                endpoints: {
                    get_all_menu: 'GET /api/menu',
                    get_by_category: 'GET /api/menu/kategori/:kategori',
                    search: 'GET /api/menu/search?q=:query',
                    create: 'POST /api/menu',
                    update: 'PUT /api/menu/:id',
                    delete: 'DELETE /api/menu/:id',
                    categories: 'GET /api/menu/kategori',
                    stats: 'GET /api/menu/stats'
                }
            });
        });
    });
});

// 11. FIX DATABASE ENDPOINT
app.get('/api/fix-database', (req, res) => {
    console.log('🔧 GET /api/fix-database');
    
    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database connection failed'
            });
        }
        
        // Cek struktur tabel
        connection.query('DESCRIBE menu', (err, columns) => {
            if (err) {
                connection.release();
                return res.status(500).json({
                    success: false,
                    message: 'Cannot describe table: ' + err.message
                });
            }
            
            console.log('📋 Current table structure:');
            columns.forEach(col => {
                console.log(`  ${col.Field} (${col.Type})`);
            });
            
            connection.release();
            
            res.json({
                success: true,
                message: 'Database structure check complete',
                columns: columns.map(col => ({
                    name: col.Field,
                    type: col.Type,
                    nullable: col.Null === 'YES'
                }))
            });
        });
    });
});

// 12. FIX IMAGES ENDPOINT
app.get('/api/fix-images', (req, res) => {
    console.log('🖼️ GET /api/fix-images');
    
    // Query untuk mendapatkan semua menu
    const sql = 'SELECT id, nama_menu, gambar FROM menu';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error fetching menu:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error: ' + err.message
            });
        }
        
        const report = {
            total: results.length,
            items: [],
            recommendations: []
        };
        
        results.forEach((item) => {
            const itemReport = {
                id: item.id,
                nama_menu: item.nama_menu,
                current_image: item.gambar,
                status: 'unknown',
                suggested_fix: null
            };
            
            if (!item.gambar || item.gambar === 'null' || item.gambar === 'NULL') {
                itemReport.status = 'no_image';
                itemReport.suggested_fix = 'NULL (will use default image)';
            } else if (item.gambar.includes('/uploads/')) {
                // Ada path /uploads/
                const filename = path.basename(item.gambar);
                itemReport.status = 'has_path';
                itemReport.suggested_fix = `Change to: ${filename}`;
                report.recommendations.push(`UPDATE menu SET gambar = '${filename}' WHERE id = ${item.id};`);
            } else if (item.gambar.includes('/')) {
                // Ada path lain
                const filename = path.basename(item.gambar);
                itemReport.status = 'other_path';
                itemReport.suggested_fix = `Change to: ${filename}`;
                report.recommendations.push(`UPDATE menu SET gambar = '${filename}' WHERE id = ${item.id};`);
            } else {
                // Hanya filename
                itemReport.status = 'filename_only';
                itemReport.suggested_fix = 'OK (no change needed)';
            }
            
            report.items.push(itemReport);
        });
        
        res.json({
            success: true,
            message: 'Image analysis complete',
            report: report
        });
    });
});
// Simulasi pengiriman ke server
async function sendOrderToServer(orderData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Order created successfully:', result);
            return result;
        } else {
            throw new Error(result.message || 'Failed to create order');
        }
    } catch (error) {
        console.error('❌ Error sending order:', error);
        // Fallback to localStorage if API fails
        return saveOrderToLocalStorage(orderData);
    }
}
// ========== API ENDPOINTS FOR TRANSACTIONS ==========

// 1. CREATE NEW ORDER/TRANSACTION
app.post('/api/orders', (req, res) => {
    console.log('🛒 POST /api/orders - Creating new order');
    console.log('📦 Body:', req.body);
    
    const { 
        id_menu, 
        nama_pelanggan, 
        jumlah, 
        total_harga, 
        catatan = '',
        payment_status = 'belum'  // <-- TAMBAHKAN INI
    } = req.body;
    
    // Validasi
    if (!id_menu || !nama_pelanggan || !jumlah || !total_harga) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak lengkap'
        });
    }
    
    // Parse ke number
    const idMenuNum = parseInt(id_menu);
    const jumlahNum = parseInt(jumlah);
    const totalHargaNum = parseInt(total_harga);
    
    const sql = `
        INSERT INTO transaksi (
            id_menu, 
            nama_pelanggan, 
            jumlah, 
            total_harga, 
            catatan, 
            status_pembayaran,  -- <-- TAMBAHKAN INI
            tanggal
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(sql, [idMenuNum, nama_pelanggan, jumlahNum, totalHargaNum, catatan, payment_status], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }
        
        res.json({
            success: true,
            order_number: `ORD${result.insertId.toString().padStart(6, '0')}`,
            id_transaksi: result.insertId,
            message: 'Pesanan berhasil dibuat'
        });
    });
});

// 2. GET ALL TRANSACTIONS
 app.get('/api/orders', (req, res) => {
    console.log('📋 GET /api/orders - Fetching all transactions');
    
    const sql = `
        SELECT 
            t.*, 
            m.nama_menu, 
            m.harga as harga_satuan,
            m.gambar,
            m.kategori,
            m.deskripsi
        FROM transaksi t 
        JOIN menu m ON t.id_menu = m.id 
        ORDER BY t.tanggal DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }
        
        // Format hasil - PASTIKAN ada field payment_status
        const formattedResults = results.map(trans => ({
            id: trans.id_transaksi,
            order_number: `ORD${trans.id_transaksi.toString().padStart(6, '0')}`,
            id_menu: trans.id_menu,
            menu_name: trans.nama_menu,
            menu_price: trans.harga_satuan,
            quantity: trans.jumlah,
            total_amount: trans.total_harga,
            customer_name: trans.nama_pelanggan,
            order_note: trans.catatan || '',
            order_date: trans.tanggal,
            payment_status: trans.status_pembayaran || 'belum',  // <-- INI YANG PENTING
            gambar: getMenuImageUrl(trans.gambar),
            kategori: trans.kategori,
            deskripsi: trans.deskripsi
        }));
        
        res.json({
            success: true,
            data: formattedResults
        });
    });
});


// 3. GET TRANSACTION BY ID
app.get('/api/orders/:id', (req, res) => {
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
            payment_status: trans.status_pembayaran || 'belum',
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
app.get('/api/orders/stats', (req, res) => {
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
app.delete('/api/orders/:id', (req, res) => {
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
app.get('/api/orders/filter', (req, res) => {
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
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Update payment status endpoint
app.patch('/api/orders/:id/payment', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`💳 PATCH /api/orders/${id}/payment - Status: ${status}`);
    
    if (!status || !['belum', 'dibayar'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status pembayaran harus: belum atau dibayar'
        });
    }
    
    const sql = 'UPDATE transaksi SET status_pembayaran = ? WHERE id_transaksi = ?';
    
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating payment status:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            });
        }
        
        res.json({
            success: true,
            message: `Status pembayaran berhasil diubah menjadi: ${status}`
        });
    });
});

// ========== CATCH ALL ROUTE ==========
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint tidak ditemukan: ' + req.path
        });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║     🚀 KOPI NUSANTARA BACKEND API                ║
    ║     📊 Connected to EXISTING DATABASE            ║
    ╚═══════════════════════════════════════════════════╝
    
    📍 Server: http://localhost:${PORT}
    📊 Database: ${dbConfig.database}
    
    📁 Upload Directory: ${uploadDir}
    
    📋 SUPPORTED ENDPOINTS:
    • GET    /api/menu                    → Semua menu
    • GET    /api/menu/kategori/:type     → Menu by kategori
    • GET    /api/menu/:id               → Single menu
    • POST   /api/menu                    → Tambah menu
    • PUT    /api/menu/:id               → Update menu
    • DELETE /api/menu/:id               → Hapus menu
    • GET    /api/menu/search?q=         → Cari menu
    • GET    /api/menu/kategori          → Daftar kategori
    • GET    /api/menu/stats             → Statistik
    
    🖼️ IMAGE FIX ENDPOINTS:
    • GET    /api/fix-images             → Analisis gambar
    
    🧪 TEST ENDPOINTS:
    • GET    /api/test                   → Test API
    • GET    /api/fix-database           → Check database
    
    📂 ADMIN PAGES:
    • GET    /admin/dashboard.html       → Dashboard Admin
    • GET    /admin/menu.html            → Kelola Menu
    • GET    /admin/orders.html          → Kelola Pesanan
    • GET    /logout                     → Halaman Logout
    
    ✅ Server ready! Database connection established.
    `);
});