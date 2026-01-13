// Service untuk semua API calls ke backend
const API_BASE = '/api';

class ApiService {
    // Generic fetch method
    static async fetch(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        // Add token jika ada
        const token = localStorage.getItem('token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...defaultOptions,
            ...options,
        };
        
        try {
            const response = await fetch(url, config);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Menu endpoints
    static async getMenus() {
        return await this.fetch('/menu');
    }
    
    static async getMenu(id) {
        return await this.fetch(`/menu/${id}`);
    }
    
    // Auth endpoints
    static async login(username, password) {
        return await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
    
    static async register(userData) {
        return await this.fetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    // Health check
    static async health() {
        return await this.fetch('/health');
    }
}

// Export global
window.ApiService = ApiService;