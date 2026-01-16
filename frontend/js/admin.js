/**
 * Admin JavaScript untuk CRUD menu
 */

let currentEditId = null;

// Inisialisasi halaman admin
async function initAdminMenu() {
    await loadMenuTable();
    setupFormEvents();
}

// Load data menu ke tabel
async function loadMenuTable() {
    try {
        const menuItems = await apiService.getAllMenu();
        renderMenuTable(menuItems);
    } catch (error) {
        console.error('Error loading menu:', error);
        alert('Gagal memuat data menu');
    }
}

// Render tabel menu
function renderMenuTable(menuItems) {
    const tbody = document.querySelector('#menuTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    menuItems.forEach(item => {
        const row = document.createElement('tr');
        
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(item.harga);
        
        row.innerHTML = `
            <td>${item.nama_menu}</td>
            <td>${formattedPrice}</td>
            <td>
                <span class="category-badge category-${item.kategori}">
                    ${item.kategori}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editMenuItem(${item.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Setup form events
function setupFormEvents() {
    const form = document.getElementById('menuForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Handle form submit (Create/Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nama_menu: document.getElementById('nama_menu').value,
        deskripsi: document.getElementById('deskripsi').value,
        harga: parseFloat(document.getElementById('harga').value),
        kategori: document.getElementById('kategori').value,
        gambar: document.getElementById('gambar').value || null
    };
    
    try {
        if (currentEditId) {
            // Update existing item
            await apiService.updateMenuItem(currentEditId, formData);
            alert('Menu berhasil diupdate!');
        } else {
            // Create new item
            await apiService.addMenuItem(formData);
            alert('Menu berhasil ditambahkan!');
        }
        
        // Reset form
        resetForm();
        // Reload table
        await loadMenuTable();
        
    } catch (error) {
        console.error('Error saving menu:', error);
        alert('Gagal menyimpan menu');
    }
}

// Edit menu item
async function editMenuItem(id) {
    try {
        const allMenu = await apiService.getAllMenu();
        const item = allMenu.find(menu => menu.id === id);
        
        if (!item) {
            alert('Menu tidak ditemukan');
            return;
        }
        
        // Fill form with item data
        document.getElementById('nama_menu').value = item.nama_menu;
        document.getElementById('deskripsi').value = item.deskripsi || '';
        document.getElementById('harga').value = item.harga;
        document.getElementById('kategori').value = item.kategori;
        document.getElementById('gambar').value = item.gambar || '';
        
        // Set current edit ID
        currentEditId = id;
        
        // Scroll to form
        document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth' });
        
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
        await apiService.deleteMenuItem(id);
        alert('Menu berhasil dihapus!');
        await loadMenuTable();
    } catch (error) {
        console.error('Error deleting menu:', error);
        alert('Gagal menghapus menu');
    }
}

// Reset form
function resetForm() {
    document.getElementById('menuForm').reset();
    currentEditId = null;
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initAdminMenu();
});