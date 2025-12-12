// extension/background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image-to-clipper",
    title: "Bu Resmi Koleksiyona Ekle",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-image-to-clipper") {
    
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
      fetch('http://localhost:3000/api/save', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Jeton eklendi
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
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      // Fotoğraf verisini (Base64) geri gönder
      sendResponse(dataUrl);
    });
    return true; // Asenkron yanıt vereceğimizi belirtiyoruz
  }
});