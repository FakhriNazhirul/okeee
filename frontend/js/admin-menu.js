/**
 * JavaScript untuk CRUD Menu Admin
 */

let currentEditId = null;
let allMenuData = [];

// Inisialisasi
async function initMenuPage() {
    await loadMenuData();
    setupEventListeners();
}

// Load data menu dari API
async function loadMenuData() {
    try {
        showLoading(true);
        
        const menuData = await apiService.getAllMenu();
        allMenuData = menuData;
        
        renderMenuTable(menuData);
        updateTotalCount(menuData.length);
        
        showLoading(false);
        
        if (menuData.length === 0) {
            showEmptyState(true);
        } else {
            showEmptyState(false);
        }
        
    } catch (error) {
        console.error('Error loading menu data:', error);
        showLoading(false);
        alert('Gagal memuat data menu. Silakan refresh halaman.');
    }
}

// Render tabel menu
function renderMenuTable(menuItems) {
    const tableBody = document.getElementById('menuTableBody');
    tableBody.innerHTML = '';
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>Tidak ada data menu</p>
                </td>
            </tr>
        `;
        return;
    }
    
    menuItems.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        
        // Format harga
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(item.harga);
        
        // Badge kategori
        let categoryClass = 'badge-coffee';
        let categoryText = 'Coffee';
        
        if (item.kategori === 'non-coffee') {
            categoryClass = 'badge-non-coffee';
            categoryText = 'Non-Coffee';
        } else if (item.kategori === 'makanan') {
            categoryClass = 'badge-makanan';
            categoryText = 'Makanan';
        }
        
        // Gambar thumbnail
        let imageHtml = '<i class="fas fa-image text-muted"></i>';
        if (item.gambar) {
            imageHtml = `<img src="/uploads/${item.gambar}" alt="${item.nama_menu}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                         onerror="this.style.display='none'; this.parentNode.innerHTML='<i class=\"fas fa-image text-muted\"></i>';">`;
        }
        
        row.innerHTML = `
            <td>
                <strong>${item.nama_menu}</strong>
                ${item.deskripsi ? `<br><small class="text-muted">${item.deskripsi.substring(0, 60)}${item.deskripsi.length > 60 ? '...' : ''}</small>` : ''}
            </td>
            <td>${formattedPrice}</td>
            <td><span class="badge ${categoryClass}">${categoryText}</span></td>
            <td>${imageHtml}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Attach event listeners untuk tombol edit/delete
    attachRowEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Tombol tambah menu
    document.getElementById('addMenuBtn').addEventListener('click', () => openMenuModal());
    document.getElementById('addFirstMenuBtn').addEventListener('click', () => openMenuModal());
    
    // Modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => closeMenuModal());
    });
    
    // Form submission
    document.getElementById('menuForm').addEventListener('submit', handleFormSubmit);
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Filter kategori
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
    
    // Close modal dengan klik di luar
    document.getElementById('menuModal').addEventListener('click', (e) => {
        if (e.target.id === 'menuModal') closeMenuModal();
    });
}

// Attach event listeners untuk tombol di setiap row
function attachRowEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.edit-btn').dataset.id);
            editMenuItem(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.delete-btn').dataset.id);
            deleteMenuItem(id);
        });
    });
}

// Open modal untuk tambah/edit
function openMenuModal(item = null) {
    const modal = document.getElementById('menuModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (item) {
        // Edit mode
        modalTitle.textContent = 'Edit Menu';
        currentEditId = item.id;
        
        // Fill form dengan data item
        document.getElementById('menuId').value = item.id;
        document.getElementById('nama_menu').value = item.nama_menu;
        document.getElementById('deskripsi').value = item.deskripsi || '';
        document.getElementById('harga').value = item.harga;
        document.getElementById('kategori').value = item.kategori;
        document.getElementById('gambar').value = item.gambar || '';
    } else {
        // Add mode
        modalTitle.textContent = 'Tambah Menu Baru';
        currentEditId = null;
        
        // Reset form
        document.getElementById('menuForm').reset();
        document.getElementById('menuId').value = '';
    }
    
    modal.style.display = 'block';
    document.getElementById('nama_menu').focus();
}

// Close modal
function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
    currentEditId = null;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nama_menu: document.getElementById('nama_menu').value.trim(),
        deskripsi: document.getElementById('deskripsi').value.trim(),
        harga: parseFloat(document.getElementById('harga').value),
        kategori: document.getElementById('kategori').value,
        gambar: document.getElementById('gambar').value.trim() || null
    };
    
    // Validasi
    if (!formData.nama_menu || !formData.harga || !formData.kategori) {
        alert('Nama menu, harga, dan kategori harus diisi!');
        return;
    }
    
    if (formData.harga < 0) {
        alert('Harga tidak boleh negatif!');
        return;
    }
    
    try {
        const saveBtn = document.getElementById('saveMenuBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        let result;
        
        if (currentEditId) {
            // Update existing
            result = await apiService.updateMenuItem(currentEditId, formData);
        } else {
            // Create new
            result = await apiService.addMenuItem(formData);
        }
        
        if (result.success) {
            alert(result.message);
            closeMenuModal();
            await loadMenuData(); // Reload data
        } else {
            alert('Gagal menyimpan data: ' + (result.message || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error saving menu:', error);
        alert('Terjadi kesalahan saat menyimpan data');
    } finally {
        const saveBtn = document.getElementById('saveMenuBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
    }
}

// Edit menu item
async function editMenuItem(id) {
    try {
        const item = allMenuData.find(menu => menu.id === id);
        if (item) {
            openMenuModal(item);
        } else {
            alert('Menu tidak ditemukan');
        }
    } catch (error) {
        console.error('Error editing menu:', error);
        alert('Gagal memuat data menu');
    }
}

// Delete menu item
async function deleteMenuItem(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
        return;
    }
    
    try {
        const item = allMenuData.find(menu => menu.id === id);
        if (!item) {
            alert('Menu tidak ditemukan');
            return;
        }
        
        const result = await apiService.deleteMenuItem(id);
        
        if (result.success) {
            alert('Menu berhasil dihapus');
            await loadMenuData(); // Reload data
        } else {
            alert('Gagal menghapus menu: ' + (result.message || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error deleting menu:', error);
        alert('Terjadi kesalahan saat menghapus data');
    }
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredData = allMenuData;
    
    // Filter by search term
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.nama_menu.toLowerCase().includes(searchTerm) ||
            (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    if (categoryFilter) {
        filteredData = filteredData.filter(item => item.kategori === categoryFilter);
    }
    
    renderMenuTable(filteredData);
    updateTotalCount(filteredData.length);
}

// Handle category filter
function handleCategoryFilter() {
    handleSearch();
}

// Update total count
function updateTotalCount(count) {
    document.getElementById('totalCount').textContent = count;
}

// Show/hide loading state
function showLoading(show) {
    const loadingEl = document.getElementById('menuLoading');
    const tableContainer = document.getElementById('menuTableContainer');
    
    if (show) {
        loadingEl.style.display = 'block';
        tableContainer.style.display = 'none';
        document.getElementById('menuEmpty').style.display = 'none';
    } else {
        loadingEl.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// Show/hide empty state
function showEmptyState(show) {
    const emptyEl = document.getElementById('menuEmpty');
    const tableContainer = document.getElementById('menuTableContainer');
    
    if (show) {
        emptyEl.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        emptyEl.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initMenuPage();
});