// --- ELEMENTLER ---
const loginSection = document.getElementById('login-section');
const saveSection = document.getElementById('save-section');
const loginBtn = document.getElementById('loginBtn');
const saveBtn = document.getElementById('saveBtn');
const logoutBtn = document.getElementById('logoutBtn');
const statusDiv = document.getElementById('status');
const loginMsg = document.getElementById('login-msg');

// --- BAŞLANGIÇ KONTROLÜ ---
document.addEventListener('DOMContentLoaded', () => {
    // Eklenti hafızasından token'ı kontrol et
    chrome.storage.local.get(['token', 'username'], (result) => {
        if (result.token) {
            showSaveUI(result.username);
        } else {
            showLoginUI();
        }
    });
});

// --- EKRAN GEÇİŞLERİ ---
function showLoginUI() {
    loginSection.classList.remove('hidden');
    saveSection.classList.add('hidden');
}

function showSaveUI(username) {
    loginSection.classList.add('hidden');
    saveSection.classList.remove('hidden');
    document.getElementById('display-user').innerText = username || 'Kullanıcı';
}

// --- GİRİŞ YAPMA İŞLEMİ ---
loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            // Token'ı eklenti hafızasına kaydet
            chrome.storage.local.set({ token: data.token, username: data.username }, () => {
                showSaveUI(data.username);
            });
        } else {
            loginMsg.innerText = data.message || "Giriş başarısız!";
        }
    })
    .catch(err => {
        loginMsg.innerText = "Sunucuya bağlanılamadı!";
    });
});

// --- ÇIKIŞ YAPMA ---
logoutBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
        showLoginUI();
        statusDiv.innerText = "";
    });
});

// --- KAYDETME İŞLEMİ (TOKEN İLE) ---
saveBtn.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getSelectionHtmlAndSave,
    });
});

// Tarayıcı içinde çalışacak fonksiyon
function getSelectionHtmlAndSave() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().length === 0) {
        alert("Lütfen bir metin seçin!");
        return;
    }

    const range = selection.getRangeAt(0);
    const div = document.createElement('div');
    div.appendChild(range.cloneContents());
    const htmlContent = div.innerHTML;
    const currentUrl = window.location.href;

    // Token'ı almamız lazım ama bu fonksiyon sayfa içinde çalışıyor, eklenti storage'ına erişemez.
    // O yüzden burada farklı bir trick (mesajlaşma) kullanılır ama
    // Basitlik adına token'ı chrome.storage'dan çekme işini content script'e bırakmak yerine
    // Burada fetch işlemini direkt eklenti arka planında (background) veya popup içinde yapmak daha doğrudur.
    // ANCAK: Mevcut yapımızı çok bozmamak için TOKEN'ı popup'tan bu fonksiyona argüman geçemeyiz (executeScript sınırlı).
    
    // ÇÖZÜM: Veriyi alıp popup'a geri döndüreceğiz, fetch işlemini POPUP yapacak.
    
    // Bu fonksiyon sadece datayı dönsün
    return { content: htmlContent, url: currentUrl };
}

// executeScript'i güncelliyoruz: Sonucu alıp Fetch'i burada (Popup'ta) yapıyoruz
saveBtn.addEventListener('click', async () => { // Event listener'ı üzerine yazıyoruz (yukarıdakini unut)
    statusDiv.innerText = "Kaydediliyor...";
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 1. Sayfadaki veriyi al
    const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            const selection = window.getSelection();
            if (!selection.toString()) return null;
            
            const range = selection.getRangeAt(0);
            const div = document.createElement('div');
            div.appendChild(range.cloneContents());
            return { 
                content: div.innerHTML, 
                sourceUrl: window.location.href 
            };
        }
    });

    const result = injectionResults[0].result;

    if (!result) {
        statusDiv.innerText = "Metin seçilmedi!";
        statusDiv.className = "error";
        return;
    }

    // 2. Token'ı storage'dan al
    chrome.storage.local.get(['token'], (storage) => {
        if (!storage.token) {
            statusDiv.innerText = "Oturum süresi dolmuş.";
            return;
        }

        // 3. Backend'e gönder (Yetkili İstek)
        fetch('http://localhost:3000/api/save', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storage.token}` // İşte anahtar burada!
            },
            body: JSON.stringify({
                content: result.content,
                sourceUrl: result.sourceUrl,
                type: 'html'
            })
        })
        .then(res => {
            if (res.status === 401 || res.status === 403) throw new Error("Yetkisiz Giriş");
            return res.json();
        })
        .then(data => {
            statusDiv.innerText = "Başarıyla Kaydedildi! ✅";
            statusDiv.className = "";
        })
        .catch(err => {
            console.error(err);
            statusDiv.innerText = "Hata: " + err.message;
            statusDiv.className = "error";
        });
    });
});