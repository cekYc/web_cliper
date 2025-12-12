// server/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // 1. Mongoose'u çağırdık

const app = express();
const PORT = 3000;

app.use(cors());
// Client klasöründeki statik dosyaları (html, css, js) dışarıya aç
app.use(express.static(path.join(__dirname, '../client')));
app.use(bodyParser.json({ limit: '10mb' })); // Büyük veriler için limit artırdık

// 2. MongoDB Bağlantısı
// 'webclipper' adında bir veritabanı oluşturacak (yoksa otomatik oluşturur)
mongoose.connect('mongodb://127.0.0.1:27017/webclipper')
  .then(() => console.log('✅ MongoDB Bağlantısı Başarılı!'))
  .catch(err => console.error('❌ MongoDB Bağlantı Hatası:', err));

// 3. Veri Şeması (Schema) Oluşturma
// Veritabanına neyin girip neyin giremeyeceğini belirleyen kural seti
const SnippetSchema = new mongoose.Schema({
  content: { type: String, required: true }, // İçerik şart
  sourceUrl: String,
  type: { type: String, default: 'text' },   // html, text, image vs.
  timestamp: { type: Date, default: Date.now }
});

// Şemadan bir Model oluştur (Tablo gibi düşünebilirsin)
const Snippet = mongoose.model('Snippet', SnippetSchema);

// --- ENDPOINTLER ---

// KAYDETME (POST)
app.post('/api/save', async (req, res) => {
  try {
    const { content, sourceUrl, type } = req.body;

    // Yeni bir kayıt oluştur
    const newSnippet = new Snippet({
      content,
      sourceUrl,
      type
    });

    // Veritabanına yaz (Promise döner, o yüzden await kullanıyoruz)
    await newSnippet.save();

    console.log('💾 Veri MongoDB\'ye kaydedildi.');
    res.json({ status: 'success', message: 'Veritabanına kaydedildi!' });

  } catch (error) {
    console.error('Kayıt Hatası:', error);
    res.status(500).json({ status: 'error', message: 'Kaydedilemedi' });
  }
});

// LİSTELEME (GET)
app.get('/api/list', async (req, res) => {
  try {
    // Veritabanındaki tüm kayıtları tarihe göre (yeni en üstte) getir
    const snippets = await Snippet.find().sort({ timestamp: -1 });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: 'Veriler çekilemedi' });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});