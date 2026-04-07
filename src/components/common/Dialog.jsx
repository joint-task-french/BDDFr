import { useEffect, useRef, useState } from 'react'

export default function Dialog({ 
  open, 
  title, 
  message, 
  type = 'alert', 
  defaultValue = '', 
  onConfirm, 
  onCancel,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  placeholder = '',
  showDescription = false,
  defaultDescription = '',
  showTags = false,
  availableTags = [],
  defaultTags = []
}) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [description, setDescription] = useState(defaultDescription)
  const [selectedTags, setSelectedTags] = useState(defaultTags)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setInputValue(defaultValue)
      setDescription(defaultDescription)
      setSelectedTags(defaultTags)
      document.body.style.overflow = 'hidden'
      if (type === 'prompt') {
        setTimeout(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        }, 100)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [open, defaultValue, defaultDescription, defaultTags, type])

  if (!open) return null

  const handleConfirm = (e) => {
    e?.preventDefault()
    if (type === 'prompt') {
      if (showDescription || showTags) {
        onConfirm({ 
          name: inputValue, 
          description, 
          tags: selectedTags 
        })
      } else {
        onConfirm(inputValue)
      }
    } else {
      onConfirm(true)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-tactical-panel border border-tactical-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-tactical-border bg-gradient-to-r from-tactical-panel to-tactical-bg">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
            {type === 'confirm' && <span className="text-shd">⚠️</span>}
            {type === 'prompt' && <span className="text-blue-400">📝</span>}
            {type === 'alert' && <span className="text-emerald-400">ℹ️</span>}
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            {message}
          </p>

          {type === 'prompt' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                {showDescription && (
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 ml-1">
                    Nom du build
                  </label>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={placeholder || (showDescription ? 'Entrez un nom' : '')}
                  className="w-full px-4 py-3 bg-tactical-bg border border-tactical-border rounded text-white focus:outline-none focus:ring-1 focus:ring-shd focus:border-shd transition-all"
                />
              </div>
              
              {showDescription && (
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 ml-1">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails sur l'utilisation, spécialisation..."
                    rows="3"
                    className="w-full px-4 py-3 bg-tactical-bg border border-tactical-border rounded text-white focus:outline-none focus:ring-1 focus:ring-shd focus:border-shd transition-all resize-none"
                  />
                </div>
              )}

              {showTags && availableTags.length > 0 && (
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                            isSelected 
                              ? `bg-${tag.color}-500/20 text-${tag.color}-400 border-${tag.color}-500/50` 
                              : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-tactical-bg/50 border-t border-tactical-border flex justify-end gap-3">
          {(type === 'confirm' || type === 'prompt') && (
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
              type === 'confirm' 
                ? 'bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40' 
                : 'bg-shd/20 text-shd border border-shd/40 hover:bg-shd/30'
            }`}
          >
            {type === 'alert' ? 'OK' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
