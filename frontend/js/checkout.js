/**
 * Checkout System for Kopi Nusantara
 * Handles order submission and checkout process
 */

// API Base URL
const API_BASE_URL = '/api';

// Load order summary in checkout page
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('order-items-summary');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-message">Keranjang kosong</p>';
        return;
    }
    
    const itemsHTML = cart.map(item => `
        <div class="order-item-summary">
            <span class="item-summary-name">${item.name}</span>
            <span class="item-summary-quantity">${item.quantity}×</span>
            <span class="item-summary-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    container.innerHTML = itemsHTML;
    
    // Calculate and update prices
    calculateTotal();
}

// Calculate total with taxes and fees
function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderType = document.getElementById('order_type').value;
    
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate tax (10%)
    const tax = subtotal * 0.1;
    
    // Delivery fee
    const deliveryFee = orderType === 'delivery' ? 10000 : 0;
    
    // Calculate total
    const total = subtotal + tax + deliveryFee;
    
    // Update UI
    document.getElementById('price-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('price-tax').textContent = formatPrice(tax);
    document.getElementById('price-delivery').textContent = formatPrice(deliveryFee);
    document.getElementById('price-total').textContent = formatPrice(total);
    
    return {
        subtotal,
        tax,
        deliveryFee,
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

// Submit order
async function submitOrder(event) {
    event.preventDefault();
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }
    
    // Get form data
    const customer_name = document.getElementById('customer_name').value;
    const customer_phone = document.getElementById('customer_phone').value;
    const customer_email = document.getElementById('customer_email').value;
    const order_type = document.getElementById('order_type').value;
    const customer_address = order_type === 'delivery' ? 
        document.getElementById('customer_address').value : null;
    const payment_method = document.getElementById('payment_method').value;
    const order_note = document.getElementById('order_note').value;
    
    // Validate required fields
    if (!customer_name || !customer_phone || !order_type || !payment_method) {
        alert('Harap lengkapi semua field yang wajib diisi!');
        return;
    }
    
    if (order_type === 'delivery' && !customer_address) {
        alert('Alamat pengiriman wajib diisi untuk pesanan delivery!');
        return;
    }
    
    // Prepare order data
    const orderData = {
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_address,
        order_type,
        payment_method,
        note: order_note || '',
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };
    
    // Disable submit button
    const submitBtn = event.target.querySelector('.btn-submit-order');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    try {
        console.log('📦 Submitting order:', orderData);
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Success - show confirmation
            showOrderConfirmation(result.order);
            
            // Clear cart
            localStorage.removeItem('cart');
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } else {
            throw new Error(result.message || 'Gagal membuat pesanan');
        }
        
    } catch (error) {
        console.error('❌ Order submission error:', error);
        alert(`❌ Gagal membuat pesanan: ${error.message}`);
    } finally {
        // Restore submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Show order confirmation modal
function showOrderConfirmation(order) {
    const modal = document.getElementById('order-confirmation-modal');
    const container = document.getElementById('order-confirmation-details');
    
    // Format order details
    const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const orderTypeText = {
        'dine-in': 'Makan di Tempat',
        'takeaway': 'Bungkus',
        'delivery': 'Antar'
    }[order.order_type] || order.order_type;
    
    const paymentMethodText = {
        'cash': 'Tunai',
        'transfer': 'Transfer Bank',
        'e-wallet': 'E-Wallet',
        'credit-card': 'Kartu Kredit/Debit'
    }[order.payment_method] || order.payment_method;
    
    container.innerHTML = `
        <div class="order-confirmation-item">
            <strong>Nomor Pesanan:</strong> ${order.order_number}
        </div>
        <div class="order-confirmation-item">
            <strong>Tanggal:</strong> ${orderDate}
        </div>
        <div class="order-confirmation-item">
            <strong>Nama:</strong> ${order.customer.name}
        </div>
        <div class="order-confirmation-item">
            <strong>Telepon:</strong> ${order.customer.phone}
        </div>
        <div class="order-confirmation-item">
            <strong>Tipe Pesanan:</strong> ${orderTypeText}
        </div>
        ${order.customer.address ? `
        <div class="order-confirmation-item">
            <strong>Alamat:</strong> ${order.customer.address}
        </div>
        ` : ''}
        <div class="order-confirmation-item">
            <strong>Metode Bayar:</strong> ${paymentMethodText}
        </div>
        <div class="order-confirmation-item">
            <strong>Status:</strong> 
            <span style="background: #f39c12; color: white; padding: 3px 10px; border-radius: 10px; font-size: 14px;">
                Menunggu Konfirmasi
            </span>
        </div>
        <div class="order-confirmation-item">
            <strong>Total:</strong> ${order.formattedTotal}
        </div>
        ${order.note ? `
        <div class="order-confirmation-item">
            <strong>Catatan:</strong> ${order.note}
        </div>
        ` : ''}
        <div style="margin-top: 20px; padding: 15px; background: #e8f6f3; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60; font-weight: 500;">
                <i class="fas fa-info-circle"></i> Pesanan Anda akan segera diproses. 
                Silakan tunggu konfirmasi dari kami.
            </p>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close confirmation modal
function closeConfirmationModal() {
    const modal = document.getElementById('order-confirmation-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Print order (simulated)
function printOrder() {
    window.print();
}

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    // Setup form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', submitOrder);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeConfirmationModal();
            }
        });
    }
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeConfirmationModal();
        }
    });
});

// Export functions
window.showOrderConfirmation = showOrderConfirmation;
window.closeConfirmationModal = closeConfirmationModal;
window.printOrder = printOrder;
window.calculateTotal = calculateTotal;