class MenuService {
    static async loadMenus() {
        try {
            const result = await ApiService.getAllMenus();
            
            if (result.success) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('Failed to load menus:', error);
            return [];
        }
    }

    static displayMenus(menus, containerId = 'menu-container') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (menus.length === 0) {
            container.innerHTML = '<p class="no-data">No menus available</p>';
            return;
        }
        
        menus.forEach(menu => {
            const menuCard = this.createMenuCard(menu);
            container.appendChild(menuCard);
        });
    }

    static createMenuCard(menu) {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <img src="${menu.imageUrl || 'assets/images/default-coffee.jpg'}" 
                 alt="${menu.name}" 
                 onerror="this.src='assets/images/default-coffee.jpg'">
            <div class="menu-info">
                <h3>${menu.name}</h3>
                <p class="description">${menu.description || 'No description available'}</p>
                <div class="menu-footer">
                    <span class="price">Rp ${menu.price.toLocaleString()}</span>
                    <button class="btn-order" onclick="MenuService.orderMenu(${menu.id})">
                        Order Now
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    static async orderMenu(menuId) {
        if (!AuthService.checkAuth()) return;
        
        try {
            // Get menu details
            const menu = await ApiService.getMenuById(menuId);
            
            // Add to cart (simplified - you might have a cart system)
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            cart.push({
                id: menu.data.id,
                name: menu.data.name,
                price: menu.data.price,
                quantity: 1,
                imageUrl: menu.data.imageUrl
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            
            alert(`${menu.data.name} added to cart!`);
            
            // Update cart count
            this.updateCartCount();
        } catch (error) {
            console.error('Order error:', error);
            alert('Failed to add item to cart');
        }
    }

    static updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = cart.length;
            element.style.display = cart.length > 0 ? 'inline' : 'none';
        });
    }

    // Admin functions
    static async loadMenusForAdmin() {
        try {
            const result = await ApiService.getAllMenus();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Failed to load menus for admin:', error);
            return [];
        }
    }

    static displayMenusForAdmin(menus, containerId = 'admin-menu-list') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        menus.forEach(menu => {
            const row = this.createAdminMenuRow(menu);
            container.appendChild(row);
        });
    }

    static createAdminMenuRow(menu) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${menu.id}</td>
            <td>
                <img src="${menu.imageUrl || 'assets/images/default-coffee.jpg'}" 
                     alt="${menu.name}" 
                     class="menu-thumbnail"
                     onerror="this.src='assets/images/default-coffee.jpg'">
            </td>
            <td>${menu.name}</td>
            <td>${menu.description?.substring(0, 50)}${menu.description?.length > 50 ? '...' : ''}</td>
            <td>Rp ${menu.price.toLocaleString()}</td>
            <td>
                <button class="btn-edit" onclick="MenuService.editMenu(${menu.id})">Edit</button>
                <button class="btn-delete" onclick="MenuService.deleteMenuAdmin(${menu.id})">Delete</button>
            </td>
        `;
        return row;
    }

    static async deleteMenuAdmin(menuId) {
        if (!confirm('Are you sure you want to delete this menu?')) return;
        
        try {
            await ApiService.deleteMenu(menuId);
            alert('Menu deleted successfully');
            window.location.reload();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete menu');
        }
    }
}

// Make it available globally
window.MenuService = MenuService;