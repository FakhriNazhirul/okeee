// File utama untuk load menu dari API backend
async function loadMenuFromAPI() {
    console.log('🚀 Memulai load menu dari API...');
    
    const container = document.getElementById('menu-container');
    
    try {
        // Fetch data dari API backend
        const response = await fetch('/api/menu');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Data diterima dari API:', data);
        
        if (data.success && data.data.length > 0) {
            displayMenus(data.data);
        } else {
            showMessage('Belum ada menu tersedia', 'info');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(`Gagal memuat menu: ${error.message}`, 'error');
    }
}

function displayMenus(menus) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    
    // Buat grid container
    const grid = document.createElement('div');
    grid.className = 'menu-container';
    
    // Tambahkan setiap menu
    menus.forEach(menu => {
        const card = createMenuCard(menu);
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    // Update judul dengan jumlah menu
    updateMenuTitle(menus.length);
}

function createMenuCard(menu) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
        <div class="menu-image">
            <img src="${getImageUrl(menu.imageUrl)}" 
                 alt="${menu.name}"
                 onerror="this.onerror=null; this.src='assets/images/default-coffee.jpg'">
        </div>
        <div class="menu-content">
            <h3 class="menu-name">${menu.name}</h3>
            <p class="menu-description">${menu.description || 'Deskripsi tidak tersedia'}</p>
            <div class="menu-footer">
                <span class="menu-price">Rp ${menu.price.toLocaleString('id-ID')}</span>
                <button class="btn-order" onclick="orderMenu(${menu.id}, '${menu.name}')">
                    Pesan Sekarang
                </button>
            </div>
        </div>
    `;
    return card;
}

function getImageUrl(imageUrl) {
    // Jika imageUrl adalah path relatif, tambahkan base path
    if (imageUrl && !imageUrl.startsWith('http')) {
        return `assets/images/${imageUrl}`;
    }
    return imageUrl || 'assets/images/default-coffee.jpg';
}

function updateMenuTitle(count) {
    const title = document.querySelector('#menu h2');
    if (title) {
        title.innerHTML = `🍵 Menu Spesial Kami <span style="background:#3498db;color:white;padding:2px 10px;border-radius:10px;font-size:0.8em;">${count} item</span>`;
    }
}

function showMessage(message, type = 'info') {
    const container = document.getElementById('menu-container');
    const color = type === 'error' ? '#e74c3c' : '#3498db';
    
    container.innerHTML = `
        <div style="text-align:center; padding:40px; background:${color}10; border-radius:10px;">
            <p style="color:${color}; font-weight:bold;">${message}</p>
            ${type === 'error' ? '<button onclick="loadMenuFromAPI()" style="margin-top:10px; padding:8px 16px; background:' + color + '; color:white; border:none; border-radius:5px; cursor:pointer;">Coba Lagi</button>' : ''}
        </div>
    `;
}

// Fungsi order sederhana
function orderMenu(id, name) {
    alert(`Anda memesan: ${name}\nID: ${id}\n\nFitur keranjang belanja akan segera hadir!`);
    
    // Simpan ke localStorage sebagai cart sederhana
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({ id, name, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count jika ada
    updateCartCount();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartElements = document.querySelectorAll('.cart-count');
    
    cartElements.forEach(el => {
        el.textContent = cart.length;
        el.style.display = cart.length > 0 ? 'inline' : 'none';
    });
}

// Load menu saat halaman siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Halaman siap, memuat menu...');
    loadMenuFromAPI();
    updateCartCount();
});

// Export untuk global use
window.loadMenuFromAPI = loadMenuFromAPI;
window.orderMenu = orderMenu;