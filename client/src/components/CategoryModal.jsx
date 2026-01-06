import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Edit2, Palette } from 'lucide-react'

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1'
]

const ICONS = [
  '📁', '📂', '🗂️', '📚', '📖', '📝', '✏️', '📌', '🔖', '🏷️',
  '💼', '🎯', '⭐', '💡', '🔥', '💎', '🎨', '🎬', '🎵', '🎮',
  '💻', '📱', '🌐', '🔗', '📊', '📈', '🧪', '🔬', '🎓', '📰'
]

export default function CategoryModal({ isOpen, onClose, onSave, onDelete, category, categories, onEdit }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [icon, setIcon] = useState('📁')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit'

  useEffect(() => {
    if (category) {
      setName(category.name)
      setColor(category.color)
      setIcon(category.icon)
      setMode('edit')
    } else {
      setName('')
      setColor('#6366f1')
      setIcon('📁')
      setMode(categories.length > 0 ? 'list' : 'create')
    }
  }, [category, isOpen, categories])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, icon })
  }

  const handleClose = () => {
    setMode('list')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {mode === 'list' && 'Kategoriler'}
              {mode === 'create' && 'Yeni Kategori'}
              {mode === 'edit' && 'Kategori Düzenle'}
            </h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-5">
            {mode === 'list' ? (
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Henüz kategori oluşturmadınız
                  </p>
                ) : (
                  categories.map(cat => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: cat.color + '20', color: cat.color }}
                        >
                          {cat.icon}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(cat)}
                          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cat._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('create')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium mt-4"
                >
                  + Yeni Kategori Ekle
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: İş, Eğitim, Hobiler..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Icon & Color */}
                <div className="flex gap-4">
                  {/* Icon Picker */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      İkon
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-2xl flex items-center justify-center"
                      >
                        {icon}
                      </button>
                      {showIconPicker && (
                        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 grid grid-cols-6 gap-2 w-64">
                          {ICONS.map(i => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { setIcon(i); setShowIconPicker(false); }}
                              className={`p-2 text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${icon === i ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Renk
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: color }} />
                        <Palette className="w-4 h-4 text-gray-400" />
                      </button>
                      {showColorPicker && (
                        <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 grid grid-cols-6 gap-2 w-48">
                          {COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setColor(c); setShowColorPicker(false); }}
                              className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Önizleme
                  </label>
                  <div
                    className="px-4 py-3 rounded-xl flex items-center gap-3 text-white font-medium"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-lg">{icon}</span>
                    <span>{name || 'Kategori Adı'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={() => { setMode('list'); onClose(); }}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      İptal
                    </button>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
                  >
                    {mode === 'edit' ? 'Güncelle' : 'Oluştur'}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
