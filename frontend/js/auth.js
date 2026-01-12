/**
 * auth.js - Logika Autentikasi Admin
 * Menangani login dan proteksi halaman admin
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Memanggil endpoint POST /api/auth/login
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ 
                username: usernameInput, 
                password: passwordInput 
            })
        });

        if (response.success) {
            // Simpan token JWT dan info user di storage
            localStorage.setItem('access_token', response.token);
            localStorage.setItem('admin_user', JSON.stringify(response.user));
            
            alert('Login Berhasil!');
            window.location.href = 'admin/dashboard.html';
        }
    } catch (error) {
        alert(`Login Gagal: ${error.message}`);
    }
}

function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_user');
    window.location.href = '../login.html';
}

// Proteksi halaman admin: Cek apakah user sudah login
function checkAuth() {
    const token = localStorage.getItem('access_token');
    const currentPage = window.location.pathname;

    if (currentPage.includes('admin') && !token) {
        window.location.href = '../login.html';
    }
}