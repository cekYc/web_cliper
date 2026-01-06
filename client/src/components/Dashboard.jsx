import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, LogOut, Search, Grid, List, Loader2, Moon, Sun, Plus, Image, Link as LinkIcon, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'
import ClipCard from './ClipCard'
import Lightbox from './Lightbox'
import ContentModal from './ContentModal'
import CategoryModal from './CategoryModal'

export default function Dashboard() {
  const { user, logout, getAuthHeader } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [clips, setClips] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [lightboxImage, setLightboxImage] = useState(null)
  const [modalContent, setModalContent] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    fetchClips()
    fetchCategories()
  }, [])

  const fetchClips = async () => {
    try {
      const res = await api.getSnippets(user.token)
      if (res.status === 401 || res.status === 403) { logout(); return }
      const data = await res.json()
      setClips(data)
    } catch (err) {
      console.error('Veri çekme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories(user.token)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Kategori çekme hatası:', err)
    }
  }

  const deleteClip = async (id) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
    try {
      const res = await api.deleteSnippet(user.token, id)
      if (res.ok) setClips(clips.filter(clip => clip._id !== id))
    } catch (err) {
      console.error('Silme hatası:', err)
    }
  }

  const updateClipCategory = async (clipId, categoryId) => {
    try {
      const res = await api.updateSnippetCategory(user.token, clipId, categoryId)
      if (res.ok) {
        setClips(clips.map(clip => clip._id === clipId ? { ...clip, categoryId } : clip))
      }
    } catch (err) {
      console.error('Kategori güncelleme hatası:', err)
    }
  }

  const saveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory._id}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(categoryData)
        })
        if (res.ok) {
          const updated = await res.json()
          setCategories(categories.map(c => c._id === updated._id ? updated : c))
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(categoryData)
        })
        if (res.ok) {
          const newCat = await res.json()
          setCategories([...categories, newCat])
        }
      }
      setShowCategoryModal(false)
      setEditingCategory(null)
    } catch (err) {
      console.error('Kategori kaydetme hatası:', err)
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeader() })
      if (res.ok) {
        setCategories(categories.filter(c => c._id !== id))
        setClips(clips.map(clip => clip.categoryId === id ? { ...clip, categoryId: null } : clip))
        if (categoryFilter === id) setCategoryFilter('all')
      }
    } catch (err) {
      console.error('Kategori silme hatası:', err)
    }
  }

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clip.sourceUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filter === 'all' || clip.type === filter
    const matchesCategory = categoryFilter === 'all' || 
                           (categoryFilter === 'uncategorized' && !clip.categoryId) ||
                           clip.categoryId === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const stats = {
    total: clips.length,
    images: clips.filter(c => c.type === 'image').length,
    links: clips.filter(c => c.type === 'link').length,
    texts: clips.filter(c => c.type === 'text' || c.type === 'html').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Web Clipper</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dijital Beyniniz</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium">{user?.username}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Toplam', value: stats.total, color: 'indigo', icon: null },
              { label: 'Görseller', value: stats.images, color: 'purple', icon: Image },
              { label: 'Bağlantılar', value: stats.links, color: 'blue', icon: LinkIcon },
              { label: 'Metinler', value: stats.texts, color: 'emerald', icon: FileText },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/30 dark:to-${stat.color}-800/30 rounded-2xl p-4 border border-${stat.color}-200 dark:border-${stat.color}-700/50`}
              >
                <p className={`text-${stat.color}-600 dark:text-${stat.color}-400 text-sm font-medium flex items-center gap-1`}>
                  {stat.icon && <stat.icon className="w-4 h-4" />}
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Kategoriler:</span>
            
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tümü
            </button>

            <button
              onClick={() => setCategoryFilter('uncategorized')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'uncategorized'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📥 Kategorisiz
            </button>

            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setCategoryFilter(cat._id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  categoryFilter === cat._id
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={categoryFilter === cat._id ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Yeni Kategori
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Kayıtlarda ara..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white placeholder-gray-400 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
              {['all', 'image', 'link', 'html'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === type
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {type === 'all' && 'Tümü'}
                  {type === 'image' && 'Görsel'}
                  {type === 'link' && 'Link'}
                  {type === 'html' && 'Metin'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Yükleniyor...</span>
          </div>
        ) : filteredClips.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {searchTerm || filter !== 'all' || categoryFilter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filter !== 'all' || categoryFilter !== 'all'
                ? 'Farklı bir arama veya filtre deneyin'
                : 'Chrome uzantısı ile web içeriklerini kaydetmeye başlayın'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className={viewMode === 'grid' ? 'columns-1 sm:columns-2 lg:columns-3 gap-6' : 'space-y-4'}
          >
            <AnimatePresence>
              {filteredClips.map((clip, index) => (
                <ClipCard
                  key={clip._id}
                  clip={clip}
                  index={index}
                  viewMode={viewMode}
                  categories={categories}
                  onDelete={() => deleteClip(clip._id)}
                  onImageClick={setLightboxImage}
                  onExpand={setModalContent}
                  onCategoryChange={(catId) => updateClipCategory(clip._id, catId)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      <ContentModal content={modalContent} onClose={() => setModalContent(null)} />
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        onSave={saveCategory}
        onDelete={deleteCategory}
        category={editingCategory}
        categories={categories}
        onEdit={(cat) => { setEditingCategory(cat); setShowCategoryModal(true); }}
      />
    </div>
  )
}
