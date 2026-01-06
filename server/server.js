// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'cok-gizli-bir-anahtar-kelime';

// Güvenlik başlıkları
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS yapılandırması - Dinamik origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Extension'dan gelen istekler origin olmadan gelir
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Production'da tüm originlere izin ver (extension için)
    }
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Production'da build klasörünü serve et (sadece dosyalar varsa)
const clientDistPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// --- VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webclipper')
  .then(() => console.log('✅ MongoDB Bağlantısı Başarılı!'))
  .catch(err => console.error('❌ MongoDB Hatası:', err));

// --- MODELLER (ŞEMALAR) ---

// 1. KULLANICI MODELİ
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. KATEGORİ MODELİ
const CategorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: '📁' }
});
const Category = mongoose.model('Category', CategorySchema);

// 3. İÇERİK (SNIPPET) MODELİ
const SnippetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    sourceUrl: String,
    type: { type: String, default: 'text' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    timestamp: { type: Date, default: Date.now }
});
const Snippet = mongoose.model('Snippet', SnippetSchema);

// --- ARA YAZILIM (MIDDLEWARE - BEKÇİ) ---
// Bu fonksiyon, gelen istekte geçerli bir token var mı diye bakar.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Header genelde "Bearer <token>" şeklinde gelir
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Jeton yok, giriş yasak!' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Jeton geçersiz!' });
        
        // Jeton doğruysa, içindeki kullanıcı bilgisini isteğe ekle
        req.user = user;
        next(); // İçeri geçmesine izin ver
    });
};

// --- ROTALAR (ENDPOINTS) ---

// 1. KAYIT OL (REGISTER)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Şifreyi hashle (karıştır)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ message: 'Kullanıcı oluşturuldu!' });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı adı alınmış olabilir veya hata oluştu.' });
    }
});

// 2. GİRİŞ YAP (LOGIN)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(400).json({ message: 'Kullanıcı bulunamadı!' });

        // Şifreleri karşılaştır
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Şifre yanlış!' });

        // Jeton (Token) oluştur
        const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. İÇERİK KAYDET (KORUMALI ROTA)
// Araya 'authenticateToken' koyduk. Artık sadece giriş yapanlar kaydedebilir.
app.post('/api/save', authenticateToken, async (req, res) => {
    try {
        const { content, sourceUrl, type } = req.body;
        
        const newSnippet = new Snippet({
            userId: req.user.id, // Jeton'dan gelen user id'yi kullanıyoruz
            content,
            sourceUrl,
            type
        });

        await newSnippet.save();
        res.json({ status: 'success', message: 'Kaydedildi!' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Kaydedilemedi' });
    }
});

// 4. LİSTELE (KORUMALI ROTA)
// Sadece giriş yapan kullanıcının KENDİ verilerini getirir.
app.get('/api/list', authenticateToken, async (req, res) => {
    try {
        // Snippet.find({ userId: req.user.id }) -> Sadece benimkileri bul
        const snippets = await Snippet.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: 'Veriler çekilemedi' });
    }
});

app.listen(PORT, () => {
    console.log(`� Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});

// 5. İÇERİK SİL (DELETE)
app.delete('/api/delete/:id', authenticateToken, async (req, res) => {
    try {
        const snippetId = req.params.id;
        const userId = req.user.id;

        const result = await Snippet.findOneAndDelete({ _id: snippetId, userId: userId });

        if (!result) {
            return res.status(404).json({ message: 'Kayıt bulunamadı veya yetkiniz yok.' });
        }

        res.json({ message: 'Başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ error: 'Silme işlemi başarısız.' });
    }
});

// 6. KULLANICI PROFİL BİLGİSİ
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Profil bilgisi alınamadı.' });
    }
});

// 7. İSTATİSTİKLER
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const total = await Snippet.countDocuments({ userId: req.user.id });
        const images = await Snippet.countDocuments({ userId: req.user.id, type: 'image' });
        const links = await Snippet.countDocuments({ userId: req.user.id, type: 'link' });
        const texts = await Snippet.countDocuments({ userId: req.user.id, type: { $in: ['text', 'html'] } });

        res.json({ total, images, links, texts });
    } catch (error) {
        res.status(500).json({ error: 'İstatistikler alınamadı.' });
    }
});

// ========== KATEGORİ API'LERİ ==========

// 8. KATEGORİLERİ LİSTELE
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user.id }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Kategoriler alınamadı.' });
    }
});

// 9. YENİ KATEGORİ OLUŞTUR
app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, color, icon } = req.body;
        const newCategory = new Category({
            userId: req.user.id,
            name,
            color: color || '#6366f1',
            icon: icon || '📁'
        });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Kategori oluşturulamadı.' });
    }
});

// 10. KATEGORİ GÜNCELLE
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const { name, color, icon } = req.body;
        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name, color, icon },
            { new: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Kategori güncellenemedi.' });
    }
});

// 11. KATEGORİ SİL
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!result) {
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        // Kategoriye ait snippet'lerin categoryId'sini null yap
        await Snippet.updateMany({ categoryId: req.params.id }, { categoryId: null });
        res.json({ message: 'Kategori silindi.' });
    } catch (error) {
        res.status(500).json({ error: 'Kategori silinemedi.' });
    }
});

// 12. SNIPPET KATEGORİSİNİ GÜNCELLE
app.patch('/api/snippets/:id/category', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.body;
        const snippet = await Snippet.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { categoryId: categoryId || null },
            { new: true }
        );
        if (!snippet) {
            return res.status(404).json({ message: 'Kayıt bulunamadı.' });
        }
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: 'Kategori atanamadı.' });
    }
});

// SPA Routing - React Router için (sadece client dist varsa)
app.get('/{*path}', (req, res) => {
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({ message: 'Web Clipper API is running! 🚀', status: 'ok' });
    }
});