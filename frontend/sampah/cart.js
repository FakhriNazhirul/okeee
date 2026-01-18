/**
 * Cart Management System for Kopi Nusantara
 * Handles shopping cart functionality across pages
 */

// Cart state
/* let cart = JSON.parse(localStorage.getItem('cart')) || [];

// API Base URL
const API_BASE_URL = '/api';

// Add item to cart
function addToCart(menuItem) {
    if (!menuItem || !menuItem.id) {
        console.error('Invalid menu item');
        return false;
    }
    
    const existingItem = cart.find(item => item.id === menuItem.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: menuItem.id,
            name: menuItem.nama_menu,
            price: menuItem.harga,
            quantity: 1,
            category: menuItem.kategori
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${menuItem.nama_menu} ditambahkan ke keranjang!`, 'success');
    return true;
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
    showNotification('Item dihapus dari keranjang', 'info');
}

// Update item quantity
function updateQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    cart[itemIndex].quantity += change;
    
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
    
    saveCart();
    updateCartUI();
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
        cart = [];
        saveCart();
        updateCartUI();
        showNotification('Keranjang dikosongkan', 'info');
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Dispatch custom event for other pages to listen to
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

// Calculate cart totals
function calculateCartTotals() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% PPN
    const total = subtotal + tax;
    
    return {
        totalItems,
        subtotal,
        tax,
        total
    };
}

// Format price to IDR
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}

// Update cart UI (for cart.html)
function updateCartUI() {
    const totals = calculateCartTotals();
    
    // Update summary
    document.getElementById('summary-total-items').textContent = totals.totalItems;
    document.getElementById('summary-subtotal').textContent = formatPrice(totals.subtotal);
    document.getElementById('summary-tax').textContent = formatPrice(totals.tax);
    document.getElementById('summary-total').textContent = formatPrice(totals.total);
    
    // Enable/disable checkout button
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// Load cart items (for cart.html)
function loadCartItems() {
    const container = document.getElementById('cart-items-list');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Keranjang Kosong</h3>
                <p>Belum ada item di keranjang Anda</p>
                <a href="index.html#menu-spesial" class="btn-browse-menu">
                    <i class="fas fa-utensils"></i> Lihat Menu
                </a>
            </div>
        `;
        return;
    }
    
    const itemsHTML = cart.map(item => `
        <div class="cart-item-card" data-id="${item.id}">
            <div class="item-info">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-price">${formatPrice(item.price)}</p>
            </div>
            <div class="item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="item-total">
                    ${formatPrice(item.price * item.quantity)}
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = itemsHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Create new notification
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
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 9999;
                transform: translateX(150%);
                transition: transform 0.3s ease;
                border-left: 4px solid;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                border-left-color: #27ae60;
                background: #d5f4e6;
            }
            
            .notification-error {
                border-left-color: #e74c3c;
                background: #fadbd8;
            }
            
            .notification-warning {
                border-left-color: #f39c12;
                background: #fef5e7;
            }
            
            .notification-info {
                border-left-color: #3498db;
                background: #e8f4fc;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #2c3e50;
            }
            
            .notification button {
                background: none;
                border: none;
                color: #95a5a6;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification button:hover {
                color: #7f8c8d;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Initialize cart system
document.addEventListener('DOMContentLoaded', function() {
    // Load cart items if on cart page
    if (document.getElementById('cart-items-list')) {
        loadCartItems();
        updateCartUI();
    }
    
    // Listen for cart updates from other pages
    window.addEventListener('cartUpdated', function() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (document.getElementById('cart-items-list')) {
            loadCartItems();
            updateCartUI();
        }
    });
});

// Export functions for use in other files
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.calculateCartTotals = calculateCartTotals; */