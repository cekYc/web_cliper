// extension/popup.js

document.getElementById('saveBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectionHtmlAndSave, // Fonksiyon ismini değiştirdik
    });
  });
  
  function getSelectionHtmlAndSave() {
    // 1. Seçimi yakala
    const selection = window.getSelection();
  
    // Eğer seçim yoksa uyar
    if (selection.rangeCount === 0 || selection.toString().length === 0) {
      alert("Lütfen önce biçimli bir metin (kalın, linkli vs.) seçin!");
      return;
    }
  
    // 2. Seçimin aralığını (Range) al
    const range = selection.getRangeAt(0);
  
    // 3. Seçilen içeriği (HTML etiketleriyle beraber) kopyala
    const clonedSelection = range.cloneContents();
  
    // 4. Geçici bir DIV oluştur ve kopyayı içine at
    const div = document.createElement('div');
    div.appendChild(clonedSelection);
  
    // 5. Artık elimizde HTML string var! (Örn: "Merhaba <b>Dünya</b>")
    const htmlContent = div.innerHTML;
    const currentUrl = window.location.href;
  
    // Veriyi hazırla
    const data = {
      content: htmlContent, // Artık HTML gönderiyoruz
      sourceUrl: currentUrl,
      type: 'html', // Veri tipini belirttik (ileride lazım olur)
      timestamp: new Date().toISOString()
    };
  
    // Sunucuya gönder
    fetch('http://localhost:3000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      console.log("Sunucu yanıtı:", data);
      alert('Formatlı şekilde kaydedildi!');
    })
    .catch(error => {
      console.error('Hata:', error);
      alert('Hata oluştu!');
    });
  }