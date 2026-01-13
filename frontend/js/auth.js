/**
 * Sistem Autentikasi untuk Kopi Nusantara
 * File: js/auth.js
 */

// Konfigurasi API
const API_BASE_URL = 'http://localhost:3000/api'; // Ganti dengan URL backend Anda

// State autentikasi
let isLoggingIn = false;

/**
 * Inisialisasi halaman login
 */
function initLoginPage() {
    // Cek jika user sudah login
    if (checkIfLoggedIn()) {
        redirectToDashboard();
        return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Fokus ke input username
    document.getElementById('username').focus();
}

/**
 * Setup semua event listeners
 */
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const forgotPassword = document.getElementById('forgotPassword');
    
    // Submit form login
    loginForm.addEventListener('submit', handleLoginSubmit);
    
    // Toggle show/hide password
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }
    
    // Forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', handleForgotPassword);
    }
    
    // Hide error message ketika user mulai mengetik
    const inputs = document.querySelectorAll('#username, #password');
    inputs.forEach(input => {
        input.addEventListener('input', hideErrorMessage);
    });
}

/**
 * Handle submit form login
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    if (isLoggingIn) return;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // Validasi input
    if (!validateLoginInput(username, password)) {
        return;
    }
    
    // Tampilkan loading state
    setLoginButtonState(true);
    
    try {
        // Coba login dengan API
        const loginResult = await attemptLogin(username, password);
        
        if (loginResult.success) {
            // Simpan session
            saveLoginSession(username, rememberMe, loginResult.token);
            
            // Redirect ke dashboard admin
            redirectToDashboard();
        } else {
            // Tampilkan error
            showErrorMessage(loginResult.message || 'Login gagal');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        // Reset loading state
        setLoginButtonState(false);
    }
}

/**
 * Validasi input login
 */
function validateLoginInput(username, password) {
    hideErrorMessage();
    
    if (!username) {
        showErrorMessage('Username tidak boleh kosong');
        document.getElementById('username').focus();
        return false;
    }
    
    if (!password) {
        showErrorMessage('Password tidak boleh kosong');
        document.getElementById('password').focus();
        return false;
    }
    
    if (password.length < 6) {
        showErrorMessage('Password minimal 6 karakter');
        document.getElementById('password').focus();
        return false;
    }
    
    return true;
}

/**
 * Coba login dengan API
 */
async function attemptLogin(username, password) {
    // Jika API tidak tersedia, gunakan fallback untuk development
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.warn('API not available, using fallback authentication');
        
        // Fallback untuk development
        // HANYA UNTUK DEMO - HAPUS DI PRODUKSI
        if (username === 'admin' && password === 'admin123') {
            return {
                success: true,
                message: 'Login berhasil',
                token: 'demo-token-' + Date.now(),
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    name: 'Administrator'
                }
            };
        } else {
            return {
                success: false,
                message: 'Username atau password salah'
            };
        }
    }
}

/**
 * Simpan session login
 */
function saveLoginSession(username, rememberMe, token) {
    const sessionData = {
        isLoggedIn: true,
        username: username,
        role: 'admin',
        token: token,
        loginTime: new Date().toISOString()
    };
    
    // Gunakan localStorage atau sessionStorage berdasarkan "Remember Me"
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('auth', JSON.stringify(sessionData));
    
    // Juga simpan di localStorage untuk cek login di halaman lain
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'admin');
}

/**
 * Cek apakah user sudah login
 */
function checkIfLoggedIn() {
    const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
    
    if (!authData) {
        return false;
    }
    
    try {
        const auth = JSON.parse(authData);
        
        // Cek expiry (contoh: 24 jam)
        const loginTime = new Date(auth.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            // Session expired
            logout();
            return false;
        }
        
        return auth.isLoggedIn && auth.role === 'admin';
    } catch (error) {
        return false;
    }
}

/**
 * Redirect ke dashboard admin
 */
function redirectToDashboard() {
    window.location.href = 'admin/dashboard.html';
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    
    // Redirect ke halaman login
    window.location.href = 'login.html';
}

/**
 * Toggle show/hide password
 */
function togglePasswordVisibility(passwordInput, toggleIcon) {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Ganti icon
    toggleIcon.classList.toggle('fa-eye');
    toggleIcon.classList.toggle('fa-eye-slash');
}

/**
 * Handle lupa password
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Masukkan email yang terdaftar:');
    
    if (email) {
        alert(`Instruksi reset password telah dikirim ke ${email}.\n\nIni hanya simulasi. Di implementasi nyata, ini akan mengirim email reset password.`);
        
        // Di implementasi nyata, ini akan memanggil API
        // resetPasswordRequest(email);
    }
}

/**
 * Tampilkan error message
 */
function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.style.display = 'flex';
    }
}

/**
 * Sembunyikan error message
 */
function hideErrorMessage() {
    const errorElement = document.getElementById('errorMessage');
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Set state tombol login (loading/active)
 */
function setLoginButtonState(loading) {
    const loginButton = document.getElementById('loginButton');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    isLoggingIn = loading;
    
    if (loginButton) {
        loginButton.disabled = loading;
    }
    
    if (btnText) {
        btnText.style.display = loading ? 'none' : 'inline';
    }
    
    if (loadingSpinner) {
        loadingSpinner.style.display = loading ? 'inline-block' : 'none';
    }
}

/**
 * Fungsi untuk logout dari halaman lain
 * Dapat dipanggil dari halaman admin
 */
function logoutUser() {
    logout();
}

/**
 * Cek apakah user adalah admin (untuk halaman admin)
 */
function isAdmin() {
    return checkIfLoggedIn();
}

/**
 * Protect admin page (untuk digunakan di halaman admin)
 */
function protectAdminPage() {
    if (!isAdmin()) {
        alert('Anda harus login sebagai admin untuk mengakses halaman ini.');
        window.location.href = '../login.html';
    }
}

// Ekspor fungsi untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        logoutUser,
        isAdmin,
        protectAdminPage,
        checkIfLoggedIn
    };
} else {
    window.logoutUser = logoutUser;
    window.isAdmin = isAdmin;
    window.protectAdminPage = protectAdminPage;
    window.checkIfLoggedIn = checkIfLoggedIn;
}