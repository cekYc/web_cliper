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
    statusDiv.innerText = "İşleniyor...";
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Yeni fonksiyonumuz: scrapeData
    const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: scrapeData, // İsim değişti
    });

    const result = injectionResults[0].result;

    if (!result) return;

    chrome.storage.local.get(['token'], (storage) => {
        if (!storage.token) {
            statusDiv.innerText = "Oturum süresi dolmuş.";
            return;
        }

        // Backend'e gönder
        fetch('http://localhost:3000/api/save', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storage.token}`
            },
            body: JSON.stringify(result) // Gelen sonucu direkt gönderiyoruz
        })
        .then(res => {
            if (res.status === 401) throw new Error("Yetkisiz Giriş");
            return res.json();
        })
        .then(data => {
            statusDiv.innerText = "Başarıyla Kaydedildi! ✅";
            setTimeout(() => { window.close(); }, 1500); // 1.5 sn sonra pencereyi kapat
        })
        .catch(err => {
            statusDiv.innerText = "Hata: " + err.message;
            statusDiv.className = "error";
        });
    });
});

// Tarayıcı içinde çalışacak O YENİ FONKSİYON
function scrapeData() {
    const selection = window.getSelection();
    const currentUrl = window.location.href;
    const pageTitle = document.title;

    // DURUM A: Kullanıcı bir metin seçmiş
    if (selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.appendChild(range.cloneContents());
        
        return { 
            content: div.innerHTML, 
            sourceUrl: currentUrl,
            type: 'html' // Tip: HTML
        };
    } 
    // DURUM B: Hiçbir şey seçilmemiş (Bookmark Modu)
    else {
        // İçerik olarak Sayfa Başlığını kullanıyoruz ve link ikonunu ekliyoruz
        const bookmarkContent = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">🔗</span>
                <span style="font-weight:bold; font-size:16px;">${pageTitle}</span>
            </div>
            <p style="color:#666; font-size:12px; margin-top:5px;">Sayfa yer imi olarak kaydedildi.</p>
        `;

        return {
            content: bookmarkContent,
            sourceUrl: currentUrl,
            type: 'link' // Tip: Link
        };
    }
}

// --- SCREENSHOT MODU (NATIVE & KIRPMA) ---

document.getElementById('screenshotBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Artık html2canvas yüklememize GEREK YOK.
    // Direkt seçim modunu başlat.
    chrome.storage.local.get(['token'], (storage) => {
        const token = storage.token;
        
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: initScreenshotMode,
            args: [token]
        });
        
        window.close(); 
    });
});

// SAYFA İÇİNDE ÇALIŞACAK FONKSİYON
function initScreenshotMode(token) {
    if (document.getElementById('clip-overlay')) return;

    document.body.style.cursor = 'crosshair';

    // 1. Karartma perdesi
    const overlay = document.createElement('div');
    overlay.id = 'clip-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100%'; overlay.style.height = '100%';
    overlay.style.zIndex = '2147483647'; // En üstte olsun
    overlay.style.background = 'rgba(0,0,0,0.1)'; 
    document.body.appendChild(overlay);

    const selectionBox = document.createElement('div');
    selectionBox.style.border = '2px dashed #ff0000';
    selectionBox.style.background = 'rgba(255, 0, 0, 0.1)';
    selectionBox.style.position = 'fixed';
    selectionBox.style.display = 'none';
    overlay.appendChild(selectionBox);

    let startX, startY;

    // Mouse olayları
    overlay.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    });

    overlay.addEventListener('mousemove', (e) => {
        if (selectionBox.style.display === 'none') return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        
        // Bu değerleri elemente dataset olarak yazalım, sonra okuması kolay olsun
        selectionBox.dataset.w = width;
        selectionBox.dataset.h = height;
        selectionBox.dataset.l = left;
        selectionBox.dataset.t = top;
    });

    overlay.addEventListener('mouseup', async (e) => {
        document.body.style.cursor = 'default';
        
        // 1. Koordinatları al
        const width = parseInt(selectionBox.dataset.w || 0);
        const height = parseInt(selectionBox.dataset.h || 0);
        const left = parseInt(selectionBox.dataset.l || 0);
        const top = parseInt(selectionBox.dataset.t || 0);

        if (width < 10 || height < 10) {
            overlay.remove(); 
            return;
        }

        // 2. Kırmızı kutuyu ve perdeyi GİZLE (Görünmez yap)
        overlay.style.display = 'none'; 
        // selectionBox zaten overlay'in içinde olduğu için o da gizlenir

        // 3. UFACIK BİR BEKLEME EKLE (Browser ekranı temizlesin diye)
        setTimeout(() => {
            
            // Kullanıcıya bilgi ver (Bunu overlay gizlendikten sonra ekliyoruz ki fotoda çıkmasın)
            const loading = document.createElement('div');
            loading.innerText = '📸 Fotoğraf çekiliyor...';
            loading.style = "position:fixed; top:20px; right:20px; background:#333; color:white; padding:10px; z-index:2147483647; border-radius:5px; font-family:sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);";
            document.body.appendChild(loading);

            // 4. Şimdi Fotoğrafı Çek
            chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (dataUrl) => {
                
                // Eğer hata olursa veya veri gelmezse
                if (chrome.runtime.lastError || !dataUrl) {
                    loading.innerText = '❌ Hata oluştu!';
                    console.error(chrome.runtime.lastError);
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // Retina ekranlar (Macbook/High DPI) için oran hesabı
                    const dpr = window.devicePixelRatio || 1;
                    
                    ctx.drawImage(img, 
                        left * dpr, top * dpr, width * dpr, height * dpr, 
                        0, 0, width, height
                    );

                    const croppedDataUrl = canvas.toDataURL('image/png');

                    // 5. Sunucuya Gönder
                    const content = `<img src="${croppedDataUrl}" style="max-width: 100%; border-radius: 8px;" />`;
                
                    fetch('http://localhost:3000/api/save', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            content: content,
                            sourceUrl: window.location.href,
                            type: 'image'
                        })
                    })
                    .then(res => res.json())
                    .then(() => {
                        loading.innerText = '✅ Kaydedildi!';
                        loading.style.background = 'green';
                        // İşlem bitince her şeyi temizle
                        setTimeout(() => { loading.remove(); overlay.remove(); }, 2000);
                    })
                    .catch(err => {
                        loading.innerText = '❌ Kayıt Hatası!';
                        console.error(err);
                        setTimeout(() => { loading.remove(); overlay.remove(); }, 2000);
                    });
                };
                img.src = dataUrl;
            });

        }, 150); // <-- İŞTE SİHİRLİ DOKUNUŞ: 150ms bekliyoruz ki kırmızı çizgi kaybolsun
    });
}