/**
 * JavaScript untuk sistem menu Kopi Nusantara - VERSI TERINTEGRASI
 * Menu ditampilkan dalam halaman/overlay terpisah
 * Sistem pesanan sederhana dengan 2 status pembayaran (unpaid/paid)
 */

// Variabel global
let allMenuItems = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = 'all';
let currentSearch = '';
let currentOrderMenu = null;
let orderQuantity = 1;

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Default images
const DEFAULT_IMAGES = {
    logo: '/frontend/assets/coffee-cup_16590132.png',
    icon1: '/frontend/assets/9336950.png',
    icon2: '/frontend/assets/1221688_coffee_drink_kitchen_tea_beverage_icon.png',
    defaultCoffee: '/frontend/assets/coffee-cup_16590132.png'
};

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop';

/**
 * ============================================
 * FUNGSI UTAMA - INISIALISASI
 * ============================================
 */

async function initializeMenu() {
    try {
        console.log('🚀 Initializing menu system...');
        
        hideOldMenuSections();
        await loadAllMenuItems();
        setupEventListeners();
        setupDebugTools();
        initializeOrderData();
        setupGlobalOrderButtons();
        
        console.log('✅ Menu system initialized');
        
    } catch (error) {
        console.error('❌ Error initializing menu:', error);
        showNotification('Gagal memuat menu', 'error');
    }
}

