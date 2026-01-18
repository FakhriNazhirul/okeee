/**
 * Cart Management System untuk Kopi Nusantara
 * Sistem terintegrasi dari index.html ke checkout
 */

/*class CartSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }
    
    init() {
        this.updateCartCounters();
        this.setupEventListeners();
    }
    
    // Tambah item ke keranjang
    addItem(menuItem) {
        if (!menuItem || !menuItem.id) {
            console.error('Item tidak valid');
            return false;
        }
        
        // Cek apakah item sudah ada di keranjang
        const existingItem = this.cart.find(item => item.id === menuItem.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: menuItem.id,
                name: menuItem.nama_menu,
                price: menuItem.harga,
                quantity: 1,
                category: menuItem.kategori,
                image: menuItem.gambar || 'assets/default-menu.jpg'
            });
        }
        
        this.saveCart();
        this.showNotification(`${menuItem.nama_menu} ditambahkan ke keranjang!`, 'success');
        return true;
    }
    
    // Hapus item dari keranjang
    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.showNotification('Item dihapus dari keranjang', 'info');
    }
    
    // Update kuantitas item
    updateQuantity(itemId, change) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        this.cart[itemIndex].quantity += change;
        
        if (this.cart[itemIndex].quantity <= 0) {
            this.cart.splice(itemIndex, 1);
        }
        
        this.saveCart();
    }
    
    // Kosongkan keranjang
    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            this.cart = [];
            this.saveCart();
            this.showNotification('Keranjang dikosongkan', 'info');
        }
    }
    
    // Simpan ke localStorage
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCounters();
        
        // Dispatch event untuk update di halaman lain
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: this.cart
        }));
    }
    
    // Hitung total
    calculateTotals() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% PPN
        const total = subtotal + tax;
        
        return {
            totalItems,
            subtotal,
            tax,
            total
        };
    }
    
    // Format harga ke Rupiah
    formatPrice(price) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }
    
    // Update cart counter di navbar dan floating icon
    updateCartCounters() {
        const totals = this.calculateTotals();
        
        // Update navbar counter
        const navCounter = document.getElementById('cart-counter');
        if (navCounter) {
            navCounter.textContent = totals.totalItems;
            navCounter.style.display = totals.totalItems > 0 ? 'flex' : 'none';
        }
        
        // Update floating counter
        const floatingCounter = document.getElementById('floating-cart-counter');
        if (floatingCounter) {
            floatingCounter.textContent = totals.totalItems;
            floatingCounter.style.display = totals.totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    // Tampilkan notifikasi
    showNotification(message, type = 'info') {
        // Hapus notifikasi lama
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        // Buat notifikasi baru
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' : 
                                  type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Animasi masuk
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove setelah 3 detik
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for cart updates from other pages
        window.addEventListener('cartUpdated', () => {
            this.cart = JSON.parse(localStorage.getItem('cart')) || [];
            this.updateCartCounters();
        });
    }
}

// Fungsi untuk mendapatkan data menu dari API
async function getMenuById(menuId) {
    try {
        const response = await fetch(`/api/menu/${menuId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching menu:', error);
        return null;
    }
}

// Fungsi untuk membuat pesanan
async function createOrder(orderData) {
    try {
        // Kirim ke server API
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Order created successfully:', result);
            
            // Kosongkan keranjang setelah berhasil pesan
            localStorage.removeItem('cart');
            
            // Update cart counter
            updateCartCounter();
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
            return result;
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Fungsi untuk mendapatkan semua pesanan
async function getAllOrders() {
    try {
        const response = await fetch('/api/orders');
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Fungsi untuk menampilkan pesanan di dashboard admin
function displayOrdersInAdmin(orders) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Belum ada pesanan</h3>
                <p>Pesanan yang masuk akan ditampilkan di sini</p>
            </div>
        `;
        return;
    }
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h4>Pesanan #${order.order_number}</h4>
                    <small>${new Date(order.created_at).toLocaleString('id-ID')}</small>
                </div>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-body">
                <p><strong>Pelanggan:</strong> ${order.customer_name}</p>
                <p><strong>Telepon:</strong> ${order.customer_phone}</p>
                <p><strong>Tipe:</strong> ${order.order_type}</p>
                <p><strong>Total:</strong> Rp ${order.total_amount.toLocaleString()}</p>
            </div>
            <div class="order-actions">
                <button onclick="viewOrderDetails(${order.id})" class="btn-view">
                    <i class="fas fa-eye"></i> Detail
                </button>
                <button onclick="updateOrderStatus(${order.id}, 'processing')" class="btn-process">
                    <i class="fas fa-cogs"></i> Proses
                </button>
            </div>
        `;
        container.appendChild(orderCard);
    });
}

// Inisialisasi cart system
document.addEventListener('DOMContentLoaded', function() {
    window.cartSystem = new CartSystem();
    
    // Ekspos fungsi ke global scope untuk akses dari button
    window.addToCart = function(menuItem) {
        return cartSystem.addItem(menuItem);
    };
    
    window.removeFromCart = function(itemId) {
        cartSystem.removeItem(itemId);
    };
    
    window.clearCart = function() {
        cartSystem.clearCart();
    };
    
    window.getCartTotal = function() {
        return cartSystem.calculateTotals().totalItems;
    };
});*/