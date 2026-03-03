import { useMemo } from 'react'

/**
 * Modale de revue des modifications avant export.
 * Affiche les éléments nouveaux et modifiés avec diff.
 */
export default function ReviewModal({ loadedData, savedItems, categories, dataKey, identityKey, onConfirm, onCancel }) {
  const report = useMemo(() => buildReport(loadedData, savedItems, categories, dataKey, identityKey), [loadedData, savedItems, categories, dataKey, identityKey])

  const hasChanges = report.some(cat => cat.items.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-tactical-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">📋 Revue des modifications</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {hasChanges ? 'Vérifiez les changements avant de générer l\'archive' : 'Aucune modification enregistrée'}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-lg px-2">✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {!hasChanges && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucun élément enregistré. Utilisez « 💾 Enregistrer » dans le formulaire pour préparer des données.
            </div>
          )}

          {report.filter(cat => cat.items.length > 0).map(cat => (
            <div key={cat.key}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-shd mb-2">
                {cat.icon} {cat.label}
                <span className="text-gray-500 font-normal ml-2">({cat.items.length})</span>
              </h3>
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <DiffCard key={i} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-tactical-border flex justify-end gap-2 shrink-0">
          <button onClick={onCancel}
            className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded border border-tactical-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={!hasChanges}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded border transition-colors ${
              hasChanges
                ? 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                : 'border-tactical-border text-gray-600 cursor-not-allowed'
            }`}>
            📦 Générer l'archive
          </button>
        </div>
      </div>
    </div>
  )
}

function DiffCard({ item }) {
  const isNew = item.type === 'new'
  return (
    <div className={`rounded border p-3 text-xs ${
      isNew
        ? 'border-green-500/30 bg-green-500/5'
        : 'border-yellow-500/30 bg-yellow-500/5'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
          isNew
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {isNew ? '+ Nouveau' : '✎ Modifié'}
        </span>
        <span className="text-white font-bold">{item.name}</span>
      </div>

      {isNew ? (
        <div className="text-gray-400 mt-1">
          {Object.entries(item.data).map(([k, v]) => (
            <div key={k} className="flex gap-2 py-0.5">
              <span className="text-gray-600 shrink-0 w-28 text-right">{k}</span>
              <span className="text-green-400/80 truncate">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 mt-1">
          {item.changes.map(({ key, oldVal, newVal }) => (
            <div key={key} className="flex gap-2 py-0.5 items-start">
              <span className="text-gray-600 shrink-0 w-28 text-right">{key}</span>
              <div className="min-w-0">
                <span className="text-red-400/60 line-through mr-2">{formatVal(oldVal)}</span>
                <span className="text-green-400/80">{formatVal(newVal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatVal(v) {
  if (v === undefined || v === null) return '—'
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (Array.isArray(v)) return v.length === 0 ? '[]' : v.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function buildReport(loadedData, savedItems, categories, dataKey, identityKey) {
  return categories.map(cat => {
    const dk = dataKey[cat.key]
    const idKey = identityKey[cat.key]
    const loaded = loadedData?.[dk] || []
    const saved = savedItems?.[cat.key] || []

    const items = saved.map(savedItem => {
      // Find name/label
      const name = getItemLabel(savedItem, idKey)

      // Find matching in loaded
      const original = findInLoaded(savedItem, loaded, idKey)

      if (!original) {
        return { type: 'new', name, data: savedItem }
      }

      // Compute diff
      const changes = []
      const allKeys = new Set([...Object.keys(original), ...Object.keys(savedItem)])
      for (const key of allKeys) {
        if (key.startsWith('_')) continue
        const oldVal = original[key]
        const newVal = savedItem[key]
        if (!deepEqual(oldVal, newVal)) {
          changes.push({ key, oldVal, newVal })
        }
      }

      if (changes.length === 0) return null // no actual changes
      return { type: 'modified', name, changes }
    }).filter(Boolean)

    return { key: cat.key, label: cat.label, icon: cat.icon, items }
  })
}

function getItemLabel(item, idKey) {
  if (!idKey) return '?'
  if (Array.isArray(idKey)) return idKey.map(k => item[k] || '?').join(' — ')
  // Prefer nom for display, fall back to idKey value
  return item.nom || item[idKey] || '?'
}

function findInLoaded(savedItem, loaded, idKey) {
  if (!idKey) return null
  if (Array.isArray(idKey)) {
    return loaded.find(l => idKey.every(k => (l[k] || '').toLowerCase() === (savedItem[k] || '').toLowerCase()))
  }
  return loaded.find(l => (l[idKey] || '').toLowerCase() === (savedItem[idKey] || '').toLowerCase())
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every(k => deepEqual(a[k], b[k]))
}


