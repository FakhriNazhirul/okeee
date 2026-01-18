/**
 * JavaScript untuk Dashboard Admin - Sistem Pesanan
 * Menampilkan semua pesanan dari user
 */

// Konfigurasi
const ADMIN_AUTH_KEY = 'admin_auth';
const ORDERS_STORAGE_KEY = 'admin_orders';
const USER_ORDERS_KEY = 'kopi_nusantara_orders';

// State
let allOrders = [];
let filteredOrders = [];
let currentFilters = {
    payment_status: '',
    order_status: '',
    date: ''
};

/**
 * ============================================
 * FUNGSI UTAMA - INISIALISASI
 * ============================================
 */

function initializeAdminOrders() {
    console.log('🚀 Initializing admin orders system...');
    
    // Cek autentikasi admin
    if (!checkAdminAuth()) {
        window.location.href = '/login.html';
        return;
    }
    
    // Load data pesanan
    loadOrdersData();
    
    // Setup event listeners
    setupAdminEventListeners();
    
    // Update UI
    updateAdminUI();
    
    console.log('✅ Admin orders system initialized');
}

/**
 * Cek autentikasi admin
 */
function checkAdminAuth() {
    const authData = localStorage.getItem(ADMIN_AUTH_KEY);
    
    if (!authData) {
        console.log('❌ No admin auth found');
        return false;
    }
    
    try {
        const auth = JSON.parse(authData);
        
        // Cek apakah user adalah admin dan belum expired
        if (auth.role !== 'admin' || !auth.isLoggedIn) {
            console.log('❌ Invalid admin credentials');
            return false;
        }
        
        // Cek expiry (24 jam)
        if (auth.loginTime) {
            const loginTime = new Date(auth.loginTime);
            const currentTime = new Date();
            const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                console.log('❌ Admin session expired');
                localStorage.removeItem(ADMIN_AUTH_KEY);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error checking admin auth:', error);
        return false;
    }
}

/**
 * Load data pesanan dari localStorage
 */
function loadOrdersData() {
    console.log('📥 Loading orders data...');
    
    try {
        // Coba ambil dari admin_orders terlebih dahulu
        let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY)) || [];
        
        // Jika tidak ada, coba ambil dari user orders dan convert ke format admin
        if (orders.length === 0) {
            console.log('⚠️ No admin orders found, checking user orders...');
            const userOrders = JSON.parse(localStorage.getItem(USER_ORDERS_KEY)) || [];
            orders = convertUserOrdersToAdmin(userOrders);
            
            // Simpan ke admin storage
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        }
        
        allOrders = orders;
        filteredOrders = [...allOrders];
        
        console.log(`✅ Loaded ${allOrders.length} orders`);
        
        // Update UI
        updateOrdersDisplay();
        updateOrderStats();
        
    } catch (error) {
        console.error('❌ Error loading orders data:', error);
        showAdminNotification('Gagal memuat data pesanan', 'error');
    }
}

/**
 * Convert user orders ke format admin
 */
function convertUserOrdersToAdmin(userOrders) {
    return userOrders.map((order, index) => ({
        id: `admin_${order.id || `order_${Date.now()}_${index}`}`,
        order_number: order.order_number || `ORD${Date.now().toString().substr(-6)}${index}`,
        customer_name: order.customer_name || 'Pelanggan',
        customer_phone: order.customer_phone || '-',
        customer_email: order.customer_email || '-',
        items: [{
            name: order.menu_name || 'Menu',
            price: order.menu_price || 0,
            quantity: order.quantity || 1,
            total: (order.menu_price || 0) * (order.quantity || 1)
        }],
        total_amount: order.total_amount || 0,
        payment_status: order.payment_status || 'unpaid',
        order_status: order.order_status || 'pending',
        order_note: order.order_note || '',
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString(),
        order_type: 'unknown',
        table_number: null,
        processed_by: null,
        completed_at: null
    }));
}

