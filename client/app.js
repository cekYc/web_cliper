const container = document.getElementById('card-container');

// Sayfa yüklenince verileri çek
window.addEventListener('DOMContentLoaded', fetchSnippets);

async function fetchSnippets() {
    try {
        const response = await fetch('/api/list');
        const snippets = await response.json();

        // Eğer hiç veri yoksa
        if (snippets.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%;">Henüz hiç kayıt yok. Eklentiyi kullanarak bir şeyler kaydet!</p>';
            return;
        }

        // Verileri döngüye al ve kart oluştur
        snippets.forEach(snippet => {
            createCard(snippet);
        });

    } catch (error) {
        console.error('Veri çekme hatası:', error);
        container.innerHTML = '<p>Veriler yüklenirken bir hata oluştu.</p>';
    }
}

function createCard(data) {
    const card = document.createElement('div');
    card.className = 'card';

    // Tarihi güzelleştir (Örn: 12 Ekim 2025)
    const date = new Date(data.timestamp).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    // Kaynak site ismini kısalt (https://www.google.com/blabla -> google.com)
    let domain = '';
    try {
        domain = new URL(data.sourceUrl).hostname.replace('www.', '');
    } catch (e) { domain = 'Bilinmiyor'; }

    card.innerHTML = `
        <div class="card-content">
            ${data.content}
        </div>
        <div class="card-footer">
            <div>
                <span class="badge">${data.type}</span>
                <span style="margin-left:5px;">${date}</span>
            </div>
            <a href="${data.sourceUrl}" target="_blank" class="source-link" title="Kaynağa Git">
                🔗 ${domain}
            </a>
        </div>
    `;

    container.appendChild(card);
}