// ==================== KONFIGURASI ====================
const API_BASE_URL = '';

// ==================== FUNGSI UTILITY ====================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    return `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Selesai</span>`;
}

// ==================== FUNGSI LOAD TRANSAKSI ====================
async function loadOrders(filters = {}) {
    console.log('📋 Loading transactions...');
    
    const loadingEl = document.getElementById('loading');
    const ordersContainer = document.getElementById('ordersContainer');
    const errorState = document.getElementById('errorState');
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (ordersContainer) ordersContainer.innerHTML = '';
    if (errorState) errorState.style.display = 'none';
    
    try {
        let url = '/api/orders';
        let params = new URLSearchParams();
        
        // Add filters if provided
        if (filters.date) {
            params.append('date', filters.date);
        }
        
        const queryString = params.toString();
        if (queryString) {
            url = `/api/orders/filter?${queryString}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load orders');
        }
        
        // Update statistics
        await updateOrderStats();
        
        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Display orders
        if (result.data && result.data.length > 0) {
            displayOrders(result.data);
        } else {
            displayEmptyState();
        }
        
    } catch (error) {
        console.error('❌ Error loading transactions:', error);
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
        
        showNotification('Gagal memuat data transaksi', 'error');
    }
}

// ==================== FUNGSI UPDATE STATISTIK ====================
async function updateOrderStats() {
    try {
        const response = await fetch('/api/orders/stats');
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
                const stats = result.data;
                
                // Update UI elements
                const totalOrdersEl = document.getElementById('totalOrders');
                const totalRevenueEl = document.getElementById('totalRevenue');
                const totalDaysEl = document.getElementById('totalDays');
                const lastOrderEl = document.getElementById('lastOrder');
                
                if (totalOrdersEl) totalOrdersEl.textContent = stats.total_orders || 0;
                if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(stats.total_revenue || 0);
                if (totalDaysEl) totalDaysEl.textContent = stats.days_with_orders || 0;
                if (lastOrderEl && stats.last_order_date) {
                    lastOrderEl.textContent = formatDate(stats.last_order_date);
                } else if (lastOrderEl) {
                    lastOrderEl.textContent = '-';
                }
            }
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// ==================== FUNGSI DISPLAY TRANSAKSI ====================
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #2c3e50;">
                        ${order.order_number}
                    </h3>
                    <p style="margin: 0; color: #6c757d; font-size: 0.9em;">
                        <i class="far fa-calendar"></i> ${formatDate(order.order_date)}
                    </p>
                </div>
                <div style="text-align: right;">
                    ${getStatusBadge()}
                </div>
            </div>
            
            <div class="customer-info" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600;">Pelanggan:</span>
                    <span>${order.customer_name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600;">Menu:</span>
                    <span>${order.menu_name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600;">Harga Satuan:</span>
                    <span>${formatCurrency(order.menu_price)}</span>
                </div>
                ${order.order_note ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600;">Catatan:</span>
                    <span style="text-align: right; font-style: italic;">${order.order_note}</span>
                </div>` : ''}
            </div>
            
            <div class="order-items">
                <div class="order-item">
                    <div>
                        <strong>${order.menu_name}</strong>
                        <br>
                        <small style="color: #6c757d;">
                            ${formatCurrency(order.menu_price)} × ${order.quantity}
                        </small>
                    </div>
                    <div style="font-weight: 600;">
                        ${formatCurrency(order.total_amount)}
                    </div>
                </div>
            </div>
            
            <div class="order-footer">
                <div style="font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                    Total: ${formatCurrency(order.total_amount)}
                </div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-info" onclick="showOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(orderCard);
    });
}

