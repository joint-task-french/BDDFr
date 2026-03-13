import { useState, useMemo, useCallback, useRef } from 'react'
import JSZip from 'jszip'
import { useDataLoader } from '../hooks/useDataLoader'
import { useGame } from '../context/GameContext'
import {
  GENERATOR_CATEGORIES, FIELDS, DATA_KEY, FILE_MAP, IDENTITY_KEY,
  getDefaults, cleanOutput, buildSuggestions, generateEquipmentSet,
  findExisting, itemToFormData, getIdentityValue, getIdentityLabel,
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
  const [editMode, setEditMode] = useState(null) // null | { source: 'loaded'|'saved', label: string }
  const [toast, setToast] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const editLoadedRef = useRef(false) // prevent duplicate load

  const config = FIELDS[activeCategory]
  const data = allData[activeCategory] || {}

  // Identity courante (utilisée par le bouton "Restaurer l'original")
  const currentIdentity = useMemo(
    () => getIdentityValue(activeCategory, data),
    [activeCategory, data]
  )

  // Auto-load existing data when user picks from autocomplete suggestion list
  const handleIdentitySelect = useCallback((fieldKey, value) => {
    if (!value || !loadedData) return
    const dk = DATA_KEY[activeCategory]
    const idKey = IDENTITY_KEY[activeCategory]
    const loaded = loadedData?.[dk] || []
    const saved = savedItems?.[activeCategory] || []
    const all = [...saved, ...loaded]

    // Pour les compétences (clé composite), logique spéciale
    if (activeCategory === 'competences') {
      let tempData = { ...data, [fieldKey]: value }
      // Si variante est sélectionnée sans compétence, trouver la compétence parente
      if (fieldKey === 'variante' && !tempData.competence) {
        const match = all.find(c => c.variante?.toLowerCase() === value.toLowerCase())
        if (match) tempData = { ...tempData, competence: match.competence }
      }
      const identity = getIdentityValue(activeCategory, tempData)
      if (!identity) {
        // Pas d'identité complète mais on applique quand même les données partielles
        if (tempData.competence !== data.competence) {
          editLoadedRef.current = true
          setAllData(prev => ({ ...prev, [activeCategory]: { ...prev[activeCategory], ...tempData } }))
          setTimeout(() => { editLoadedRef.current = false }, 200)
        }
        return
      }
      const existing = findExisting(activeCategory, identity, loadedData, savedItems)
      if (!existing) return
      const formData = itemToFormData(activeCategory, existing)
      if (formData) {
        editLoadedRef.current = true
        setAllData(prev => ({ ...prev, [activeCategory]: formData }))
        setEditMode({ source: existing._source, label: getIdentityLabel(activeCategory, identity, formData) })
        setTimeout(() => { editLoadedRef.current = false }, 200)
      }
      return
    }

    // Pour les autres catégories : chercher par le champ sélectionné (nom, etc.)
    // directement dans les données, pas par slug
    const valueLower = value.toLowerCase()

    // Chercher d'abord dans saved, puis dans loaded
    let existing = saved.find(item => (item[fieldKey] || '').toLowerCase() === valueLower)
    let source = 'saved'
    if (!existing) {
      existing = loaded.find(item => (item[fieldKey] || '').toLowerCase() === valueLower)
      source = 'loaded'
    }

    if (!existing) return

    const formData = itemToFormData(activeCategory, existing)
    if (formData) {
      editLoadedRef.current = true
      setAllData(prev => ({ ...prev, [activeCategory]: formData }))
      setEditMode({ source, label: existing.nom || existing[idKey] || value })
      setTimeout(() => { editLoadedRef.current = false }, 200)
    }
  }, [activeCategory, data, loadedData, savedItems])

  // Restore original file data (ignoring local saved edits)
  const handleLoadExisting = useCallback(() => {
    if (!currentIdentity) return
    // Search only in loaded data (file source), not in savedItems
    const dk = DATA_KEY[activeCategory]
    const idKey = IDENTITY_KEY[activeCategory]
    const loaded = loadedData?.[dk] || []
    let original = null
    if (Array.isArray(idKey)) {
      original = loaded.find(l => idKey.every(k => (l[k] || '').toLowerCase() === (currentIdentity[k] || '').toLowerCase()))
    } else {
      const name = typeof currentIdentity === 'string' ? currentIdentity : currentIdentity[idKey]
      if (name) original = loaded.find(l => (l[idKey] || '').toLowerCase() === name.toLowerCase())
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
      // Auto-generate slug from nom when creating new items (not editing)
      if (key === 'nom' && !editMode) {
        updated.slug = slugify(value)
      }
      // For modsEquipements, slug from statistique
      if (key === 'statistique' && activeCategory === 'modsEquipements' && !editMode) {
        updated.slug = slugify(value)
      }
      // For modsCompetences, slug from competence + emplacement
      if ((key === 'competence' || key === 'emplacement') && activeCategory === 'modsCompetences' && !editMode) {
        updated.slug = slugify((updated.competence || '') + '_' + (updated.emplacement || ''))
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

  // Détecte si le slug auto-généré entre en conflit avec un élément existant (hors mode édition)
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
  }, [activeCategory, data])

  // --- SAVE ---
  const handleSave = useCallback(() => {
    const cleaned = cleanOutput(data, activeCategory)
    if (!cleaned || Object.keys(cleaned).length === 0) return
    const identity = getIdentityValue(activeCategory, cleaned)
    if (!identity) { showToast('⚠ Champs identifiants requis', 'yellow'); return }
    const idKey = IDENTITY_KEY[activeCategory]

    setSavedItems(prev => {
      const catItems = [...(prev[activeCategory] || [])]
      // Find existing by identity
      const matchFn = Array.isArray(idKey)
        ? (item) => idKey.every(k => (item[k] || '').toLowerCase() === (identity[k] || '').toLowerCase())
        : (item) => (item[idKey] || '').toLowerCase() === (typeof identity === 'string' ? identity : '').toLowerCase()
      const idx = catItems.findIndex(matchFn)
      if (idx >= 0) catItems[idx] = cleaned
      else catItems.push(cleaned)
      const next = { ...prev, [activeCategory]: catItems }

      // For ensembles, also save equipment pieces (only for new ensembles, not edits)
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
  }, [data, activeCategory, equipmentSet])

  // --- EXPORT ZIP ---
  const handleExport = useCallback(async () => {
    if (!loadedData) return
    const zip = new JSZip()

    /**
     * Convertit un array [{ slug, ...props }] en objet { slug: { ...props } }
     * pour l'export en format slug-keyed JSONC.
     */
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

      // Competences: export in grouped format (slug-keyed object)
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

      // Exclure les armes spécifiques (proviennent de class-spe.jsonc, pas de armes.jsonc)
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

  const TOAST_STYLES = {
    green: 'bg-green-500/20 border-green-500/40 text-green-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    blue: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    red: 'bg-red-500/20 border-red-500/40 text-red-400',
  }

  return (
    <div className="min-h-screen bg-tactical-bg text-white fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-10 right-4 z-50 px-4 py-2 rounded-lg border shadow-lg text-sm font-bold uppercase tracking-widest ${TOAST_STYLES[toast.color] || TOAST_STYLES.green}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-tactical-border bg-tactical-panel/50">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-widest">
              <span className="text-shd">⚙</span> Générateur <span className='text-shd'>JSONC</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Créez et éditez des objets JSONC pour les fichiers de données
            </p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            {savedCount > 0 && (
              <>
                <span className="text-xs text-gray-500 mr-1">{savedCount} enregistré{savedCount > 1 ? 's' : ''}</span>
                <button onClick={handlePurgeAll}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  🗑 Purger tout
                </button>
              </>
            )}
            <button onClick={() => setShowReview(true)}
              className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
              📦 Exporter ZIP
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-2 sm:px-4 py-3 border-b border-tactical-border bg-tactical-panel/30">
        <div className="flex flex-wrap gap-1.5">
          {GENERATOR_CATEGORIES.map(cat => {
            const catSaved = savedItems[cat.key]?.length || 0
            return (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setEditMode(null); editLoadedRef.current = false }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border relative ${
                  activeCategory === cat.key
                    ? 'bg-shd/15 text-shd border-shd/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover border-transparent'
                }`}>
                <span className="mr-1">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                {catSaved > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-shd text-black text-[8px] font-black rounded-full flex items-center justify-center">{catSaved}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
              ⚠ Mode édition — « {editMode.label} »
            </p>
            <p className="text-xs text-yellow-400/60 mt-0.5">
              {editMode.source === 'saved'
                ? 'Cet élément a été modifié localement. Enregistrer écrasera la version locale.'
                : 'Cet élément existe dans les données source. Enregistrer créera une modification locale.'}
            </p>
          </div>
          <button onClick={handleLoadExisting}
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/15 transition-colors shrink-0 whitespace-nowrap"
            title="Restaure les données originales du fichier source (avant modifications locales)">
            ↺ Restaurer l'original
          </button>
        </div>
      )}

      {/* Main content: Form + Preview */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                {GENERATOR_CATEGORIES.find(c => c.key === activeCategory)?.icon}{' '}
                {GENERATOR_CATEGORIES.find(c => c.key === activeCategory)?.label}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">Les champs vides seront omis de la sortie</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleSave}
                className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                💾 Enregistrer
              </button>
              <button onClick={handleReset}
                className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                ↺ Vider
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {data.slug && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-tactical-bg/50 rounded border border-tactical-border/30">
                  <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">Slug</span>
                  <code className="text-xs text-shd/70 font-mono">{data.slug}</code>
                  {editMode && <span className="text-xs text-yellow-500/60 ml-auto">🔒 Non modifiable</span>}
                </div>
                {slugConflict && (
                  <div className="mt-1.5 px-2.5 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                    <span className="font-bold">⚠ Conflit :</span> le slug <code className="font-mono bg-yellow-500/10 px-1 rounded">{data.slug}</code> correspond
                    à « <span className="font-bold">{slugConflict.nom}</span> »
                    {slugConflict.source === 'saved' ? ' (modifié localement)' : ' (données source)'}.
                    Enregistrer écrasera cet élément.
                  </div>
                )}
              </div>
            )}
            {config && (
              <GeneratorForm
                fields={config.fields}
                data={data}
                onChange={handleChange}
                suggestions={suggestions}
                onIdentitySelect={handleIdentitySelect}
              />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4 lg:sticky lg:top-6 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Ensemble preview */}
          {activeCategory === 'ensembles' ? (
            <>
              <JsoncPreview data={cleanedData} comment={config?.comment || ''} label="ensembles.jsonc" />
              {equipmentSet && !editMode && (
                <>
                  <div className="p-3 bg-tactical-panel border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                      ⚡ 6 pièces d'équipement générées automatiquement
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      « Enregistrer » sauvegarde aussi les équipements. « Exporter ZIP » les inclut dans equipements.jsonc.
                    </p>
                  </div>
                  <JsoncPreview data={equipmentSet} comment="// Équipements générés — à insérer dans equipements.jsonc" label="equipements.jsonc" />
                </>
              )}
              {equipmentSet && editMode && (
                <div className="p-3 bg-tactical-panel border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                    ℹ Mode édition — équipements non régénérés
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Les équipements existants ne seront pas modifiés. Éditez-les individuellement dans la catégorie Équipements.
                  </p>
                </div>
              )}
            </>
          ) : (
            <JsoncPreview data={cleanedData} comment={config?.comment || ''} label={FILE_MAP[activeCategory]} />
          )}
        </div>
      </div>

      {/* Review modal */}
      {showReview && (
        <ReviewModal
          loadedData={loadedData}
          savedItems={savedItems}
          categories={GENERATOR_CATEGORIES}
          dataKey={DATA_KEY}
          identityKey={IDENTITY_KEY}
          onConfirm={() => { setShowReview(false); handleExport() }}
          onCancel={() => setShowReview(false)}
        />
      )}
    </div>
  )
}
