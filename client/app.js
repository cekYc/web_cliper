// --- ELEMENTLER ---
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const container = document.getElementById('card-container');

// --- SAYFA YÜKLENDİĞİNDE ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showApp(localStorage.getItem('username'));
    } else {
        showAuth();
    }
});

// --- EKRAN GEÇİŞLERİ ---
function showAuth() {
    authScreen.style.display = 'flex';
    appScreen.style.display = 'none';
}

function showApp(username) {
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    document.getElementById('display-user').innerText = username;
    fetchSnippets(); // Verileri çek
}

// --- FORM İŞLEMLERİ (Login / Register Geçişi) ---
document.getElementById('go-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('auth-title').innerText = 'Kayıt Ol';
    authError.innerText = '';
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('auth-title').innerText = 'Giriş Yap';
    authError.innerText = '';
});

// --- GİRİŞ YAPMA (LOGIN) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('l-username').value;
    const password = document.getElementById('l-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            // Jetonu tarayıcı hafızasına kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            showApp(data.username);
        } else {
            authError.innerText = data.message;
        }
    } catch (err) { authError.innerText = 'Sunucu hatası!'; }
});

// --- KAYIT OLMA (REGISTER) ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('r-username').value;
    const password = document.getElementById('r-password').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (res.ok) {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsin.');
            document.getElementById('go-to-login').click(); // Giriş formuna dön
        } else {
            const data = await res.json();
            authError.innerText = data.message;
        }
    } catch (err) { authError.innerText = 'Kayıt hatası!'; }
});

// --- ÇIKIŞ YAPMA (LOGOUT) ---
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    location.reload(); // Sayfayı yenile
});

// --- VERİLERİ ÇEKME (JETONLU) ---
async function fetchSnippets() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/list', {
            method: 'GET',
            headers: {
                // İŞTE BURASI ÖNEMLİ: Jetonu gösteriyoruz
                'Authorization': `Bearer ${token}` 
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Jeton geçersizse (süresi dolmuşsa) çıkış yap
            localStorage.removeItem('token');
            location.reload();
            return;
        }

        const snippets = await response.json();
        
        container.innerHTML = ''; // Temizle
        if (snippets.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Henüz hiç kaydın yok.</p>';
            return;
        }

        snippets.forEach(createCard); // Kartları oluştur

    } catch (error) { console.error('Hata:', error); }
}

// --- KART OLUŞTURUCU (Değişmedi) ---
function createCard(data) {
    const card = document.createElement('div');
    card.className = 'card';
    const date = new Date(data.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    let domain = '';
    try { domain = new URL(data.sourceUrl).hostname.replace('www.', ''); } catch (e) { domain = 'Link'; }

    card.innerHTML = `
        <div class="card-content">${data.content}</div>
        <div class="card-footer">
            <span class="badge">${data.type}</span>
            <a href="${data.sourceUrl}" target="_blank" style="color:#007bff; text-decoration:none;">🔗 ${domain}</a>
        </div>
    `;
    container.appendChild(card);
}