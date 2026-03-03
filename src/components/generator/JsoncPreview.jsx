import { useState, useMemo } from 'react'

/**
 * Aperçu JSONC en direct avec bouton copier.
 * Affiche l'objet nettoyé avec un commentaire en première ligne.
 */
export default function JsoncPreview({ data, comment, label }) {
  const [copied, setCopied] = useState(false)

  const jsonc = useMemo(() => {
    const json = JSON.stringify(data, null, 2)
    return comment ? `${comment}\n${json}` : json
  }, [data, comment])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonc)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = jsonc
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-tactical-bg border border-tactical-border rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-tactical-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Aperçu JSONC</span>
          {label && <span className="text-[9px] text-shd/50 font-mono">→ {label}</span>}
        </div>
        <button onClick={copy}
          className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded border transition-all duration-200 ${
            copied
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-shd/10 border-shd/30 text-shd hover:bg-shd/20'
          }`}>
          {copied ? '✓ Copié' : '📋 Copier'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-auto flex-1 p-4">
        <pre className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-all select-all">
          {jsonc}
        </pre>
      </div>
    </div>
  )
}



