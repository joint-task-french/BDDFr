import { useState, useMemo, useCallback, useRef } from 'react'
import JSZip from 'jszip'
import { useDataLoader } from '../hooks/useDataLoader'
import {
  GENERATOR_CATEGORIES, FIELDS, DATA_KEY, FILE_MAP, IDENTITY_KEY,
  getDefaults, cleanOutput, buildSuggestions, generateEquipmentSet,
  itemToFormData, getIdentityValue, getIdentityLabel,
} from '../config/generatorFields'
import GeneratorForm from '../components/generator/GeneratorForm'
import JsoncPreview from '../components/generator/JsoncPreview'
import ReviewModal from '../components/generator/ReviewModal'
import { slugify } from '../utils/slugify'
import Loader from '../components/common/Loader'

const STORAGE_KEY = 'jtfr-generator-saved'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function persistSaved(saved) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

export default function GeneratorPage() {
  const { data: loadedData, loading } = useDataLoader()
  const [activeCategory, setActiveCategory] = useState('armes')
  const [allData, setAllData] = useState(() => {
    const init = {}
    GENERATOR_CATEGORIES.forEach(cat => { init[cat.key] = getDefaults(cat.key) })
    return init
  })
  const [savedItems, setSavedItems] = useState(loadSaved)
  const [editMode, setEditMode] = useState(null)
  const [toast, setToast] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const editLoadedRef = useRef(false)

  const config = FIELDS[activeCategory]
  const data = allData[activeCategory] || {}

  const currentIdentity = useMemo(
      () => getIdentityValue(activeCategory, data),
      [activeCategory, data]
  )

  const handleIdentitySelect = useCallback((fieldKey, value) => {
    if (!value || !loadedData) return

    // Nettoyer la valeur de suggestion qui contient le "(slug)"
    const slugMatch = value.match(/\(([^)]+)\)$/)
    const actualValue = slugMatch ? value.replace(/\s\([^)]+\)$/, '') : value
    const hintSlug = slugMatch ? slugMatch[1] : null

    const dk = DATA_KEY[activeCategory]
    const loaded = loadedData?.[dk] || {}
    const loadedArray = Array.isArray(loaded) ? loaded : Object.values(loaded)
    const saved = savedItems?.[activeCategory] || []
    const all = [...saved, ...loadedArray]

    let existing = all.find(item => {
      const matchValue = (item[fieldKey] || '').toLowerCase() === actualValue.toLowerCase()
      if (hintSlug) return matchValue && item.slug === hintSlug
      return matchValue
    })

    if (!existing) return

    const source = saved.includes(existing) ? 'saved' : 'loaded'
    const formData = itemToFormData(activeCategory, existing)
    if (formData) {
      editLoadedRef.current = true
      setAllData(prev => ({ ...prev, [activeCategory]: formData }))
      setEditMode({ source, label: actualValue })
      setTimeout(() => { editLoadedRef.current = false }, 200)
    }
  }, [activeCategory, loadedData, savedItems])

  const handleLoadExisting = useCallback(() => {
    if (!currentIdentity) return
    const dk = DATA_KEY[activeCategory]
    const idKey = IDENTITY_KEY[activeCategory]
    const loaded = loadedData?.[dk] || {}
    const loadedArray = Array.isArray(loaded) ? loaded : Object.values(loaded)
    let original = null
    if (Array.isArray(idKey)) {
      original = loadedArray.find(l => idKey.every(k => (l[k] || '').toLowerCase() === (currentIdentity[k] || '').toLowerCase()))
    } else {
      const name = typeof currentIdentity === 'string' ? currentIdentity : currentIdentity[idKey]
      if (name) original = loadedArray.find(l => (l[idKey] || '').toLowerCase() === name.toLowerCase())
    }
    if (!original) {
      showToast('⚠ Aucune donnée originale trouvée', 'yellow')
      return
    }
    const formData = itemToFormData(activeCategory, original)
    if (formData) {
      editLoadedRef.current = true
      setAllData(prev => ({ ...prev, [activeCategory]: formData }))
      setEditMode({ source: 'loaded', label: getIdentityLabel(activeCategory, currentIdentity, formData) })
      setTimeout(() => { editLoadedRef.current = false }, 200)
      showToast('↺ Données originales restaurées', 'blue')
    }
  }, [activeCategory, currentIdentity, loadedData])

  const suggestions = useMemo(
      () => buildSuggestions(loadedData, allData, savedItems),
      [loadedData, allData, savedItems]
  )

  const handleChange = useCallback((key, value) => {
    editLoadedRef.current = false
    setAllData(prev => {
      const updated = { ...prev[activeCategory], [key]: value }
      if (key === 'nom' && !editMode) {
        updated.slug = slugify(value)
      }
      return { ...prev, [activeCategory]: updated }
    })
  }, [activeCategory, editMode])

  const handleReset = useCallback(() => {
    setAllData(prev => ({ ...prev, [activeCategory]: getDefaults(activeCategory) }))
    setEditMode(null)
    editLoadedRef.current = false
  }, [activeCategory])

  const handlePurgeAll = useCallback(() => {
    if (!confirm('Supprimer toutes les modifications enregistrées localement ?')) return
    setSavedItems({})
    persistSaved({})
    showToast('🗑 Toutes les modifications supprimées', 'red')
  }, [])

  const cleanedData = useMemo(() => cleanOutput(data, activeCategory), [data, activeCategory])

  const slugConflict = useMemo(() => {
    if (editMode || !data.slug) return null
    const dk = DATA_KEY[activeCategory]
    const slugLower = data.slug.toLowerCase()
    const loaded = loadedData?.[dk] || []
    const saved = savedItems?.[activeCategory] || []
    const inSaved = saved.find(item => (item.slug || '').toLowerCase() === slugLower)
    if (inSaved) return { source: 'saved', nom: inSaved.nom || inSaved.slug }
    const inLoaded = loaded.find(item => (item.slug || '').toLowerCase() === slugLower)
    if (inLoaded) return { source: 'loaded', nom: inLoaded.nom || inLoaded.slug }
    return null
  }, [data.slug, editMode, activeCategory, loadedData, savedItems])

  const equipmentSet = useMemo(() => {
    if (activeCategory !== 'ensembles' || !data.nom) return null
    return generateEquipmentSet(data, loadedData?.equipements_type)
  }, [activeCategory, data, loadedData])

  const handleSave = useCallback(() => {
    const cleaned = cleanOutput(data, activeCategory)
    if (!cleaned || Object.keys(cleaned).length === 0) return
    const identity = getIdentityValue(activeCategory, cleaned)
    if (!identity) { showToast('⚠ Champs identifiants requis', 'yellow'); return }
    const idKey = IDENTITY_KEY[activeCategory]

    setSavedItems(prev => {
      const catItems = [...(prev[activeCategory] || [])]
      const matchFn = Array.isArray(idKey)
          ? (item) => idKey.every(k => (item[k] || '').toLowerCase() === (identity[k] || '').toLowerCase())
          : (item) => (item[idKey] || '').toLowerCase() === (typeof identity === 'string' ? identity : '').toLowerCase()
      const idx = catItems.findIndex(matchFn)
      if (idx >= 0) catItems[idx] = cleaned
      else catItems.push(cleaned)
      const next = { ...prev, [activeCategory]: catItems }

      if (activeCategory === 'ensembles' && equipmentSet && !editMode) {
        const eqItems = [...(next.equipements || [])]
        for (const eq of equipmentSet) {
          const eIdx = eqItems.findIndex(e => e.nom?.toLowerCase() === eq.nom.toLowerCase())
          if (eIdx >= 0) eqItems[eIdx] = eq
          else eqItems.push(eq)
        }
        next.equipements = eqItems
      }

      persistSaved(next)
      return next
    })
    handleReset()
    showToast('✓ Enregistré', 'green')
  }, [data, activeCategory, equipmentSet, editMode, handleReset])

  const handleExportZIP = useCallback(async () => {
    if (!loadedData) return
    const zip = new JSZip()

    function arrayToSlugObject(arr) {
      const obj = {}
      for (const item of arr) {
        if (!item.slug) continue
        const { slug, ...rest } = item
        obj[slug] = rest
      }
      return obj
    }

    for (const cat of GENERATOR_CATEGORIES) {
      const dk = DATA_KEY[cat.key]
      const fileName = FILE_MAP[cat.key]
      const saved = savedItems[cat.key] || []
      const idKey = IDENTITY_KEY[cat.key]

      if (cat.key === 'competences') {
        const grouped = JSON.parse(JSON.stringify(loadedData.competencesGrouped || []))
        for (const item of saved) {
          let group = grouped.find(g => g.competence.toLowerCase() === (item.competence || '').toLowerCase())
          if (!group) {
            group = { competence: item.competence, variantes: [], emplacementsMods: [] }
            grouped.push(group)
          }
          const vIdx = group.variantes.findIndex(v => v.variante.toLowerCase() === (item.variante || '').toLowerCase())
          const { competence, emplacementsMods, ...varData } = item
          if (vIdx >= 0) group.variantes[vIdx] = { ...group.variantes[vIdx], ...varData }
          else group.variantes.push(varData)
        }
        const comment = FIELDS[cat.key]?.comment || ''
        const exported = arrayToSlugObject(grouped)
        const content = comment + '\n' + JSON.stringify(exported, null, 2)
        zip.file(`data/${fileName}`, content)
        continue
      }

      const baseData = [...(loadedData[dk] || [])]
      let merged = [...baseData]

      if (cat.key === 'armes') {
        merged = merged.filter(item => item.type !== 'arme_specifique')
      }
      for (const item of saved) {
        if (idKey) {
          let idx
          if (Array.isArray(idKey)) {
            idx = merged.findIndex(m => idKey.every(k => (m[k] || '').toLowerCase() === (item[k] || '').toLowerCase()))
          } else {
            idx = merged.findIndex(m => (m[idKey] || '').toLowerCase() === (item[idKey] || '').toLowerCase())
          }
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item }
          else merged.push(item)
        } else {
          merged.push(item)
        }
      }

      const comment = FIELDS[cat.key]?.comment || ''
      const exported = arrayToSlugObject(merged)
      const content = comment + '\n' + JSON.stringify(exported, null, 2)
      zip.file(`data/${fileName}`, content)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jtfr-data-export.zip'
    a.click()
    URL.revokeObjectURL(url)
    showToast('📦 Archive exportée', 'blue')
  }, [loadedData, savedItems])

  const savedCount = useMemo(() => {
    return Object.values(savedItems).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }, [savedItems])

  function showToast(msg, color) {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) return <Loader progress={0} />

  return (
      <div className="min-h-screen bg-tactical-bg text-white fade-in">
        {toast && (
            <div className={`fixed bottom-10 right-4 z-50 px-4 py-2 rounded-lg border shadow-lg text-sm font-bold uppercase tracking-widest ${toast.color === 'green' ? 'bg-green-500/20 border-green-500/40 text-green-400' : toast.color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : toast.color === 'blue' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
              {toast.msg}
            </div>
        )}

        <div className="px-4 sm:px-6 py-4 border-b border-tactical-border bg-tactical-panel/50 flex justify-between items-start">
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-widest"><span className="text-shd">⚙</span> Générateur <span className='text-shd'>JSONC</span></h1>
          <div className="flex gap-2 items-center">
            {savedCount > 0 && <button onClick={handlePurgeAll} className="text-xs font-bold uppercase px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10">🗑 Purger tout</button>}
            <button onClick={() => setShowReview(true)} className="text-xs font-bold uppercase px-3 py-1.5 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10">🚀 Contribuer</button>
          </div>
        </div>

        <div className="px-2 sm:px-4 py-3 border-b border-tactical-border bg-tactical-panel/30 flex flex-wrap gap-1.5">
          {GENERATOR_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setEditMode(null); editLoadedRef.current = false }}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all border ${activeCategory === cat.key ? 'bg-shd/15 text-shd border-shd/30' : 'text-gray-500 border-transparent'}`}>
                {cat.icon} <span className="hidden sm:inline ml-1">{cat.label}</span>
              </button>
          ))}
        </div>

        {editMode && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between">
              <p className="text-xs text-yellow-400 font-bold uppercase">⚠ Mode édition — « {editMode.label} »</p>
              <button onClick={handleLoadExisting} className="text-xs font-bold uppercase px-3 py-1.5 rounded border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/15">↺ Restaurer l'original</button>
            </div>
        )}

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase text-white">{GENERATOR_CATEGORIES.find(c => c.key === activeCategory)?.label}</h2>
              <div className="flex gap-1.5">
                <button onClick={handleSave} className="text-xs font-bold uppercase px-2.5 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10">💾 Enregistrer</button>
                <button onClick={handleReset} className="text-xs font-bold uppercase px-2.5 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10">↺ Vider</button>
              </div>
            </div>
            <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {data.slug && (
                  <div className="mb-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-tactical-bg/50 rounded border border-tactical-border/30">
                      <span className="text-xs text-gray-600 uppercase font-bold">Slug</span>
                      <input
                          value={data.slug}
                          onChange={e => !editMode && handleChange('slug', e.target.value)}
                          readOnly={!!editMode}
                          className={`bg-transparent text-xs font-mono focus:outline-none flex-1 ${editMode ? 'text-gray-500 cursor-not-allowed' : 'text-shd/70'}`}
                      />
                      {editMode && <span className="text-xs text-yellow-500/60 ml-auto">🔒 Fixe</span>}
                    </div>
                    {slugConflict && <p className="text-[10px] text-yellow-400">⚠ Conflit : correspond à « {slugConflict.nom} »</p>}
                  </div>
              )}
              <GeneratorForm fields={config.fields} data={data} onChange={handleChange} suggestions={suggestions} onIdentitySelect={handleIdentitySelect} />
            </div>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <JsoncPreview data={cleanedData} comment={config?.comment || ''} label={FILE_MAP[activeCategory]} />
          </div>
        </div>

        {showReview && (
            <ReviewModal
                loadedData={loadedData} savedItems={savedItems} categories={GENERATOR_CATEGORIES}
                dataKey={DATA_KEY} identityKey={IDENTITY_KEY} fileMap={FILE_MAP}
                onConfirm={handleExportZIP} onCancel={() => setShowReview(false)}
            />
        )}
      </div>
  )
}