function hideOldMenuSections() {
    const sections = ['menu-coffee', 'menu-non-coffee', 'menu-makanan'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

async function loadAllMenuItems() {
    try {
        const container = document.getElementById('menu-items-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-menu">
                    <div class="spinner"></div>
                    <p>Memuat menu dari database...</p>
                </div>
            `;
        }
        
        console.log('📡 Fetching menu data from API...');
        const response = await fetch(`${API_BASE_URL}/menu`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Received data from API:', data);
        
        if (Array.isArray(data)) {
            allMenuItems = data;
            console.log(`📊 Loaded ${allMenuItems.length} menu items from database`);
        } else {
            console.error('Invalid response format:', data);
            allMenuItems = [];
            throw new Error('Format data tidak valid dari server');
        }
        
        updateMenuDisplay();
        
    } catch (error) {
        console.error('❌ Error loading menu items from API:', error);
        allMenuItems = await getFallbackMenuData();
        updateMenuDisplay();
        showNotification('Tidak dapat terhubung ke database. Menggunakan data contoh.', 'warning');
    }
}

async function getFallbackMenuData() {
    return [
        {
            id: 1,
            nama_menu: 'Espresso',
            deskripsi: 'Kopi murni dengan rasa kuat dan aroma khas',
            harga: 25000,
            kategori: 'coffee',
            gambar: '/assets/coffee-cup_16590132.png',
            tersedia: true,
            popular: true
        },
        {
            id: 2,
            nama_menu: 'Cappuccino',
            deskripsi: 'Espresso dengan susu steamed dan foam',
            harga: 30000,
            kategori: 'coffee',
            gambar: '/assets/coffee-cup_16590132.png',
            tersedia: true,
            popular: true
        },
        {
            id: 3,
            nama_menu: 'Teh Tarik',
            deskripsi: 'Teh khas dengan susu kental manis',
            harga: 20000,
            kategori: 'non-coffee',
            gambar: '/assets/9336950.png',
            tersedia: true,
            popular: false
        },
        {
            id: 4,
            nama_menu: 'Croissant',
            deskripsi: 'Pastry renyah dengan menturi berkualitas',
            harga: 18000,
            kategori: 'makanan',
            gambar: '/assets/1221688_coffee_drink_kitchen_tea_beverage_icon.png',
            tersedia: true,
            popular: true
        }
    ];
}

/**
 * ============================================
 * FUNGSI GAMBAR
 * ============================================
 */

function getImageUrl(gambar) {
    if (!gambar || gambar.trim() === '' || gambar === null || gambar === 'null') {
        return DEFAULT_IMAGES.defaultCoffee;
    }
    
    const cleaned = gambar.toString().trim();
    
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('data:')) {
        return cleaned;
    }
    
    if (cleaned.startsWith('/')) {
        return cleaned;
    }
    
    const isJustFilename = /^[^\/\\]+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleaned);
    if (isJustFilename) {
        return `/assets/${cleaned}`;
    }
    
    return `/assets/${cleaned}`;
}

function handleImageError(img, menuName) {
    console.error('❌ Failed to load image for', menuName + ':', img.src);
    
    const fallbacks = [
        DEFAULT_IMAGES.defaultCoffee,
        DEFAULT_IMAGES.logo,
        DEFAULT_IMAGES.icon1,
        DEFAULT_IMAGES.icon2,
        PLACEHOLDER_IMAGE
    ];
    
    const currentSrc = img.src;
    for (let fallback of fallbacks) {
        if (fallback !== currentSrc) {
            img.src = fallback;
            break;
        }
    }
}

/**
 * ============================================
 * FUNGSI UI - MENU DISPLAY
 * ============================================
 */

function createMenuItemCard(item) {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(item.harga);
    
    const categoryIcon = {
        'coffee': '☕',
        'non-coffee': '🥤',
        'makanan': '🍽️'
    }[item.kategori] || '📋';
    
    const categoryName = {
        'coffee': 'Kopi',
        'non-coffee': 'Non-Kopi',
        'makanan': 'Makanan'
    }[item.kategori] || item.kategori;
    
    const imageUrl = getImageUrl(item.gambar);
    const isAvailable = item.tersedia !== false;
    const isPopular = item.popular === true;
    
    const menuData = JSON.stringify(item).replace(/"/g, '&quot;');
    
    return `
        <div class="menu-item-card ${isPopular ? 'popular' : ''}" data-id="${item.id}">
            ${isPopular ? '<span class="popular-badge"><i class="fas fa-star"></i> Populer</span>' : ''}
            
            <div class="menu-item-image">
                <div class="category-badge">
                    ${categoryIcon} ${categoryName}
                </div>
                <img src="${imageUrl}" 
                     alt="${item.nama_menu}"
                     loading="lazy"
                     onerror="handleImageError(this, '${item.nama_menu}')">
            </div>
            
            <div class="menu-item-info">
                <h3 class="menu-item-name">${item.nama_menu}</h3>
                <p class="menu-item-desc">${item.deskripsi || 'Tanpa deskripsi'}</p>
                
                <div class="menu-item-price">
                    <span class="price">${formattedPrice}</span>
                    ${isAvailable ? 
                        '<span class="available"><i class="fas fa-check"></i> Tersedia</span>' : 
                        '<span class="unavailable"><i class="fas fa-times"></i> Habis</span>'
                    }
                </div>
                
                <div class="menu-item-actions">
                    <button class="btn-detail" data-id="${item.id}">
                        <i class="fas fa-info-circle"></i> Detail
                    </button>
                    <button class="btn-order" 
                            data-id="${item.id}" 
                            data-menu='${menuData}'
                            ${!isAvailable ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Pesan
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateMenuDisplay() {
    const container = document.getElementById('menu-items-container');
    if (!container) {
        console.error('❌ Menu container not found!');
        return;
    }
    
    let filteredItems = allMenuItems;
    
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.kategori === currentFilter);
    }
    
    if (currentSearch.length > 0) {
        filteredItems = filteredItems.filter(item => 
            (item.nama_menu && item.nama_menu.toLowerCase().includes(currentSearch)) ||
            (item.deskripsi && item.deskripsi.toLowerCase().includes(currentSearch))
        );
    }
    
    if (filteredItems.length > 0 && filteredItems[0].popular !== undefined) {
        filteredItems.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }
    
    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Tidak ada menu yang ditemukan</h3>
                <p>Coba kata kunci lain atau kategori yang berbeda</p>
                <button onclick="clearSearch(); filterMenu('all')" class="btn-reset">
                    Reset Filter
                </button>
            </div>
        `;
    } else {
        container.innerHTML = filteredItems.map(item => createMenuItemCard(item)).join('');
        
        // Setup event listeners untuk tombol yang baru dibuat
        setupMenuCardEventListeners();
    }
}

function setupMenuCardEventListeners() {
    // Detail buttons
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            const menuId = parseInt(this.dataset.id);
            showMenuDetail(menuId);
        });
    });
    
    // Order buttons - menggunakan event delegation yang lebih baik
    document.querySelectorAll('.btn-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const menuData = this.dataset.menu;
            if (menuData) {
                try {
                    const menu = JSON.parse(menuData);
                    openOrderForm(menu);
                } catch (error) {
                    console.error('Error parsing menu data:', error);
                }
            }
        });
    });
}

/**
 * ============================================
 * FUNGSI NAVIGASI MENU
 * ============================================
 */

function openMenuPage(category = '') {
    const sectionsToHide = [
        'main.hero-section',
        '.menu-navigation',
        '.tentang',
        '.kontak',
        '.copyright'
    ];
    
    sectionsToHide.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'none';
    });
    
    document.getElementById('menu-page').style.display = 'block';
    
    const categoryButtons = document.querySelectorAll('.menu-category-btn');
    if (category === 'drinks') {
        filterMenu('coffee');
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        categoryButtons[1].classList.add('active');
    } else if (category === 'food') {
        filterMenu('makanan');
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        categoryButtons[3].classList.add('active');
    } else {
        filterMenu('all');
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        categoryButtons[0].classList.add('active');
    }
    
    window.scrollTo(0, 0);
    
    setTimeout(() => {
        const searchInput = document.getElementById('menu-search');
        if (searchInput) searchInput.focus();
    }, 300);
}

function closeMenuPage() {
    const sectionsToShow = [
        'main.hero-section',
        '.menu-navigation',
        '.tentang',
        '.kontak',
        '.copyright'
    ];
    
    sectionsToShow.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'block';
    });
    
    document.getElementById('menu-page').style.display = 'none';
    
    currentFilter = 'all';
    currentSearch = '';
    const searchInput = document.getElementById('menu-search');
    if (searchInput) searchInput.value = '';
    
    const clearBtn = document.querySelector('.clear-search');
    if (clearBtn) clearBtn.style.display = 'none';
    
    const menuSection = document.getElementById('menu-spesial');
    if (menuSection) {
        menuSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

function filterMenu(category) {
    currentFilter = category;
    
    document.querySelectorAll('.menu-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const buttons = document.querySelectorAll('.menu-category-btn');
    const buttonIndex = {
        'all': 0,
        'coffee': 1,
        'non-coffee': 2,
        'makanan': 3
    }[category];
    
    if (buttonIndex !== undefined && buttons[buttonIndex]) {
        buttons[buttonIndex].classList.add('active');
    }
    
    updateMenuDisplay();
}

function searchMenu() {
    const searchInput = document.getElementById('menu-search');
    const clearBtn = document.querySelector('.clear-search');
    
    if (!searchInput) return;
    
    currentSearch = searchInput.value.toLowerCase().trim();
    
    if (clearBtn) {
        clearBtn.style.display = currentSearch.length > 0 ? 'flex' : 'none';
    }
    
    updateMenuDisplay();
}

function clearSearch() {
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
        
        const clearBtn = document.querySelector('.clear-search');
        if (clearBtn) clearBtn.style.display = 'none';
        
        updateMenuDisplay();
    }
}

/**
 * ============================================
 * FUNGSI ORDER FORM - SISTEM TERPUSAT
 * ============================================
 */

function openOrderForm(menu) {
    if (!menu || !menu.id) {
        console.error('❌ Invalid menu data:', menu);
        showNotification('Data menu tidak valid', 'error');
        return;
    }
    
    currentOrderMenu = menu;
    orderQuantity = 1;
    
    let modal = document.getElementById('orderFormModal');
    
    if (!modal) {
        createOrderFormModal();
    } else {
        updateOrderForm();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function createOrderFormModal() {
    // Hapus modal lama jika ada
    const oldModal = document.getElementById('orderFormModal');
    if (oldModal) oldModal.remove();
    
    const modalHTML = `
        <div class="modal-overlay" id="orderFormModal">
            <div class="modal-pesanan">
                <div class="modal-header">
                    <h2><i class="fas fa-shopping-cart"></i> Pesan Menu</h2>
                    <button class="close-modal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- Informasi Menu -->
                    <div class="menu-info-section">
                        <div class="menu-info-image">
                            <img src="${getImageUrl(currentOrderMenu?.gambar)}" 
                                 alt="${currentOrderMenu?.nama_menu}" 
                                 id="orderMenuImage">
                        </div>
                        <div class="menu-info-details">
                            <h3 id="orderMenuName">${currentOrderMenu?.nama_menu || 'Nama Menu'}</h3>
                            <p class="menu-category" id="orderMenuCategory">
                                ${getCategoryName(currentOrderMenu?.kategori)}
                            </p>
                            <div class="menu-price-large" id="orderMenuPrice">
                                Rp ${currentOrderMenu?.harga?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>

                    <!-- Form Pesanan -->
                    <form id="orderForm">
                        <!-- Jumlah Pesanan -->
                        <div class="form-group">
                            <label for="orderQuantity">Jumlah</label>
                            <div class="quantity-control">
                                <button type="button" class="qty-btn minus">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" 
                                       id="orderQuantity" 
                                       value="1" 
                                       min="1" 
                                       max="20">
                                <button type="button" class="qty-btn plus">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Informasi Pelanggan -->
                        <div class="form-section">
                            <h4><i class="fas fa-user"></i> Informasi Pelanggan</h4>
                            
                            <div class="form-group">
                                <label for="customerName">Nama Lengkap *</label>
                                <input type="text" 
                                       id="customerName" 
                                       placeholder="Masukkan nama lengkap"
                                       required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerPhone">Nomor Telepon *</label>
                                    <input type="tel" 
                                           id="customerPhone" 
                                           placeholder="0812-3456-7890"
                                           required>
                                </div>
                                <div class="form-group">
                                    <label for="customerEmail">Email (Opsional)</label>
                                    <input type="email" 
                                           id="customerEmail" 
                                           placeholder="nama@email.com">
                                </div>
                            </div>
                        </div>

                        <!-- Catatan Tambahan -->
                        <div class="form-section">
                            <h4><i class="fas fa-sticky-note"></i> Catatan Tambahan (Opsional)</h4>
                            
                            <div class="form-group">
                                <textarea id="orderNote" 
                                          rows="3"
                                          placeholder="Contoh: Kurangi gula, tambah es, tanpa bawang, dll."></textarea>
                            </div>
                        </div>

                        <!-- Ringkasan Pesanan -->
                        <div class="order-summary">
                            <h4><i class="fas fa-receipt"></i> Ringkasan Pesanan</h4>
                            
                            <div class="summary-item">
                                <span>Subtotal (<span id="summaryQuantity">1</span> item)</span>
                                <span id="summarySubtotal">Rp 0</span>
                            </div>
                            
                            <div class="summary-total">
                                <span>Total yang harus dibayar</span>
                                <span id="summaryTotal">Rp 0</span>
                            </div>
                        </div>

                        <!-- Tombol Aksi -->
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary cancel-btn">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Buat Pesanan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners
    setupOrderFormEventListeners();
    updateOrderForm();
    
    // Tampilkan modal
    document.getElementById('orderFormModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function setupOrderFormEventListeners() {
    const modal = document.getElementById('orderFormModal');
    if (!modal) return;
    
    // Close buttons
    modal.querySelector('.close-modal').addEventListener('click', closeOrderForm);
    modal.querySelector('.cancel-btn').addEventListener('click', closeOrderForm);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeOrderForm();
        }
    });
    
    // Quantity buttons
    modal.querySelector('.qty-btn.minus').addEventListener('click', decreaseOrderQty);
    modal.querySelector('.qty-btn.plus').addEventListener('click', increaseOrderQty);
    
    // Quantity input
    const quantityInput = modal.querySelector('#orderQuantity');
    quantityInput.addEventListener('change', function() {
        updateOrderQty(this.value);
    });
    
    // Form submission
    const form = modal.querySelector('#orderForm');
    form.addEventListener('submit', handleOrderSubmit);
    
    // Close with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeOrderForm();
        }
    });
}

