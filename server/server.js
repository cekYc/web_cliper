// server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');      // Şifreleme için
const jwt = require('jsonwebtoken');     // Jeton (Token) için

const app = express();
const PORT = 3000;
const SECRET_KEY = 'cok-gizli-bir-anahtar-kelime'; // Normalde .env dosyasında saklanır!

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// --- VERİTABANI BAĞLANTISI ---
mongoose.connect('mongodb://127.0.0.1:27017/webclipper')
  .then(() => console.log('✅ MongoDB Bağlantısı Başarılı!'))
  .catch(err => console.error('❌ MongoDB Hatası:', err));

// --- MODELLER (ŞEMALAR) ---

// 1. KULLANICI MODELİ
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. İÇERİK (SNIPPET) MODELİ
const SnippetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // SAHİBİ KİM?
    content: { type: String, required: true },
    sourceUrl: String,
    type: { type: String, default: 'text' },
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
    console.log(`🔒 Güvenli Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});

// 5. İÇERİK SİL (DELETE)
app.delete('/api/delete/:id', authenticateToken, async (req, res) => {
    try {
        const snippetId = req.params.id;
        const userId = req.user.id; // Token'dan gelen kullanıcı ID'si

        // Hem ID'si tutan hem de Sahibi (userId) biz olan kaydı bul ve sil
        const result = await Snippet.findOneAndDelete({ _id: snippetId, userId: userId });

        if (!result) {
            return res.status(404).json({ message: 'Kayıt bulunamadı veya yetkiniz yok.' });
        }

        res.json({ message: 'Başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ error: 'Silme işlemi başarısız.' });
    }
});