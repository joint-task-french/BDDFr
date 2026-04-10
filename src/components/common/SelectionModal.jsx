import { useEffect, useRef } from 'react'

export default function SelectionModal({ open, title, onClose, children, filters, searchValue, onSearch }) {
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
      setTimeout(() => searchRef.current?.focus(), 100)
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-tactical-panel border border-tactical-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-tactical-border bg-gradient-to-r from-tactical-panel to-tactical-bg flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest">{title}</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchValue || ''}
                onChange={e => onSearch?.(e.target.value)}
                className="w-48 sm:w-64 pl-8 pr-8 py-2 border border-tactical-border rounded bg-tactical-bg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-shd text-sm uppercase tracking-wide"
                placeholder="Filtrer..."
              />
              {searchValue && (
                <button
                  onClick={() => onSearch?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-shd"
                >
                  ✕
                </button>
              )}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-shd text-2xl leading-none px-1">&times;</button>
          </div>
        </div>

        {/* Type filters */}
        {filters && (
          <div className="px-4 sm:px-6 py-3 border-b border-tactical-border/50 overflow-x-auto shrink-0">
            <div className="flex gap-2">{filters}</div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