function updateOrderForm() {
    if (!currentOrderMenu) return;
    
    const modal = document.getElementById('orderFormModal');
    if (!modal) return;
    
    modal.querySelector('#orderMenuName').textContent = currentOrderMenu.nama_menu;
    modal.querySelector('#orderMenuCategory').textContent = getCategoryName(currentOrderMenu.kategori);
    modal.querySelector('#orderMenuPrice').textContent = `Rp ${currentOrderMenu.harga.toLocaleString()}`;
    
    const menuImage = modal.querySelector('#orderMenuImage');
    menuImage.src = getImageUrl(currentOrderMenu.gambar);
    menuImage.alt = currentOrderMenu.nama_menu;
    
    updateOrderSummary();
}

function updateOrderQty(value) {
    const qty = parseInt(value) || 1;
    if (qty < 1) orderQuantity = 1;
    else if (qty > 20) orderQuantity = 20;
    else orderQuantity = qty;
    
    const quantityInput = document.getElementById('orderQuantity');
    if (quantityInput) quantityInput.value = orderQuantity;
    
    updateOrderSummary();
}

function increaseOrderQty() {
    if (orderQuantity < 20) {
        orderQuantity++;
        const quantityInput = document.getElementById('orderQuantity');
        if (quantityInput) quantityInput.value = orderQuantity;
        updateOrderSummary();
    }
}

