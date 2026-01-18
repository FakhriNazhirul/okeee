// fix-images.js
const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kopi_nusantara',
    port: process.env.DB_PORT || 3306
});

// Folder uploads
const uploadDir = path.join(__dirname, 'uploads');

console.log('🔧 Starting image fix script...');
console.log('📁 Uploads directory:', uploadDir);

// Periksa file yang ada di uploads
if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    console.log(`📁 Found ${files.length} files in uploads folder:`);
    files.forEach(file => {
        console.log(`  - ${file}`);
    });
} else {
    console.log('⚠️ Uploads folder does not exist');
}

// Query untuk mendapatkan semua menu
db.query('SELECT id, nama_menu, gambar FROM menu', (err, results) => {
    if (err) {
        console.error('❌ Error fetching menu:', err);
        process.exit(1);
    }
    
    console.log(`\n📊 Found ${results.length} menu items in database:`);
    
    results.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.nama_menu} (ID: ${item.id})`);
        console.log(`   Current image value: "${item.gambar}"`);
        
        // Analisis nilai gambar
        if (!item.gambar || item.gambar === 'null' || item.gambar === 'NULL') {
            console.log('   ❌ No image - will set to NULL');
        } else if (item.gambar.includes('/')) {
            console.log('   ℹ️ Has path - checking...');
            // Coba ekstrak filename saja
            const filename = path.basename(item.gambar);
            console.log(`   Extracted filename: ${filename}`);
            
            // Cek apakah file ada di uploads
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ File exists: ${filename}`);
                
                // Update database dengan filename saja
                db.query('UPDATE menu SET gambar = ? WHERE id = ?', [filename, item.id], (updateErr) => {
                    if (updateErr) {
                        console.error(`   ❌ Error updating: ${updateErr.message}`);
                    } else {
                        console.log(`   ✅ Updated to: ${filename}`);
                    }
                });
            } else {
                console.log(`   ❌ File not found: ${filePath}`);
            }
        } else {
            // Hanya filename
            const filePath = path.join(uploadDir, item.gambar);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ File exists: ${item.gambar}`);
            } else {
                console.log(`   ❌ File not found: ${filePath}`);
            }
        }
    });
    
    console.log('\n✅ Image analysis complete');
    console.log('\n📋 RECOMMENDED FIXES:');
    console.log('1. Pastikan semua file gambar ada di folder "uploads/"');
    console.log('2. Di database, field "gambar" harus berisi NAMA FILE saja (bukan path lengkap)');
    console.log('3. Contoh: "kopi-americano.jpg" bukan "/uploads/kopi-americano.jpg"');
    console.log('4. File default akan digunakan jika gambar tidak ada');
    
    setTimeout(() => {
        console.log('\n🔧 Exiting...');
        process.exit(0);
    }, 3000);
});