// API URL - config.js'den alınır
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) || 'http://localhost:3000';

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
    document.getElementById('user-avatar').innerText = (username || 'K').charAt(0).toUpperCase();
}

function showStatus(message, isError = false) {
    statusDiv.innerText = message;
    statusDiv.className = isError ? 'show error' : 'show';
}

function showLoginError(message) {
    loginMsg.innerText = message;
    loginMsg.classList.add('show');
}

// --- GİRİŞ YAPMA İŞLEMİ ---
loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    loginMsg.classList.remove('show');

    fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            // API_URL'i de storage'a kaydet ki background script kullanabilsin
            chrome.storage.local.set({ token: data.token, username: data.username, apiUrl: API_URL }, () => {
                showSaveUI(data.username);
            });
        } else {
            showLoginError(data.message || "Giriş başarısız!");
        }
    })
    .catch(err => {
        showLoginError("Sunucuya bağlanılamadı!");
    });
});

// --- ÇIKIŞ YAPMA ---
logoutBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
        showLoginUI();
        statusDiv.className = '';
    });
});

// --- KAYDETME İŞLEMİ (TOKEN İLE) ---
saveBtn.addEventListener('click', async () => {
    showStatus("İşleniyor...");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: scrapeData,
    });

    const result = injectionResults[0].result;

    if (!result) return;

    chrome.storage.local.get(['token'], (storage) => {
        if (!storage.token) {
            showStatus("Oturum süresi dolmuş.", true);
            return;
        }

        fetch(`${API_URL}/api/save`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storage.token}`
            },
            body: JSON.stringify(result)
        })
        .then(res => {
            if (res.status === 401) throw new Error("Yetkisiz Giriş");
            return res.json();
        })
        .then(data => {
            showStatus("Başarıyla Kaydedildi! ✅");
            setTimeout(() => { window.close(); }, 1500);
        })
        .catch(err => {
            showStatus("Hata: " + err.message, true);
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

    chrome.storage.local.get(['token'], (storage) => {
        const token = storage.token;
        
        if (!token) {
            showStatus("Önce giriş yapın!", true);
            return;
        }
        
        // Token'ı storage'a kaydet ki content script erişebilsin
        chrome.storage.local.set({ screenshotToken: token }, () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: initScreenshotMode
            });
            window.close(); 
        });
    });
});

// SAYFA İÇİNDE ÇALIŞACAK FONKSİYON - Scroll destekli
function initScreenshotMode() {
    if (document.getElementById('clip-overlay')) return;

    document.body.style.cursor = 'crosshair';

    // Bilgi paneli
    const infoPanel = document.createElement('div');
    infoPanel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px;">📸 Ekran Görüntüsü Modu</div>
        <div style="font-size:12px; opacity:0.9;">• Alan seçmek için sürükleyin</div>
        <div style="font-size:12px; opacity:0.9;">• Seçim yaparken yukarı/aşağı kaydırabilirsiniz</div>
        <div style="font-size:12px; opacity:0.9;">• ESC ile iptal edin</div>
    `;
    infoPanel.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
        padding: 16px 24px; z-index: 2147483647; border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3); pointer-events: none;
    `;
    document.body.appendChild(infoPanel);

    // Overlay - absolute position ile tüm sayfa
    const overlay = document.createElement('div');
    overlay.id = 'clip-overlay';
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; 
        width: 100%; min-height: 100vh;
        height: ${Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)}px;
        z-index: 2147483646; background: rgba(0,0,0,0.2); cursor: crosshair;
    `;
    document.body.appendChild(overlay);

    // Seçim kutusu - absolute position
    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        border: 3px solid #6366f1; background: rgba(99, 102, 241, 0.1);
        position: absolute; display: none; pointer-events: none;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
    `;
    overlay.appendChild(selectionBox);

    // Boyut göstergesi - fixed position
    const sizeIndicator = document.createElement('div');
    sizeIndicator.style.cssText = `
        position: fixed; background: #6366f1; color: white;
        padding: 4px 8px; border-radius: 4px; font-size: 12px;
        font-family: monospace; pointer-events: none; display: none;
        z-index: 2147483647;
    `;
    document.body.appendChild(sizeIndicator);

    // Başlangıç koordinatları (sayfa koordinatları olarak)
    let startPageX, startPageY;
    let currentPageX, currentPageY;
    let isSelecting = false;

    // ESC tuşu ile iptal
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    function cleanup() {
        document.body.style.cursor = 'default';
        overlay.remove();
        infoPanel.remove();
        sizeIndicator.remove();
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    // Seçim kutusunu güncelle
    function updateSelectionBox() {
        if (!isSelecting) return;
        
        const left = Math.min(startPageX, currentPageX);
        const top = Math.min(startPageY, currentPageY);
        const width = Math.abs(currentPageX - startPageX);
        const height = Math.abs(currentPageY - startPageY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        
        // Boyut göstergesini güncelle (mouse yanında, fixed)
        sizeIndicator.innerText = `${width} × ${height}`;
        sizeIndicator.style.left = (currentPageX - window.scrollX + 15) + 'px';
        sizeIndicator.style.top = (currentPageY - window.scrollY - 30) + 'px';
    }

    function handleMouseMove(e) {
        if (!isSelecting) return;
        
        // Sayfa koordinatları
        currentPageX = e.pageX;
        currentPageY = e.pageY;
        
        updateSelectionBox();
    }

    async function handleMouseUp(e) {
        if (!isSelecting) return;
        isSelecting = false;
        document.body.style.cursor = 'default';
        
        // Final koordinatları hesapla
        const left = Math.min(startPageX, currentPageX);
        const top = Math.min(startPageY, currentPageY);
        const right = Math.max(startPageX, currentPageX);
        const bottom = Math.max(startPageY, currentPageY);
        const width = right - left;
        const height = bottom - top;

        if (width < 10 || height < 10) {
            cleanup();
            return;
        }

        // Overlay ve indicator'ı gizle
        overlay.style.display = 'none';
        infoPanel.style.display = 'none';
        sizeIndicator.style.display = 'none';

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dpr = window.devicePixelRatio || 1;
        
        // Kaç tane capture gerekiyor?
        const capturesNeeded = Math.ceil(height / viewportHeight);
        
        const loading = document.createElement('div');
        loading.textContent = `📸 Fotoğraf çekiliyor... (0/${capturesNeeded})`;
        loading.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; padding: 16px 24px; z-index: 2147483647;
            border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(loading);

        // Final canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width * dpr;
        finalCanvas.height = height * dpr;
        const finalCtx = finalCanvas.getContext('2d');
        
        const originalScroll = window.scrollY;
        let captureIndex = 0;
        
        // Her viewport için capture al
        const captureAt = (scrollY) => {
            return new Promise((resolve) => {
                window.scrollTo(0, scrollY);
                
                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (dataUrl) => {
                        if (chrome.runtime.lastError || !dataUrl) {
                            resolve(null);
                            return;
                        }
                        
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = () => resolve(null);
                        img.src = dataUrl;
                    });
                }, 200);
            });
        };
        
        // Yukarıdan aşağıya capture al
        for (let y = top; y < bottom; y += viewportHeight) {
            const scrollTo = Math.max(0, y);
            const img = await captureAt(scrollTo);
            
            if (!img) {
                loading.innerHTML = '❌ Ekran görüntüsü alınamadı!';
                loading.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                setTimeout(() => { loading.remove(); cleanup(); }, 2000);
                return;
            }
            
            const actualScrollY = window.scrollY;
            
            // Bu capture'dan hangi kısmı alacağız?
            // Seçim alanının bu viewport'taki kısmı
            const viewportTop = actualScrollY;
            const viewportBottom = actualScrollY + viewportHeight;
            
            // Seçim ile viewport'un kesişimi
            const intersectTop = Math.max(top, viewportTop);
            const intersectBottom = Math.min(bottom, viewportBottom);
            const intersectLeft = left;
            const intersectRight = right;
            
            if (intersectTop < intersectBottom) {
                // Capture'daki koordinatlar (viewport relative)
                const srcX = (intersectLeft) * dpr;
                const srcY = (intersectTop - actualScrollY) * dpr;
                const srcW = (intersectRight - intersectLeft) * dpr;
                const srcH = (intersectBottom - intersectTop) * dpr;
                
                // Final canvas'taki koordinatlar
                const destX = 0;
                const destY = (intersectTop - top) * dpr;
                const destW = srcW;
                const destH = srcH;
                
                finalCtx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
            }
            
            captureIndex++;
            loading.textContent = `📸 Fotoğraf çekiliyor... (${captureIndex}/${capturesNeeded})`;
        }
        
        // Scroll'u geri al
        window.scrollTo(0, originalScroll);
        
        // Kaydet
        const croppedDataUrl = finalCanvas.toDataURL('image/png');
        const content = `<img src="${croppedDataUrl}" style="max-width: 100%; border-radius: 8px;" />`;
        const sourceUrl = window.location.href;

        chrome.storage.local.get(['screenshotToken'], (storage) => {
            const token = storage.screenshotToken;
            
            if (!token) {
                loading.innerHTML = '❌ Oturum bulunamadı!';
                loading.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                setTimeout(() => { loading.remove(); cleanup(); }, 2000);
                return;
            }

            chrome.runtime.sendMessage({
                action: "saveScreenshot",
                token: token,
                content: content,
                sourceUrl: sourceUrl
            }, (response) => {
                if (chrome.runtime.lastError) {
                    loading.innerHTML = '❌ Bağlantı hatası!';
                    loading.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                    setTimeout(() => { loading.remove(); cleanup(); }, 2000);
                    return;
                }
                
                if (response && response.success) {
                    loading.innerHTML = '✅ Kaydedildi!';
                    loading.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    setTimeout(() => { loading.remove(); cleanup(); }, 1500);
                } else {
                    loading.textContent = '❌ Kayıt Hatası: ' + (response?.error || 'Bilinmeyen hata');
                    loading.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                    setTimeout(() => { loading.remove(); cleanup(); }, 2000);
                }
            });
        });
    }

    overlay.addEventListener('mousedown', (e) => {
        isSelecting = true;
        // Sayfa koordinatlarını kullan (scroll dahil)
        startPageX = e.pageX;
        startPageY = e.pageY;
        currentPageX = e.pageX;
        currentPageY = e.pageY;
        
        selectionBox.style.left = startPageX + 'px';
        selectionBox.style.top = startPageY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
        sizeIndicator.style.display = 'block';
        infoPanel.style.display = 'none';
        
        // Document seviyesinde dinle (overlay dışına çıksa bile)
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}