/**
 * ============================================
 * FUNGSI UI - DISPLAY ORDERS
 * ============================================
 */

/**
 * Update tampilan pesanan
 */
function updateOrdersDisplay() {
    const container = document.getElementById('ordersContainer');
    if (!container) {
        console.error('❌ Orders container not found');
        return;
    }
    
    // Tampilkan loading jika masih kosong
    if (allOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart" style="font-size: 48px; color: #95a5a6; margin-bottom: 20px;"></i>
                <h3 style="color: #7f8c8d; margin-bottom: 10px;">Belum ada pesanan</h3>
                <p style="color: #7f8c8d;">Pesanan yang masuk akan ditampilkan di sini</p>
            </div>
        `;
        return;
    }
    
    // Tampilkan pesanan
    container.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
    
    // Setup event listeners untuk setiap card
    setupOrderCardsEventListeners();
}

/**
 * Buat card pesanan
 */
function createOrderCard(order) {
    // Format tanggal
    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Format total harga
    const formattedTotal = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(order.total_amount || 0);
    
    // Badge status pembayaran
    const paymentStatusClass = order.payment_status === 'paid' ? 'badge-success' : 'badge-warning';
    const paymentStatusText = order.payment_status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar';
    const paymentStatusIcon = order.payment_status === 'paid' ? 'fa-check-circle' : 'fa-clock';
    
    // Badge status pesanan
    const orderStatusClass = getOrderStatusClass(order.order_status);
    const orderStatusText = getOrderStatusText(order.order_status);
    
    // Items
    const itemsList = order.items?.map(item => `
        <div class="order-item">
            <div>
                <strong>${item.name}</strong>
                <br>
                <small>${item.quantity} × ${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(item.price || 0)}</small>
            </div>
            <div>
                <strong>${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format((item.quantity || 0) * (item.price || 0))}</strong>
            </div>
        </div>
    `).join('') || '<p>Tidak ada item</p>';
    
    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <h4 style="margin: 0; color: #2c3e50;">Pesanan #${order.order_number}</h4>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="badge ${orderStatusClass}">${orderStatusText}</span>
                    <span class="badge ${paymentStatusClass}">
                        <i class="fas ${paymentStatusIcon}"></i> ${paymentStatusText}
                    </span>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 5px 0;">
                    <strong><i class="fas fa-user"></i> Pelanggan:</strong> ${order.customer_name}
                </p>
                <p style="margin: 5px 0;">
                    <strong><i class="fas fa-phone"></i> Telepon:</strong> ${order.customer_phone}
                </p>
                ${order.customer_email && order.customer_email !== '-' ? 
                    `<p style="margin: 5px 0;">
                        <strong><i class="fas fa-envelope"></i> Email:</strong> ${order.customer_email}
                    </p>` : ''
                }
                ${order.order_note ? 
                    `<p style="margin: 5px 0;">
                        <strong><i class="fas fa-sticky-note"></i> Catatan:</strong> ${order.order_note}
                    </p>` : ''
                }
            </div>
            
            <div class="order-items">
                <h5 style="margin-bottom: 10px; color: #2c3e50;">Items Pesanan:</h5>
                ${itemsList}
            </div>
            
            <div class="order-footer">
                <div>
                    <h4 style="margin: 0; color: #2c3e50;">Total: ${formattedTotal}</h4>
                </div>
                
                <div class="status-buttons">
                    <button class="btn btn-info" data-action="view" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                    
                    ${order.payment_status === 'unpaid' ? `
                        <button class="btn btn-success" data-action="mark-paid" data-order-id="${order.id}">
                            <i class="fas fa-check"></i> Tandai Sudah Bayar
                        </button>
                    ` : ''}
                    
                    ${order.order_status === 'pending' ? `
                        <button class="btn btn-warning" data-action="mark-processing" data-order-id="${order.id}">
                            <i class="fas fa-cogs"></i> Proses Pesanan
                        </button>
                    ` : ''}
                    
                    ${order.order_status === 'processing' ? `
                        <button class="btn btn-primary" data-action="mark-completed" data-order-id="${order.id}">
                            <i class="fas fa-check-double"></i> Selesai
                        </button>
                    ` : ''}
                    
                    ${order.order_status !== 'cancelled' && order.payment_status === 'unpaid' ? `
                        <button class="btn btn-danger" data-action="cancel-order" data-order-id="${order.id}">
                            <i class="fas fa-times"></i> Batalkan
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners untuk order cards
 */
function setupOrderCardsEventListeners() {
    document.querySelectorAll('[data-action]').forEach(button => {
        const action = button.dataset.action;
        const orderId = button.dataset.orderId;
        
        button.addEventListener('click', () => {
            switch (action) {
                case 'view':
                    viewOrderDetails(orderId);
                    break;
                case 'mark-paid':
                    updatePaymentStatus(orderId, 'paid');
                    break;
                case 'mark-processing':
                    updateOrderStatus(orderId, 'processing');
                    break;
                case 'mark-completed':
                    updateOrderStatus(orderId, 'completed');
                    break;
                case 'cancel-order':
                    cancelOrder(orderId);
                    break;
            }
        });
    });
}

/**
 * ============================================
 * FUNGSI FILTER
 * ============================================
 */

/**
 * Apply filters
 */
function applyFilters() {
    console.log('🔍 Applying filters...');
    
    // Ambil nilai filter
    currentFilters = {
        payment_status: document.getElementById('filterPaymentStatus')?.value || '',
        order_status: document.getElementById('filterOrderStatus')?.value || '',
        date: document.getElementById('filterDate')?.value || ''
    };
    
    // Filter pesanan
    filteredOrders = allOrders.filter(order => {
        // Filter by payment status
        if (currentFilters.payment_status && order.payment_status !== currentFilters.payment_status) {
            return false;
        }
        
        // Filter by order status
        if (currentFilters.order_status && order.order_status !== currentFilters.order_status) {
            return false;
        }
        
        // Filter by date
        if (currentFilters.date) {
            const orderDate = new Date(order.created_at).toDateString();
            const filterDate = new Date(currentFilters.date).toDateString();
            if (orderDate !== filterDate) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`📊 Filtered: ${filteredOrders.length} of ${allOrders.length} orders`);
    
    // Update display
    updateOrdersDisplay();
}

/**
 * Reset filters
 */
function resetFilters() {
    console.log('🧹 Resetting filters...');
    
    // Reset form
    if (document.getElementById('filterPaymentStatus')) {
        document.getElementById('filterPaymentStatus').value = '';
    }
    if (document.getElementById('filterOrderStatus')) {
        document.getElementById('filterOrderStatus').value = '';
    }
    if (document.getElementById('filterDate')) {
        document.getElementById('filterDate').value = '';
    }
    
    // Reset filter state
    currentFilters = {
        payment_status: '',
        order_status: '',
        date: ''
    };
    
    // Reset filtered orders
    filteredOrders = [...allOrders];
    
    // Update display
    updateOrdersDisplay();
    
    showAdminNotification('Filter telah direset', 'info');
}

/**
 * ============================================
 * FUNGSI ORDER OPERATIONS
 * ============================================
 */

/**
 * Tampilkan detail pesanan
 */
function viewOrderDetails(orderId) {
    console.log(`👁️ Viewing order details: ${orderId}`);
    
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showAdminNotification('Pesanan tidak ditemukan', 'error');
        return;
    }
    
    // Format detail untuk modal
    const orderDetails = formatOrderDetailsForModal(order);
    
    // Tampilkan modal
    showOrderModal(orderDetails, `Detail Pesanan #${order.order_number}`);
}

/**
 * Update status pembayaran
 */
function updatePaymentStatus(orderId, newStatus) {
    const statusText = newStatus === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar';
    
    if (!confirm(`Ubah status pembayaran menjadi "${statusText}"?`)) {
        return;
    }
    
    try {
        // Cari order
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            throw new Error('Pesanan tidak ditemukan');
        }
        
        // Update status
        allOrders[orderIndex].payment_status = newStatus;
        allOrders[orderIndex].updated_at = new Date().toISOString();
        
        // Jika sudah dibayar, update status order menjadi processing
        if (newStatus === 'paid' && allOrders[orderIndex].order_status === 'pending') {
            allOrders[orderIndex].order_status = 'processing';
        }
        
        // Simpan ke localStorage
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
        
        // Update juga di user orders untuk sinkronisasi
        updateUserOrderPaymentStatus(orderId, newStatus);
        
        // Update UI
        filteredOrders = [...allOrders];
        updateOrdersDisplay();
        updateOrderStats();
        
        showAdminNotification(`Status pembayaran berhasil diubah menjadi "${statusText}"`, 'success');
        
        console.log(`✅ Payment status updated for order ${orderId}: ${newStatus}`);
        
    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        showAdminNotification('Gagal mengubah status pembayaran', 'error');
    }
}

/**
 * Update status pesanan
 */
function updateOrderStatus(orderId, newStatus) {
    const statusText = getOrderStatusText(newStatus);
    
    if (!confirm(`Ubah status pesanan menjadi "${statusText}"?`)) {
        return;
    }
    
    try {
        // Cari order
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            throw new Error('Pesanan tidak ditemukan');
        }
        
        // Update status
        allOrders[orderIndex].order_status = newStatus;
        allOrders[orderIndex].updated_at = new Date().toISOString();
        
        // Jika selesai, set completed_at
        if (newStatus === 'completed') {
            allOrders[orderIndex].completed_at = new Date().toISOString();
        }
        
        // Simpan ke localStorage
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
        
        // Update UI
        filteredOrders = [...allOrders];
        updateOrdersDisplay();
        updateOrderStats();
        
        showAdminNotification(`Status pesanan berhasil diubah menjadi "${statusText}"`, 'success');
        
        console.log(`✅ Order status updated for order ${orderId}: ${newStatus}`);
        
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        showAdminNotification('Gagal mengubah status pesanan', 'error');
    }
}

/**
 * Batalkan pesanan
 */
function cancelOrder(orderId) {
    if (!confirm('Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }
    
    try {
        // Cari order
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            throw new Error('Pesanan tidak ditemukan');
        }
        
        // Update status
        allOrders[orderIndex].order_status = 'cancelled';
        allOrders[orderIndex].payment_status = 'unpaid';
        allOrders[orderIndex].updated_at = new Date().toISOString();
        
        // Simpan ke localStorage
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
        
        // Update UI
        filteredOrders = [...allOrders];
        updateOrdersDisplay();
        updateOrderStats();
        
        showAdminNotification('Pesanan berhasil dibatalkan', 'success');
        
        console.log(`✅ Order cancelled: ${orderId}`);
        
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        showAdminNotification('Gagal membatalkan pesanan', 'error');
    }
}

/**
 * Update status pembayaran di user orders
 */
function updateUserOrderPaymentStatus(orderId, newStatus) {
    try {
        const userOrders = JSON.parse(localStorage.getItem(USER_ORDERS_KEY)) || [];
        const userOrderIndex = userOrders.findIndex(o => o.id === orderId.replace('admin_', ''));
        
        if (userOrderIndex !== -1) {
            userOrders[userOrderIndex].payment_status = newStatus;
            userOrders[userOrderIndex].updated_at = new Date().toISOString();
            localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(userOrders));
        }
    } catch (error) {
        console.error('Error syncing with user orders:', error);
    }
}

/**
 * ============================================
 * FUNGSI MODAL
 * ============================================
 */

/**
 * Tampilkan modal
 */
function showOrderModal(content, title = 'Detail Pesanan') {
    // Hapus modal sebelumnya jika ada
    const oldModal = document.getElementById('orderDetailsModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Buat modal baru
    const modalHTML = `
        <div class="modal" id="orderDetailsModal" style="display: block;">
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; color: #2c3e50;">${title}</h3>
                    <button onclick="closeOrderModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d;">×</button>
                </div>
                
                <div id="orderModalContent">
                    ${content}
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button onclick="closeOrderModal()" class="btn" style="flex: 1; background: #95a5a6; color: white; padding: 12px; font-size: 15px;">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Tambahkan modal ke body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Tambahkan styling untuk modal
    addModalStyles();
}

/**
 * Format detail pesanan untuk modal
 */
function formatOrderDetailsForModal(order) {
    // Format tanggal
    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const updatedDate = new Date(order.updated_at);
    const formattedUpdatedDate = updatedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Format total
    const formattedTotal = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(order.total_amount || 0);
    
    // Items dalam pesanan
    const itemsList = order.items?.map((item, index) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(item.price || 0)}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format((item.quantity || 0) * (item.price || 0))}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="padding: 10px; text-align: center;">Tidak ada item</td></tr>';
    
    return `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; margin-bottom: 15px;">Informasi Pesanan</h4>
            <table style="width: 100%; margin-bottom: 15px;">
                <tr>
                    <td style="padding: 8px 0; width: 40%;"><strong>Nomor Pesanan:</strong></td>
                    <td style="padding: 8px 0;">${order.order_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Tanggal Pesanan:</strong></td>
                    <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Terakhir Diupdate:</strong></td>
                    <td style="padding: 8px 0;">${formattedUpdatedDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Status Pesanan:</strong></td>
                    <td style="padding: 8px 0;">
                        <span class="badge ${getOrderStatusClass(order.order_status)}">
                            ${getOrderStatusText(order.order_status)}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Status Pembayaran:</strong></td>
                    <td style="padding: 8px 0;">
                        <span class="badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">
                            <i class="fas ${order.payment_status === 'paid' ? 'fa-check-circle' : 'fa-clock'}"></i>
                            ${order.payment_status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                        </span>
                    </td>
                </tr>
                ${order.order_note ? `
                <tr>
                    <td style="padding: 8px 0;"><strong>Catatan:</strong></td>
                    <td style="padding: 8px 0;">${order.order_note}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; margin-bottom: 15px;">Informasi Pelanggan</h4>
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0; width: 40%;"><strong>Nama:</strong></td>
                    <td style="padding: 8px 0;">${order.customer_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Telepon:</strong></td>
                    <td style="padding: 8px 0;">${order.customer_phone}</td>
                </tr>
                ${order.customer_email && order.customer_email !== '-' ? `
                <tr>
                    <td style="padding: 8px 0;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0;">${order.customer_email}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; margin-bottom: 15px;">Items Pesanan</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">No</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Nama Menu</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Qty</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Harga</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="padding: 10px; text-align: right; border-top: 2px solid #dee2e6;"><strong>Total:</strong></td>
                            <td style="padding: 10px; border-top: 2px solid #dee2e6;"><strong>${formattedTotal}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

/**
 * Tutup modal
 */
function closeOrderModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Tambahkan styling untuk modal
 */
function addModalStyles() {
    const styleId = 'admin-modal-styles';
    
    // Cek apakah style sudah ada
    if (document.getElementById(styleId)) {
        return;
    }
    
    const styles = `
        <style id="${styleId}">
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                overflow: auto;
            }
            
            .modal-content {
                background: white;
                margin: 5% auto;
                padding: 25px;
                border-radius: 10px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            
            @media (max-width: 768px) {
                .modal-content {
                    margin: 2% auto;
                    padding: 15px;
                    width: 95%;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * ============================================
 * FUNGSI STATISTIK
 * ============================================
 */

/**
 * Update statistik pesanan
 */
function updateOrderStats() {
    console.log('📊 Updating order stats...');
    
    try {
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(o => o.payment_status === 'unpaid').length;
        const paidOrders = allOrders.filter(o => o.payment_status === 'paid').length;
        const totalRevenue = allOrders
            .filter(o => o.payment_status === 'paid')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        
        // Update UI
        const stats = {
            totalOrders,
            pendingOrders,
            paidOrders,
            totalRevenue
        };
        
        updateStatsDisplay(stats);
        
    } catch (error) {
        console.error('❌ Error updating order stats:', error);
    }
}

/**
 * Update tampilan statistik
 */
function updateStatsDisplay(stats) {
    // Total Pesanan
    const totalElement = document.getElementById('totalOrders');
    if (totalElement) {
        totalElement.textContent = stats.totalOrders;
    }
    
    // Belum Dibayar
    const pendingElement = document.getElementById('totalPending');
    if (pendingElement) {
        pendingElement.textContent = stats.pendingOrders;
    }
    
    // Sudah Dibayar
    const paidElement = document.getElementById('totalCompleted');
    if (paidElement) {
        paidElement.textContent = stats.paidOrders;
    }
    
    // Total Pendapatan
    const revenueElement = document.getElementById('totalRevenue');
    if (revenueElement) {
        revenueElement.textContent = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(stats.totalRevenue);
    }
}

/**
 * ============================================
 * FUNGSI BANTUAN
 * ============================================
 */

/**
 * Helper function untuk status pesanan
 */
function getOrderStatusClass(status) {
    switch(status) {
        case 'pending': return 'badge-warning';
        case 'processing': return 'badge-info';
        case 'completed': return 'badge-success';
        case 'cancelled': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

function getOrderStatusText(status) {
    switch(status) {
        case 'pending': return 'Menunggu';
        case 'processing': return 'Diproses';
        case 'completed': return 'Selesai';
        case 'cancelled': return 'Dibatalkan';
        default: return status;
    }
}

/**
 * Tampilkan notifikasi admin
 */
function showAdminNotification(message, type = 'info') {
    // Hapus notifikasi lama
    const oldNotification = document.querySelector('.admin-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Icon berdasarkan type
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Styling
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 1001;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        border-left: 4px solid;
    `;
    
    // Warna border berdasarkan type
    const borderColors = {
        'success': '#2ecc71',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };
    notification.style.borderLeftColor = borderColors[type] || '#3498db';
    
    // Tambahkan ke body
    document.body.appendChild(notification);
    
    // Tampilkan dengan animasi
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Update UI admin
 */
function updateAdminUI() {
    // Set username admin
    try {
        const authData = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY));
        if (authData && authData.username) {
            const usernameElement = document.getElementById('adminUsername');
            if (usernameElement) {
                usernameElement.textContent = authData.username;
            }
        }
    } catch (error) {
        console.error('Error updating admin UI:', error);
    }
}

/**
 * Setup event listeners untuk admin
 */
function setupAdminEventListeners() {
    // Filter buttons
    const applyFilterBtn = document.getElementById('btnApplyFilter');
    const resetFilterBtn = document.getElementById('btnResetFilter');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Refresh button (jika ada)
    const refreshBtn = document.getElementById('btnRefresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrdersData);
    }
    
    // Auto-refresh setiap 30 detik
    setInterval(loadOrdersData, 30000);
    
    // Close modal dengan ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeOrderModal();
        }
    });
    
    // Close modal ketika klik di luar
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('orderDetailsModal');
        if (modal && e.target === modal) {
            closeOrderModal();
        }
    });
}

/**
 * Handle logout
 */
function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem(ADMIN_AUTH_KEY);
        window.location.href = '/login.html';
    }
}

/**
 * ============================================
 * INISIALISASI & EXPORT FUNGSI
 * ============================================
 */

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Admin Orders System - DOM Loaded');
    initializeAdminOrders();
});

// Ekspor fungsi ke global scope
window.closeOrderModal = closeOrderModal;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.viewOrderDetails = viewOrderDetails;
window.updatePaymentStatus = updatePaymentStatus;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;