function decreaseOrderQty() {
    if (orderQuantity > 1) {
        orderQuantity--;
        const quantityInput = document.getElementById('orderQuantity');
        if (quantityInput) quantityInput.value = orderQuantity;
        updateOrderSummary();
    }
}

function updateOrderSummary() {
    if (!currentOrderMenu) return;
    
    const subtotal = currentOrderMenu.harga * orderQuantity;
    
    const summaryQuantity = document.getElementById('summaryQuantity');
    const subtotalElement = document.getElementById('summarySubtotal');
    const totalElement = document.getElementById('summaryTotal');
    
    if (summaryQuantity) summaryQuantity.textContent = orderQuantity;
    if (subtotalElement) subtotalElement.textContent = `Rp ${subtotal.toLocaleString()}`;
    if (totalElement) totalElement.textContent = `Rp ${subtotal.toLocaleString()}`;
}

function closeOrderForm() {
    const modal = document.getElementById('orderFormModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentOrderMenu = null;
        orderQuantity = 1;
    }
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    console.log('🔄 [ORDER] Membuat pesanan baru...');
    
    if (!validateOrderForm()) {
        console.log('❌ [ORDER] Validasi form gagal');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan ke database...';
    submitBtn.disabled = true;
    
    try {
        const orderData = prepareOrderData();
        console.log('📝 [ORDER] Data pesanan:', orderData);
        console.log('📤 [ORDER] Mengirim ke API:', `${API_BASE_URL}/orders`);
        
        // 1. Kirim langsung ke database via API
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                id_menu: orderData.id_menu,
                nama_pelanggan: orderData.nama_pelanggan,
                jumlah: orderData.jumlah,
                total_harga: orderData.total_harga,
                catatan: orderData.catatan
            })
        });
        
        console.log('📨 [ORDER] Status response:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [ORDER] Server error:', errorText);
            throw new Error(`Server error ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ [ORDER] Response dari server:', result);
        
        if (result.success) {
            // SUCCESS - Pesanan tersimpan di database
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Sukses!';
            showNotification('🎉 Pesanan berhasil disimpan ke database!', 'success');
            
            // Simpan ke localStorage sebagai backup
            const fullOrderData = {
                ...orderData,
                order_number: result.order_number || `ORD${Date.now()}`,
                order_date: new Date().toISOString(),
                status: 'completed'
            };
            
            saveOrder(fullOrderData);
            
            // Tambahkan ke cart
            addToCart(currentOrderMenu.id, orderQuantity);
            
            // Tampilkan konfirmasi
            setTimeout(() => {
                closeOrderForm();
                
                // Alert konfirmasi
                alert(`✅ PESANAN BERHASIL!\n\n` +
                      `📋 No. Pesanan: ${result.order_number || 'ORD' + Date.now()}\n` +
                      `👤 Nama: ${orderData.nama_pelanggan}\n` +
                      `📞 Telp: ${document.getElementById('customerPhone').value}\n` +
                      `🍽️ Menu: ${currentOrderMenu.nama_menu}\n` +
                      `🔢 Jumlah: ${orderData.jumlah}x\n` +
                      `💰 Total: Rp ${orderData.total_harga.toLocaleString()}\n\n` +
                      `Data telah disimpan ke database.`);
            }, 1500);
            
        } else {
            throw new Error(result.message || 'Gagal membuat pesanan');
        }
        
    } catch (error) {
        console.error('❌ [ORDER] Error:', error);
        
        // FALLBACK: Simpan ke localStorage jika API gagal
        console.log('💾 [ORDER] Fallback ke localStorage');
        
        const orderData = prepareOrderData();
        const fallbackOrder = {
            ...orderData,
            order_number: `LOCAL-${Date.now()}`,
            order_date: new Date().toISOString(),
            status: 'pending',
            saved_locally: true
        };
        
        saveOrder(fallbackOrder);
        addToCart(currentOrderMenu.id, orderQuantity);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showNotification('⚠️ Database offline. Pesanan disimpan lokal.', 'warning');
        
        setTimeout(() => {
            closeOrderForm();
            alert('⚠️ PESANAN DISIMPAN LOKAL\n\n' +
                  'Database tidak tersedia.\n' +
                  'Pesanan disimpan di browser.\n' +
                  'Silakan hubungi admin.');
        }, 1500);
    }
}
function validateOrderForm() {
    const customerName = document.getElementById('customerName')?.value.trim();
    const customerPhone = document.getElementById('customerPhone')?.value.trim();
    
    if (!customerName) {
        showNotification('Harap masukkan nama lengkap', 'error');
        return false;
    }
    
    if (!customerPhone) {
        showNotification('Harap masukkan nomor telepon', 'error');
        return false;
    }
    
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
        showNotification('Format nomor telepon tidak valid', 'error');
        return false;
    }
    
    return true;
}

function prepareOrderData() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const orderNote = document.getElementById('orderNote').value.trim();
    
    const subtotal = currentOrderMenu.harga * orderQuantity;
    
    // PASTIKAN struktur data sesuai dengan API endpoint di server.js
    return {
        id_menu: currentOrderMenu.id,  // Field ini harus cocok dengan database
        nama_pelanggan: customerName,
        jumlah: orderQuantity,
        total_harga: subtotal,
        catatan: orderNote || '',
        customer_phone: customerPhone,  // Opsional untuk backup
        customer_email: customerEmail || ''
    };
}
// Fungsi untuk membuat transaksi baru (tambahkan di menu.js)
async function createTransaction(orderData) {
    try {
        console.log('📤 [DEBUG] Mengirim pesanan ke server...');
        console.log('📦 Data pesanan:', orderData);
        
        // Struktur data yang sesuai dengan endpoint di server.js
        const transactionData = {
            id_menu: orderData.id_menu,  // PERHATIAN: gunakan id_menu bukan menu_id
            nama_pelanggan: orderData.nama_pelanggan,
            jumlah: orderData.jumlah,
            total_harga: orderData.total_harga,
            catatan: orderData.catatan || ''
        };
        
        console.log('🌐 Mengirim ke:', `${API_BASE_URL}/orders`);
        console.log('📤 Data JSON:', JSON.stringify(transactionData));
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        console.log('📨 Status response:', response.status);
        console.log('📨 Status text:', response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Response dari server:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error dalam createTransaction:', error.message);
        console.error('❌ Stack trace:', error.stack);
        throw error;
    }
}
function saveOrder(orderData) {
    try {
        // Simpan ke localStorage untuk backup
        const orders = JSON.parse(localStorage.getItem('kopi_nusantara_orders')) || [];
        
        // Tambahkan metadata
        const orderWithMeta = {
            ...orderData,
            saved_at: new Date().toISOString(),
            saved_to: 'localStorage',
            menu_id: currentOrderMenu?.id
        };
        
        orders.push(orderWithMeta);
        localStorage.setItem('kopi_nusantara_orders', JSON.stringify(orders));
        
        // Debug logging
        console.log('💾 [ORDER] Disimpan ke localStorage:', {
            order_number: orderData.order_number,
            customer: orderData.nama_pelanggan,
            total: orderData.total_harga,
            time: new Date().toLocaleTimeString()
        });
        
        // Update stats
        updateOrderStats();
        
        return true;
    } catch (error) {
        console.error('❌ Error saving order to localStorage:', error);
        return false;
    }
}
function updateOrderStats() {
    const orders = JSON.parse(localStorage.getItem('kopi_nusantara_orders')) || [];
    
    const stats = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        pending_orders: orders.filter(order => order.payment_status === 'unpaid').length,
        last_updated: new Date().toISOString()
    };
    
    localStorage.setItem('order_stats', JSON.stringify(stats));
}

function getCategoryName(category) {
    const categories = {
        'coffee': '☕ Kopi',
        'non-coffee': '🥤 Non-Kopi',
        'makanan': '🍽️ Makanan'
    };
    return categories[category] || category;
}

/**
 * ============================================
 * FUNGSI KERANJANG (CART)
 * ============================================
 */

function addToCart(menuId, quantity = 1) {
    const menuItem = allMenuItems.find(item => item.id === menuId);
    
    if (!menuItem) {
        showNotification('Menu tidak ditemukan', 'error');
        return;
    }
    
    if (menuItem.tersedia === false) {
        showNotification(`Maaf, ${menuItem.nama_menu} sedang tidak tersedia`, 'error');
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === menuId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: menuItem.id,
            name: menuItem.nama_menu,
            price: menuItem.harga,
            quantity: quantity,
            category: menuItem.kategori,
            image: getImageUrl(menuItem.gambar)
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    showNotification(`${menuItem.nama_menu} ditambahkan ke keranjang!`, 'success');
}

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const counters = [
        '.cart-counter',
        '.cart-counter-floating',
        '#cart-counter',
        '#floating-cart-counter'
    ];
    
    counters.forEach(selector => {
        const counter = document.querySelector(selector);
        if (counter) {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    });
}

/**
 * ============================================
 * FUNGSI MODAL DETAIL
 * ============================================
 */

function showMenuDetail(menuId) {
    const menuItem = allMenuItems.find(item => item.id === menuId);
    if (!menuItem) {
        showNotification('Menu tidak ditemukan', 'error');
        return;
    }
    
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(menuItem.harga);
    
    const categoryName = {
        'coffee': 'Kopi',
        'non-coffee': 'Minuman Non-Kopi',
        'makanan': 'Makanan & Snack'
    }[menuItem.kategori] || menuItem.kategori;
    
    const imageUrl = getImageUrl(menuItem.gambar);
    const isAvailable = menuItem.tersedia !== false;
    const isPopular = menuItem.popular === true;
    
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-menu-detail">
            <div class="detail-image">
                <img src="${imageUrl}" 
                     alt="${menuItem.nama_menu}"
                     loading="lazy">
            </div>
            
            <div class="detail-content">
                <div class="detail-header">
                    <h3>${menuItem.nama_menu}</h3>
                    <span class="detail-category">${categoryName}</span>
                </div>
                
                <div class="detail-description">
                    <h4>Deskripsi</h4>
                    <p>${menuItem.deskripsi || 'Tanpa deskripsi'}</p>
                </div>
                
                <div class="detail-info">
                    <div class="info-item">
                        <span class="info-label"><i class="fas fa-tag"></i> Harga:</span>
                        <span class="info-value price">${formattedPrice}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label"><i class="fas fa-box"></i> Status:</span>
                        <span class="info-value ${isAvailable ? 'available' : 'unavailable'}">
                            <i class="fas fa-${isAvailable ? 'check' : 'times'}"></i>
                            ${isAvailable ? 'Tersedia' : 'Habis'}
                        </span>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-order-large" ${!isAvailable ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Pesan Menu Ini
                    </button>
                    <button class="btn-close-detail">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners untuk modal detail
    const modal = document.getElementById('menu-modal');
    modal.querySelector('.btn-order-large').addEventListener('click', function() {
        openOrderForm(menuItem);
        closeModal();
    });
    
    modal.querySelector('.btn-close-detail').addEventListener('click', closeModal);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('menu-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * ============================================
 * FUNGSI NOTIFIKASI
 * ============================================
 */

function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * ============================================
 * FUNGSI SETUP GLOBAL
 * ============================================
 */

function setupGlobalOrderButtons() {
    // Event delegation untuk semua tombol pesan
    document.addEventListener('click', function(e) {
        // Cek tombol pesan di menu items
        if (e.target.closest('.btn-order')) {
            const btn = e.target.closest('.btn-order');
            const menuData = btn.dataset.menu;
            if (menuData) {
                try {
                    const menu = JSON.parse(menuData);
                    openOrderForm(menu);
                } catch (error) {
                    console.error('Error parsing menu data:', error);
                }
            }
        }
        
        // Cek tombol pesan di menu navigasi (index.html)
        if (e.target.closest('.menu-nav-card')) {
            const card = e.target.closest('.menu-nav-card');
            const category = card.textContent.includes('Minuman') ? 'drinks' : 
                            card.textContent.includes('Makanan') ? 'food' : '';
            openMenuPage(category);
        }
    });
}

function setupEventListeners() {
    // Modal detail
    const modal = document.getElementById('menu-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Search input
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMenu();
            }
        });
    }
    
    // Navigation links
    document.querySelectorAll('.nav a[href="#menu-spesial"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openMenuPage();
        });
    });
    
    // Cart updates
    window.addEventListener('cartUpdated', updateCartCounter);
    updateCartCounter();
}

function initializeOrderData() {
    if (!localStorage.getItem('kopi_nusantara_orders')) {
        localStorage.setItem('kopi_nusantara_orders', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('admin_orders')) {
        localStorage.setItem('admin_orders', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('order_stats')) {
        localStorage.setItem('order_stats', JSON.stringify({
            total_orders: 0,
            total_revenue: 0,
            pending_orders: 0,
            last_updated: new Date().toISOString()
        }));
    }
}

function setupDebugTools() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🐛 Debug';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 10px 15px;
            background: #8b4513;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        debugBtn.onclick = function() {
            console.log('=== DEBUG INFO ===');
            console.log('Menu items:', allMenuItems.length);
            console.log('Cart items:', JSON.parse(localStorage.getItem('cart'))?.length || 0);
            console.log('Orders:', JSON.parse(localStorage.getItem('kopi_nusantara_orders'))?.length || 0);
        };
        
        document.body.appendChild(debugBtn);
    }
}

/**
 * ============================================
 * INISIALISASI & EKSPOR FUNGSI
 * ============================================
 */

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Kopi Nusantara');
    
    initializeMenu();
    
    // Setup admin login
    const loginAdminBtn = document.getElementById('loginAdminBtn');
    if (loginAdminBtn) {
        loginAdminBtn.addEventListener('click', function() {
            const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
            if (authData) {
                try {
                    const auth = JSON.parse(authData);
                    if (auth.isLoggedIn && auth.role === 'admin') {
                        window.location.href = '/admin/dashboard.html';
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing auth data:', error);
                }
            }
            window.location.href = 'login.html';
        });
    }
});

// Ekspor fungsi ke global scope
window.openMenuPage = openMenuPage;
window.closeMenuPage = closeMenuPage;
window.filterMenu = filterMenu;
window.searchMenu = searchMenu;
window.clearSearch = clearSearch;
window.addToCart = addToCart;
window.openOrderForm = openOrderForm;
window.closeOrderForm = closeOrderForm;
window.closeModal = closeModal;
window.reloadMenuData = loadAllMenuItems;