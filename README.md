# 🧠 Web Clipper - Dijital Beyin

Web'den içerik toplamanızı sağlayan modern bir web clipper uygulaması. Metinleri, görselleri ve ekran görüntülerini kategorize ederek saklayın.

![Web Clipper](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Özellikler

- 📋 **Metin Kaydetme** - Seçili metinleri kaydedin
- �� **Ekran Görüntüsü** - Scroll destekli alan seçip kaydedin
- 🖼️ **Resim Kaydetme** - Sağ tık ile resimleri kaydedin
- 📁 **Kategori Sistemi** - İçerikleri kategorilere ayırın
- 🌙 **Koyu Mod** - Göz yormayan karanlık tema
- 🔐 **Kullanıcı Sistemi** - JWT tabanlı kimlik doğrulama
- 🔍 **Arama & Filtreleme** - İçeriklerinizi kolayca bulun

## 🛠️ Teknolojiler

### Backend
- Node.js & Express 5
- MongoDB & Mongoose
- JWT Authentication
- Helmet (güvenlik)

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Lucide Icons

### Extension
- Chrome Manifest V3
- Service Worker

---

## �� Kurulum (Lokal Geliştirme)

### 1. Repoyu klonlayın
\`\`\`bash
git clone https://github.com/cekYc/web-clipper.git
cd web-clipper
\`\`\`

### 2. MongoDB'yi başlatın
\`\`\`bash
# Docker ile
docker run -d -p 27017:27017 --name mongodb mongo

# veya lokal MongoDB kurulumu
mongod
\`\`\`

### 3. Backend'i başlatın
\`\`\`bash
cd server
npm install
cp .env.example .env  # Düzenleyin
npm start
\`\`\`

### 4. Frontend'i başlatın
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

### 5. Extension'ı yükleyin
1. Chrome'da \`chrome://extensions\` adresine gidin
2. "Geliştirici modu"nu açın
3. "Paketlenmemiş öğe yükle" tıklayın
4. \`extension\` klasörünü seçin

---

## 🌐 Production Deployment

### Adım 1: MongoDB Atlas (Ücretsiz)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Yeni bir cluster oluşturun (M0 Free Tier)
3. Database Access'ten kullanıcı ekleyin
4. Network Access'ten \`0.0.0.0/0\` IP'sini ekleyin
5. Connection string'i kopyalayın:
   \`\`\`
   mongodb+srv://USERNAME:PASSWORD@cluster.xxxxx.mongodb.net/webclipper?retryWrites=true&w=majority
   \`\`\`

### Adım 2: Backend - Render.com (Ücretsiz)

1. [Render.com](https://render.com) hesabı oluşturun
2. "New" → "Web Service" seçin
3. GitHub reponuzu bağlayın
4. Ayarlar:
   - **Name**: \`web-clipper-api\`
   - **Root Directory**: \`server\`
   - **Runtime**: \`Node\`
   - **Build Command**: \`npm install\`
   - **Start Command**: \`npm start\`
5. Environment Variables ekleyin:
   \`\`\`
   MONGODB_URI=mongodb+srv://...
   SECRET_KEY=your-super-secret-key-123
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   \`\`\`
6. Deploy edin ve URL'yi kopyalayın (örn: \`https://web-clipper-api.onrender.com\`)

### Adım 3: Frontend - Vercel (Ücretsiz)

1. [Vercel.com](https://vercel.com) hesabı oluşturun
2. "New Project" → GitHub reponuzu import edin
3. Ayarlar:
   - **Framework Preset**: Vite
   - **Root Directory**: \`client\`
4. Environment Variables ekleyin:
   \`\`\`
   VITE_API_URL=https://web-clipper-api.onrender.com
   \`\`\`
5. Deploy edin

### Adım 4: Extension'ı Güncelleyin

1. \`extension/config.js\` dosyasını düzenleyin:
   \`\`\`javascript
   const CONFIG = {
     API_URL: 'https://web-clipper-api.onrender.com'
   };
   \`\`\`

2. Extension'ı Chrome Web Store'a yükleyin (isteğe bağlı):
   - [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - $5 tek seferlik ücret

---

## 📁 Proje Yapısı

\`\`\`
web-clipper/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── context/       # Auth & Theme context
│   │   └── lib/           # API utilities
│   └── package.json
│
├── server/                 # Express Backend
│   ├── server.js          # Ana sunucu dosyası
│   ├── .env.example       # Environment örneği
│   └── package.json
│
├── extension/              # Chrome Extension
│   ├── manifest.json
│   ├── popup.html/js
│   ├── background.js
│   └── config.js          # API URL config
│
└── README.md
\`\`\`

---

## 🔧 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | \`/api/register\` | Yeni kullanıcı kayıt |
| POST | \`/api/login\` | Giriş yap |
| GET | \`/api/snippets\` | Kayıtları listele |
| POST | \`/api/save\` | Yeni kayıt ekle |
| DELETE | \`/api/snippets/:id\` | Kayıt sil |
| PATCH | \`/api/snippets/:id/category\` | Kategori güncelle |
| GET | \`/api/categories\` | Kategorileri listele |
| POST | \`/api/categories\` | Kategori ekle |
| PUT | \`/api/categories/:id\` | Kategori güncelle |
| DELETE | \`/api/categories/:id\` | Kategori sil |

---

## �� Lisans

MIT License

---

⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!
