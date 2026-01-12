/**
 * menu.js - Logika Manajemen Menu Landing Page
 * Mengambil data dari MySQL dan me-render ke UI dengan struktur original
 */
async function loadMenuToUI() {
    const menuContainer = document.querySelector('.menu-countainer');
    if (!menuContainer) return;

    try {
        // Memanggil endpoint GET /api/menu menggunakan fungsi dari api.js
        const response = await apiRequest('/menu'); 
        
        if (response.success && response.data) {
            // Bersihkan container sebelum mengisi data dinamis
            menuContainer.innerHTML = ''; 

            response.data.forEach(item => {
                /**
                 * Struktur HTML di bawah ini dibuat sama persis dengan 
                 * data dummy original agar CSS style.css berfungsi sempurna
                 */
                menuContainer.innerHTML += `
                    <div class="menu-card">
                        <div class="menu-icon">
                            <img src="${item.imageUrl}" alt="${item.name}">
                        </div>
                        <div class="menu-harga">
                            <p>${item.name}</p>
                            <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="menu-caption">${item.description}</div>
                    </div>`;
            });
        }
    } catch (error) {
        console.error("Gagal memuat menu:", error.message);
        menuContainer.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: #666;">
            Gagal memuat menu saat ini. Silakan coba lagi nanti.
        </p>`;
    }
}

// Jalankan fungsi saat seluruh elemen DOM selesai dimuat
document.addEventListener('DOMContentLoaded', loadMenuToUI);