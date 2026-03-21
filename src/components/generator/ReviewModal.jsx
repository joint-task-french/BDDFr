import { useMemo, useEffect, useState } from 'react'
import { slugify } from '../../utils/slugify'

export default function ReviewModal({ loadedData, savedItems, categories, dataKey, identityKey, fileMap, onConfirm, onCancel }) {
  const report = useMemo(() => buildReport(loadedData, savedItems, categories, dataKey, identityKey), [loadedData, savedItems, categories, dataKey, identityKey])
  const [isProcessing, setIsProcessing] = useState(false)

  const hasChanges = report.some(cat => cat.items.length > 0)

  const githubUrlInfo = useMemo(() => {
    if (!hasChanges) return { url: null, isTooLong: false }
    const patches = []

    for (const cat of categories) {
      const items = savedItems[cat.key] || []
      if (items.length === 0) continue

      const fileName = fileMap[cat.key]
      const upsertsDict = {}

      for (const item of items) {
        const clean = { ...item }
        const currentSlug = item.slug || slugify(item.nom || 'nouvel_element')

        Object.keys(clean).forEach(k => k.startsWith('_') && delete clean[k])
        delete clean.slug

        upsertsDict[currentSlug] = clean
      }

      patches.push({
        path: `src/data/${fileName}`,
        upserts: upsertsDict
      })
    }

    const payloadString = JSON.stringify(patches)
    const markdownBody = `### Nouvelle Contribution de Données\n\nMerci de soumettre cette issue. Nos automates vont appliquer ce patch et créer une Pull Request dans quelques instants !\n\n⚠️ **ATTENTION : Ne modifiez pas le bloc de code ci-dessous.**\n\n\n\`\`\`json\n${payloadString}\n\`\`\`\n\n`

    const title = encodeURIComponent('[Contribution] Nouvelles données')
    const body = encodeURIComponent(markdownBody)
    const url = `${__REPOS_URL__}/issues/new?title=${title}&body=${body}`

    return { url, isTooLong: url.length > 8000 }
  }, [categories, savedItems, fileMap, hasChanges])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !isProcessing) onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel, isProcessing])

  const handleGithubIssue = () => {
    if (!githubUrlInfo.url || githubUrlInfo.isTooLong) return
    setIsProcessing(true)
    try {
      window.open(githubUrlInfo.url, '_blank')
      onCancel()
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'ouverture de GitHub.")
    } finally { setIsProcessing(false) }
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={!isProcessing ? onCancel : undefined}>
        <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-tactical-border flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">📋 Revue des modifications</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasChanges ? 'Vérifiez les changements avant de procéder à l\'export' : 'Aucune modification enregistrée'}
              </p>
            </div>
            <button onClick={onCancel} disabled={isProcessing} className="text-gray-500 hover:text-white text-lg px-2 disabled:opacity-50">✕</button>
          </div>

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

          <div className="px-5 py-3 border-t border-tactical-border flex justify-end gap-3 shrink-0">
            {!githubUrlInfo.isTooLong && hasChanges && (
                <button onClick={handleGithubIssue} disabled={isProcessing} className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded border border-shd/40 text-shd hover:bg-shd/10 transition-colors">
                  {isProcessing ? 'Ouverture...' : '🐙 Contribuer via GitHub'}
                </button>
            )}
            <button onClick={onConfirm} disabled={!hasChanges || isProcessing} className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded border transition-colors ${hasChanges ? 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10' : 'border-tactical-border text-gray-600 cursor-not-allowed'}`}>
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
      <div className={`rounded border p-3 text-xs ${isNew ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
        <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isNew ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {isNew ? '+ Nouveau' : '✎ Modifié'}
        </span>
          <span className="text-white font-bold">{item.name}</span>
          <span className="ml-auto text-gray-500 font-mono text-[10px]">[{item.slug}]</span>
        </div>

        {isNew ? (
            <div className="text-gray-400 mt-1">
              {Object.entries(item.data).map(([k, v]) => {
                if (k.startsWith('_') || k === 'slug') return null
                return (
                    <div key={k} className="flex gap-2 py-0.5">
                      <span className="text-gray-600 shrink-0 w-28 text-right">{k}</span>
                      <span className="text-green-400/80 truncate">{formatVal(v)}</span>
                    </div>
                )
              })}
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
    const loaded = loadedData?.[dk] || {}
    const loadedArray = Array.isArray(loaded) ? loaded : Object.values(loaded)
    const saved = savedItems?.[cat.key] || []

    const items = saved.map(savedItem => {
      const name = getItemLabel(savedItem, idKey)

      // Chercher l'original (par slug si possible, sinon par identité)
      let original = (savedItem.slug && !Array.isArray(loaded)) ? loaded[savedItem.slug] : null
      if (!original) {
        original = loadedArray.find(item => {
          if (savedItem.slug && item.slug === savedItem.slug) return true
          if (Array.isArray(idKey)) return idKey.every(k => (item[k] || '').toLowerCase() === (savedItem[k] || '').toLowerCase())
          const idValue = item[idKey] || ''
          const savedIdValue = savedItem[idKey] || ''
          return String(idValue).toLowerCase() === String(savedIdValue).toLowerCase()
        })
      }

      if (!original) {
        return { type: 'new', name, slug: savedItem.slug || '?', data: savedItem }
      }

      const changes = []
      const allKeys = new Set([...Object.keys(original), ...Object.keys(savedItem)])
      for (const key of allKeys) {
        if (key.startsWith('_') || key === 'slug') continue
        const oldVal = original[key]
        const newVal = savedItem[key]
        if (!deepEqual(oldVal, newVal)) {
          changes.push({ key, oldVal, newVal })
        }
      }

      if (changes.length === 0) return null
      return { type: 'modified', name, slug: savedItem.slug || original.slug || '?', changes }
    }).filter(Boolean)

    return { key: cat.key, label: cat.label, icon: cat.icon, items }
  })
}

function getItemLabel(item, idKey) {
  if (!idKey) return '?'
  if (Array.isArray(idKey)) return idKey.map(k => item[k] || '?').join(' — ')
  return item.nom || item[idKey] || '?'
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