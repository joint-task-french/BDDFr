import { useState, useRef, useEffect } from 'react'

/**
 * Composant sélecteur de tri — dropdown simple.
 * Les options incluent déjà les variantes asc/desc.
 */
export default function SortSelector({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!options || options.length === 0) return null

  const activeOption = options.find(o => o.value === value) || options[0]

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      {/* Icône tri */}
      <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>

      {/* Sélecteur dropdown */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
          open
            ? 'bg-shd/20 text-shd border-shd/40'
            : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
        }`}
      >
        <span>{activeOption.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-5 mt-1 bg-tactical-panel border border-tactical-border rounded-lg shadow-xl z-40 min-w-44 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                value === opt.value
                  ? 'bg-shd/15 text-shd'
                  : 'text-gray-400 hover:bg-shd/5 hover:text-gray-200'
              }`}
            >
              {value === opt.value && <span className="mr-1">✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
