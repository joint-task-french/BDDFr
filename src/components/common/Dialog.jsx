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
  placeholder = ''
}) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setInputValue(defaultValue)
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
  }, [open, defaultValue, type])

  if (!open) return null

  const handleConfirm = (e) => {
    e?.preventDefault()
    onConfirm(type === 'prompt' ? inputValue : true)
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
            <form onSubmit={handleConfirm}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-tactical-bg border border-tactical-border rounded text-white focus:outline-none focus:ring-1 focus:ring-shd focus:border-shd transition-all"
              />
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
