/**
 * JavaScript untuk menampilkan menu Kopi Nusantara
 * Semua data berasal dari database melalui API
 */

let cart = [];

/**
 * Inisialisasi dan tampilkan semua menu berdasarkan kategori
 */
async function initializeMenu() {
    try {
        // Tampilkan semua kategori secara paralel
        await Promise.all([
            displayMenuByCategory('coffee', 'coffee-container'),
            displayMenuByCategory('non-coffee', 'noncoffee-container'),
            displayMenuByCategory('makanan', 'food-container')
        ]);
        
        // Buat filter kategori
        await createCategoryFilter();
        
    } catch (error) {
        console.error('Error initializing menu:', error);
        showNotification('Gagal memuat menu', 'error');
    }
}

/**
 * Menampilkan menu berdasarkan kategori dari database
 */
async function displayMenuByCategory(kategori, containerId) {
    const menuContainer = document.getElementById(containerId);
    
    if (!menuContainer) return;
    
    // Tampilkan loading state
    menuContainer.innerHTML = `<p class="loading">🔄 Memuat menu ${kategori}...</p>`;
    
    try {
        // Ambil data menu berdasarkan kategori dari API
        const menuItems = await apiService.getMenuByCategory(kategori);
        
        // Kosongkan container
        menuContainer.innerHTML = '';
        
        // Jika tidak ada data
        if (!menuItems || menuItems.length === 0) {
            menuContainer.innerHTML = `
                <div class="empty-message">
                    <p>😔 Belum ada menu ${kategori} tersedia.</p>
                </div>
            `;
            return;
        }
        
        // Tambahkan setiap item menu
        menuItems.forEach(item => {
            const menuCard = createMenuCard(item);
            menuContainer.appendChild(menuCard);
        });
        
    } catch (error) {
        menuContainer.innerHTML = `
            <div class="error-message">
                <p>❌ Gagal memuat menu ${kategori}.</p>
                <button onclick="displayMenuByCategory('${kategori}', '${containerId}')" class="btn-order">
                    Coba Lagi
                </button>
            </div>
        `;
        console.error(`Error displaying ${kategori} menu:`, error);
    }
}

/**
 * Membuat filter kategori di halaman utama
 */
async function createCategoryFilter() {
    try {
        const categories = await apiService.getCategories();
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'category-filter';
        
        filterContainer.innerHTML = `
            <div class="filter-title">Filter Menu:</div>
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="showAllCategories()">
                    Semua Menu
                </button>
                ${categories.map(category => `
                    <button class="filter-btn" onclick="filterByCategory('${category}')">
                        ${getCategoryDisplayName(category)}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Sisipkan filter sebelum section menu pertama
        const firstMenuSection = document.querySelector('.menu');
        if (firstMenuSection) {
            firstMenuSection.parentNode.insertBefore(filterContainer, firstMenuSection);
        }
        
    } catch (error) {
        console.error('Error creating category filter:', error);
    }
}

/**
 * Dapatkan nama display untuk kategori
 */
function getCategoryDisplayName(category) {
    const displayNames = {
        'coffee': '☕ Coffee',
        'non-coffee': '🥤 Non-Coffee',
        'makanan': '🍽️ Makanan'
    };
    
    return displayNames[category] || category;
}

/**
 * Tampilkan semua kategori
 */
function showAllCategories() {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-btn').classList.add('active');
    
    // Tampilkan semua section
    document.getElementById('menu-coffee').style.display = 'block';
    document.getElementById('menu-non-coffee').style.display = 'block';
    document.getElementById('menu-makanan').style.display = 'block';
}

/**
 * Filter berdasarkan kategori tertentu
 */
function filterByCategory(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(getCategoryDisplayName(category))) {
            btn.classList.add('active');
        }
    });
    
    // Sembunyikan semua section terlebih dahulu
    document.getElementById('menu-coffee').style.display = 'none';
    document.getElementById('menu-non-coffee').style.display = 'none';
    document.getElementById('menu-makanan').style.display = 'none';
    
    // Tampilkan section yang dipilih
    switch(category) {
        case 'coffee':
            document.getElementById('menu-coffee').style.display = 'block';
            break;
        case 'non-coffee':
            document.getElementById('menu-non-coffee').style.display = 'block';
            break;
        case 'makanan':
            document.getElementById('menu-makanan').style.display = 'block';
            break;
    }
}

/**
 * Buat card menu dari data database
 */
function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.dataset.id = item.id;
    card.dataset.category = item.kategori;
    
    // Format harga ke Rupiah
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(item.harga);
    
    // Gunakan gambar default jika tidak ada
    const imageUrl = item.gambar ? `uploads/${item.gambar}` : 'assets/default-menu.jpg';
    
    // Icon berdasarkan kategori
    const categoryIcon = {
        'coffee': '☕',
        'non-coffee': '🥤',
        'makanan': '🍽️'
    }[item.kategori] || '📋';
    
    card.innerHTML = `
        <div class="menu-image">
            <img src="${imageUrl}" alt="${item.nama_menu}" loading="lazy" 
                 onerror="this.src='assets/default-menu.jpg'">
            <span class="menu-category-badge">
                ${categoryIcon} ${item.kategori}
            </span>
        </div>
        <div class="menu-content">
            <h3 class="menu-name">${item.nama_menu}</h3>
            <p class="menu-description">${item.deskripsi || 'Deskripsi tidak tersedia'}</p>
            <div class="menu-footer">
                <span class="menu-price">${formattedPrice}</span>
                <button class="btn-order" onclick="addToCart(${item.id}, '${item.nama_menu.replace(/'/g, "\\'")}', ${item.harga})">
                    <i class="fas fa-cart-plus"></i> Pesan
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Load API service terlebih dahulu
    if (typeof apiService === 'undefined') {
        console.error('API Service not loaded');
        return;
    }
    
    // Tampilkan menu dengan kategori
    initializeMenu();
    
    // Setup navigation
    setupNavigation();
});