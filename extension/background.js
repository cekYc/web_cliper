// extension/background.js

// Default API URL - storage'dan alınacak, yoksa default kullanılacak
const DEFAULT_API_URL = 'http://localhost:3000';

// API URL'i al
async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl'], (result) => {
      resolve(result.apiUrl || DEFAULT_API_URL);
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image-to-clipper",
    title: "Bu Resmi Koleksiyona Ekle",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-image-to-clipper") {
    const apiUrl = await getApiUrl();
    
    // 1. Önce Token'ı Al
    chrome.storage.local.get(['token'], (result) => {
      const token = result.token;

      if (!token) {
        // Eğer giriş yapılmamışsa uyarı ver
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => alert("⚠️ Lütfen önce eklenti ikonuna tıklayıp giriş yapın!")
        });
        return;
      }

      const imageUrl = info.srcUrl;
      const pageUrl = info.pageUrl;
      const content = `<img src="${imageUrl}" style="max-width: 100%; border-radius: 8px;" />`;

      // 2. Token ile birlikte gönder
      fetch(`${apiUrl}/api/save`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          sourceUrl: pageUrl,
          type: 'image'
        })
      })
      .then(response => {
          if(response.ok) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => alert("📸 Resim Koleksiyona Eklendi!")
            });
          } else {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => alert("❌ Kayıt başarısız! Oturumunuzu kontrol edin.")
            });
          }
      })
      .catch(error => console.error('Hata:', error));
    });
  }
});


// YENİ: Ekran Görüntüsü Mesajını Dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    // Aktif sekmenin görünür kısmının fotoğrafını çek (Native Chrome API)
    chrome.tabs.captureVisibleTab(null, { format: "png", quality: 100 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Screenshot error:", chrome.runtime.lastError);
        sendResponse(null);
        return;
      }
      // Fotoğraf verisini (Base64) geri gönder
      sendResponse(dataUrl);
    });
    return true; // Asenkron yanıt vereceğimizi belirtiyoruz
  }
  
  // YENİ: Screenshot'ı sunucuya kaydet (CORS sorunu yaşamamak için background'dan)
  if (request.action === "saveScreenshot") {
    // API URL'i storage'dan al
    chrome.storage.local.get(['apiUrl'], (result) => {
      const apiUrl = result.apiUrl || DEFAULT_API_URL;
      
      fetch(`${apiUrl}/api/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.token}`
        },
        body: JSON.stringify({
          content: request.content,
          sourceUrl: request.sourceUrl,
          type: 'image'
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Kayıt başarısız');
        return res.json();
      })
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('Save error:', err);
        sendResponse({ success: false, error: err.message });
      });
    });
    return true; // Asenkron yanıt
  }
});