// ==================== FUNGSI DISPLAY EMPTY STATE ====================
function displayEmptyState() {
    const container = document.getElementById('ordersContainer');
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <h3>Belum Ada Transaksi</h3>
            <p>Belum ada transaksi yang tercatat. Transaksi akan muncul di sini setelah pelanggan memesan.</p>
            <button class="btn btn-primary" onclick="loadOrders()">
                <i class="fas fa-redo"></i> Refresh
            </button>
        </div>
    `;
}

// ==================== FUNGSI DELETE TRANSAKSI ====================
async function deleteOrder(orderId) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Transaksi berhasil dihapus', 'success');
            loadOrders();
        } else {
            showNotification(result.message || 'Gagal menghapus transaksi', 'error');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Gagal menghapus transaksi', 'error');
    }
}

// ==================== FUNGSI SHOW ORDER DETAILS ====================
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        const result = await response.json();
        
        if (result.success) {
            const order = result.data;
            
            const modalHtml = `
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
                        <h2 style="margin: 0; color: #8B4513;">
                            <i class="fas fa-receipt"></i> Detail Transaksi
                        </h2>
                        <button onclick="closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                            &times;
                        </button>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${order.order_number}</h3>
                            <p style="margin: 0; color: #6c757d;">
                                <i class="far fa-calendar"></i> ${formatDate(order.order_date)}
                            </p>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <h4 style="margin: 0 0 10px 0; color: #495057;">Informasi Pelanggan</h4>
                                <p><strong>Nama:</strong> ${order.customer_name}</p>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 10px 0; color: #495057;">Status Transaksi</h4>
                                <p>${getStatusBadge()}</p>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">Detail Menu</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                                    <div style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden;">
                                        <img src="${order.gambar}" alt="${order.menu_name}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                    <div>
                                        <p style="margin: 0 0 5px 0; font-weight: 600;">${order.menu_name}</p>
                                        <p style="margin: 0; color: #6c757d; font-size: 0.9em;">${order.deskripsi || 'Tanpa deskripsi'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">Rincian Harga</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Harga Satuan</span>
                                    <span>${formatCurrency(order.menu_price)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Jumlah</span>
                                    <span>${order.quantity}</span>
                                </div>
                                <hr style="margin: 10px 0; border-color: #dee2e6;">
                                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                                    <span>Total</span>
                                    <span>${formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${order.order_note ? `
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">Catatan</h4>
                            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-style: italic;">${order.order_note}</p>
                        </div>` : ''}
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <button onclick="deleteOrder(${order.id})" class="btn btn-danger" style="flex: 1;">
                            <i class="fas fa-trash"></i> Hapus Transaksi
                        </button>
                        <button onclick="closeModal()" class="btn btn-secondary" style="flex: 1;">
                            <i class="fas fa-times"></i> Tutup
                        </button>
                    </div>
                </div>
            `;
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'orderDetailModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            modal.innerHTML = modalHtml;
            
            // Add close function
            modal.querySelector('button[onclick="closeModal()"]').onclick = () => modal.remove();
            
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error('Error showing order details:', error);
        showNotification('Gagal memuat detail transaksi', 'error');
    }
}

function closeModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.remove();
}

// ==================== FILTER FUNCTIONS ====================
function applyFilters() {
    const date = document.getElementById('filterDate').value;
    
    const filters = {};
    if (date) filters.date = date;
    
    loadOrders(filters);
}

function resetFilters() {
    document.getElementById('filterDate').value = '';
    
    loadOrders();
}

// ==================== FUNGSI UNTUK USER ORDER ====================
// Fungsi ini akan dipanggil dari menu.js ketika user membuat pesanan
async function createTransaction(orderData) {
    try {
        // Format data untuk tabel transaksi
        const transactionData = {
            id_menu: orderData.menu_id,
            nama_pelanggan: orderData.customer_name,
            jumlah: orderData.quantity,
            total_harga: orderData.total_amount,
            catatan: orderData.order_note || ''
        };
        
        console.log('📤 Sending transaction to server:', transactionData);
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Transaction saved to database:', result);
            return result;
        } else {
            throw new Error(result.message || 'Failed to save transaction');
        }
        
    } catch (error) {
        console.error('❌ Error saving transaction:', error);
        // Fallback to localStorage
        return saveToLocalStorage(orderData);
    }
}

function saveToLocalStorage(orderData) {
    try {
        const localOrders = JSON.parse(localStorage.getItem('local_transactions')) || [];
        localOrders.push({
            ...orderData,
            saved_locally: true,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('local_transactions', JSON.stringify(localOrders));
        
        console.log('💾 Saved to localStorage as backup');
        return {
            success: true,
            message: 'Pesanan disimpan secara lokal (database offline)'
        };
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
        return {
            success: false,
            message: 'Gagal menyimpan pesanan'
        };
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Orders page initialized');
    
    // Load orders on page load
    loadOrders();
    
    // Setup event listeners
    const btnApplyFilter = document.getElementById('btnApplyFilter');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const btnRefresh = document.getElementById('btnRefresh');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (btnApplyFilter) {
        btnApplyFilter.addEventListener('click', applyFilters);
    }
    
    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', resetFilters);
    }
    
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => loadOrders());
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Yakin ingin logout?')) {
                localStorage.removeItem('adminAuth');
                window.location.href = '/login.html';
            }
        });
    }
    
    // Setup username
    try {
        const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
        if (auth.username) {
            const usernameEl = document.getElementById('adminUsername');
            if (usernameEl) {
                usernameEl.textContent = auth.username;
            }
        }
    } catch (e) {
        console.log('Auth data not available');
    }
});

// ==================== EXPOSE FUNCTIONS ====================
window.loadOrders = loadOrders;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.deleteOrder = deleteOrder;
window.showOrderDetails = showOrderDetails;
window.closeModal = closeModal;
window.createTransaction = createTransaction;