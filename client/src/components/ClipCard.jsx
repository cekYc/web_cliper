import { motion } from 'framer-motion'
import { Trash2, ExternalLink, ChevronDown, Image, Link as LinkIcon, FileText, Calendar, Tag, FolderOpen } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function ClipCard({ clip, index, viewMode, categories, onDelete, onImageClick, onExpand, onCategoryChange }) {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const contentRef = useRef(null)
  const menuRef = useRef(null)

  const category = categories?.find(c => c._id === clip.categoryId)

  const date = new Date(clip.timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  let domain = ''
  try {
    domain = new URL(clip.sourceUrl).hostname.replace('www.', '')
  } catch (e) {
    domain = 'Link'
  }

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > 180)
    }
  }, [clip.content])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowCategoryMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContentClick = (e) => {
    if (e.target.tagName === 'IMG') {
      onImageClick(e.target.src)
    }
  }

  const getTypeIcon = () => {
    switch (clip.type) {
      case 'image': return <Image className="w-3.5 h-3.5" />
      case 'link': return <LinkIcon className="w-3.5 h-3.5" />
      default: return <FileText className="w-3.5 h-3.5" />
    }
  }

  const getTypeColor = () => {
    switch (clip.type) {
      case 'image': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700'
      case 'link': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700'
      default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor()}`}>
          {getTypeIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div
            className="text-gray-700 dark:text-gray-200 line-clamp-1 text-sm"
            dangerouslySetInnerHTML={{ __html: clip.content.substring(0, 100) }}
          />
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {date}
            </span>
            {category && (
              <span
                className="px-2 py-0.5 rounded-md text-white text-xs"
                style={{ backgroundColor: category.color }}
              >
                {category.icon} {category.name}
              </span>
            )}
            <a
              href={clip.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-600 truncate max-w-[200px]"
            >
              {domain}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              <Tag className="w-4 h-4" />
            </motion.button>
            {showCategoryMenu && (
              <CategoryMenu
                categories={categories}
                currentCategoryId={clip.categoryId}
                onSelect={(catId) => { onCategoryChange(catId); setShowCategoryMenu(false); }}
              />
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onExpand(clip.content)}
            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.05 }}
      className="masonry-item bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Category Badge */}
      {category && (
        <div
          className="px-4 py-2 text-white text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: category.color }}
        >
          <span>{category.icon}</span>
          {category.name}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div
          ref={contentRef}
          onClick={handleContentClick}
          className="card-content relative max-h-[180px] overflow-hidden text-gray-700 dark:text-gray-200 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: clip.content }}
        />
        
        {isOverflowing && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExpand(clip.content)}
              className="w-full mt-3 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-700 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
              Devamını Göster
            </motion.button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeColor()}`}>
            {getTypeIcon()}
            {clip.type}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{date}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className={`p-2 rounded-lg transition-all ${
                category 
                  ? 'text-white opacity-80 hover:opacity-100' 
                  : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
              }`}
              style={category ? { backgroundColor: category.color } : {}}
              title="Kategori Ata"
            >
              <Tag className="w-4 h-4" />
            </motion.button>
            {showCategoryMenu && (
              <CategoryMenu
                categories={categories}
                currentCategoryId={clip.categoryId}
                onSelect={(catId) => { onCategoryChange(catId); setShowCategoryMenu(false); }}
              />
            )}
          </div>

          <a
            href={clip.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{domain}</span>
          </a>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function CategoryMenu({ categories, currentCategoryId, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden"
    >
      <div className="p-2">
        <button
          onClick={() => onSelect(null)}
          className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2 transition-colors ${
            !currentCategoryId 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Kategorisiz
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => onSelect(cat._id)}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2 transition-colors ${
              currentCategoryId === cat._id 
                ? 'text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            style={currentCategoryId === cat._id ? { backgroundColor: cat.color } : {}}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
