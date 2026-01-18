/**
 * api.js - Modul Pusat Komunikasi API
 * Menghubungkan ke server backend di port 5000
 */
const BASE_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
    // Menggunakan 'access_token' agar konsisten dengan auth.js
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Sisipkan JWT Token jika tersedia untuk rute yang diproteksi
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        const result = await response.json();

        if (!response.ok) {
            // Melempar error dengan pesan dari server jika ada
            throw new Error(result.message || 'Gagal terhubung ke server');
        }
        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        throw error;
    }
}