const BASE_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
    // Standarisasi menggunakan 'access_token'
    const token = localStorage.getItem('access_token'); 
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal terhubung ke server');
        }
        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        throw error;
    }
}