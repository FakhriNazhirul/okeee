/**
 * API Service untuk Kopi Nusantara
 * Semua data berasal dari database MySQL melalui backend API
 */

const API_BASE_URL = '/api';

/**
 * Mengambil semua menu dari database
 */
async function getAllMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching all menu:', error);
        throw error;
    }
}

/**
 * Mengambil menu berdasarkan kategori
 * @param {string} kategori - 'coffee', 'non-coffee', atau 'makanan'
 */
async function getMenuByCategory(kategori) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/kategori/${kategori}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${kategori} menu:`, error);
        throw error;
    }
}

/**
 * Mengambil semua kategori yang tersedia
 */
async function getCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/kategori`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories jika API error
        return ['coffee', 'non-coffee', 'makanan'];
    }
}

/**
 * Tambah menu baru (Admin function)
 */
async function addMenuItem(menuData) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(menuData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding menu item:', error);
        throw error;
    }
}

/**
 * Update menu item (Admin function)
 */
async function updateMenuItem(id, menuData) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(menuData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating menu item:', error);
        throw error;
    }
}

/**
 * Hapus menu item (Admin function)
 */
async function deleteMenuItem(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting menu item:', error);
        throw error;
    }
}

/**
 * Search menu items
 */
async function searchMenu(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error searching menu:', error);
        throw error;
    }
}

// Ekspor semua fungsi
window.apiService = {
    getAllMenu,
    getMenuByCategory,
    getCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    searchMenu
};