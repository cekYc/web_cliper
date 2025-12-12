// extension/background.js

// 1. Eklenti ilk yüklendiğinde Sağ Tık Menüsünü oluştur
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image-to-clipper",
    title: "Bu Resmi Koleksiyona Ekle",
    contexts: ["image"] // Sadece resimlerin üzerinde çıkar
  });
});

// 2. Menüye tıklandığında ne olsun?
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-image-to-clipper") {
    
    const imageUrl = info.srcUrl;
    const pageUrl = info.pageUrl;

    // Resmi HTML etiketi içine sarıp gönderiyoruz ki panelde görebilelim
    const content = `<img src="${imageUrl}" style="max-width: 100%; border-radius: 8px;" />`;

    // Sunucuya fırlat
    fetch('http://localhost:3000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content,
        sourceUrl: pageUrl,
        type: 'image'
      })
    })
    .then(response => response.json())
    .then(data => {
      // İşlem başarılıysa kullanıcıya sayfada bildirim ver
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => alert("📸 Resim Başarıyla Kaydedildi!")
      });
    })
    .catch(error => {
      console.error('Hata:', error);
    });
  }
});