import { useState, useMemo, useRef, useEffect } from 'react'

/**
 * Formulaire générique piloté par une configuration de champs.
 * Supporte : text, textarea, number, boolean, enum, array,
 * objectArray, checkboxMap, radioGroup, tagSelect, autocomplete, autocomplete_array
 */
export default function GeneratorForm({ fields, data, onChange, suggestions, onIdentitySelect }) {
  return (
    <div className="space-y-3">
      {fields.map(field => {
        // Conditional visibility
        if (field.visibleWhen) {
          const depVal = data[field.visibleWhen.key]
          if (depVal !== field.visibleWhen.value) return null
        }
        if (field.hiddenWhen) {
          const depVal = data[field.hiddenWhen.key]
          if (depVal === field.hiddenWhen.value) return null
        }
        return (
          <FieldRenderer key={field.key} field={field} value={data[field.key]}
            onChange={(v) => onChange(field.key, v)}
            onSelect={field.isIdentity ? (v) => onIdentitySelect?.(field.key, v) : null}
            suggestions={suggestions} />
        )
      })}
    </div>
  )
}

function FieldRenderer({ field, value, onChange, onSelect, suggestions }) {
  switch (field.type) {
    case 'text': return <TextInput field={field} value={value} onChange={onChange} />
    case 'textarea': return <TextArea field={field} value={value} onChange={onChange} />
    case 'number': return <NumberInput field={field} value={value} onChange={onChange} />
    case 'boolean': return <BooleanInput field={field} value={value} onChange={onChange} />
    case 'triState': return <TriStateInput field={field} value={value} onChange={onChange} />
    case 'enum': return <EnumInput field={field} value={value} onChange={onChange} />
    case 'array': return <ArrayInput field={field} value={value} onChange={onChange} />
    case 'objectArray': return <ObjectArrayInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    case 'objectGroup': return <ObjectGroupInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    case 'checkboxMap': return <CheckboxMapInput field={field} value={value} onChange={onChange} />
    case 'radioGroup': return <RadioGroupInput field={field} value={value} onChange={onChange} />
    case 'tagSelect': return <TagSelectInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    case 'autocomplete': return <AutocompleteInput field={field} value={value} onChange={onChange} onSelect={onSelect} suggestions={suggestions} />
    case 'autocomplete_array': return <AutocompleteArrayInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    default: return null
  }
}

function FieldLabel({ field }) {
  return (
    <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">
      {field.label}
      {field.required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

const inputClass = 'w-full bg-tactical-bg border border-tactical-border rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-shd/50 transition-colors'

function TextInput({ field, value, onChange }) {
  const isInvalid = field.pattern && value && !new RegExp(field.pattern).test(value)
  return (
    <div>
      <FieldLabel field={field} />
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        pattern={field.pattern}
        className={`${inputClass} ${isInvalid ? 'border-red-500/60' : ''}`} />
      {isInvalid && (
        <p className="text-2xs text-red-400 mt-0.5">Format attendu : {field.patternHint || field.pattern}</p>
      )}
    </div>
  )
}

function TextArea({ field, value, onChange }) {
  return (
    <div>
      <FieldLabel field={field} />
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
        placeholder={field.placeholder || ''} className={`${inputClass} resize-y min-h-15`} />
    </div>
  )
}

function NumberInput({ field, value, onChange }) {
  const handleKeyDown = (e) => {
    // Autoriser : navigation, suppression, copier/coller
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (allowed.includes(e.key)) return
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return
    // Autoriser : chiffres, point, virgule, signe négatif
    if (/^[0-9.\-,]$/.test(e.key)) return
    e.preventDefault()
  }
  const handleChange = (e) => {
    // Nettoyer la valeur : ne garder que chiffres, point, signe négatif
    const raw = e.target.value.replace(',', '.')
    if (raw === '' || raw === '-' || raw === '.') { onChange(raw); return }
    if (/^-?\d*\.?\d*$/.test(raw)) onChange(raw)
  }
  return (
    <div>
      <FieldLabel field={field} />
      <input type="number" value={value ?? ''} onChange={handleChange} onKeyDown={handleKeyDown}
        step={field.step || 'any'}
        min={field.min}
        max={field.max}
        className={inputClass} />
    </div>
  )
}

function BooleanInput({ field, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <span
        className={`relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all shrink-0 ${
          value
            ? 'bg-shd/20 border-shd text-shd'
            : 'bg-tactical-bg border-tactical-border group-hover:border-gray-500'
        }`}
      >
        {value && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{field.label}</span>
    </label>
  )
}

/**
 * Champ tri-état étendu :
 *   null/undefined → non défini (absent du JSON)
 *   true           → vrai (booléen)
 *   false          → faux (booléen, explicitement présent dans le JSON)
 *   string         → texte personnalisé
 * Cycle bouton : null → true → false → string → null
 */
function TriStateInput({ field, value, onChange }) {
  const status = typeof value === 'string' ? 'string'
    : value === true ? 'true'
    : value === false ? 'false'
    : 'null'

  const cycle = () => {
    if (status === 'null') onChange(true)
    else if (status === 'true') onChange(false)
    else if (status === 'false') onChange('')   // → mode texte (string vide)
    else onChange(null)                         // string → retour à null
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={cycle}
          className={`relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all shrink-0 ${
            status === 'true' ? 'bg-green-500/20 border-green-500 text-green-400' :
            status === 'false' ? 'bg-red-500/20 border-red-500 text-red-400' :
            status === 'string' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
            'bg-tactical-bg border-tactical-border hover:border-gray-500'
          }`}
        >
          {status === 'true' && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'false' && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status === 'string' && (
            <span className="text-xs font-bold leading-none">T</span>
          )}
          {status === 'null' && (
            <span className="w-2 h-0.5 bg-gray-600 rounded-full" />
          )}
        </button>
        <span className={`text-sm transition-colors ${
          status === 'true' ? 'text-green-400' :
          status === 'false' ? 'text-red-400' :
          status === 'string' ? 'text-amber-400' :
          'text-gray-500'
        }`}>
          {field.label}
          <span className="ml-1.5 text-xs opacity-60">
            {status === 'true' && '(vrai)'}
            {status === 'false' && '(faux)'}
            {status === 'string' && '(texte)'}
            {status === 'null' && '(non défini)'}
          </span>
        </span>
      </div>
      {status === 'string' && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Décrivez les conditions..."
          className={`${inputClass} ml-7`}
          autoFocus
        />
      )}
    </div>
  )
}

function EnumInput({ field, value, onChange }) {
  return (
    <div>
      <FieldLabel field={field} />
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className={`${inputClass} cursor-pointer`}>
        <option value="">— Sélectionner —</option>
        {field.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

/** Radio group pour champs exclusifs (ex: Standard / Exotique / Nommé) */
function RadioGroupInput({ field, value, onChange }) {
  const activeStyles = {
    '': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    exo: 'bg-red-500/20 text-red-400 border-red-500/40',
    nom: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="flex flex-wrap gap-2">
        {field.options.map(opt => {
          const active = value === opt.value
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
                active
                  ? (activeStyles[opt.value] || activeStyles[''])
                  : 'text-gray-500 border-tactical-border hover:text-gray-300 hover:border-gray-500'
              }`}>
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Tags cliquables — multi-select (array) ou single-select (string) */
function TagSelectInput({ field, value, onChange, suggestions }) {
  const isSingle = field.singleSelect
  const selected = isSingle ? (value ? [value] : []) : (Array.isArray(value) ? value : [])

  // Resolve options: static from field.options, or dynamic from suggestions
  const options = useMemo(() => {
    if (field.dynamicOptions && suggestions?.[field.dynamicOptions]) {
      const raw = suggestions[field.dynamicOptions]
      return raw.map(s => typeof s === 'string' ? { value: s, label: s, color: 'yellow' } : { ...s, color: s.color || 'yellow' })
    }
    return field.options || []
  }, [field, suggestions])

  const toggle = (v) => {
    if (isSingle) {
      onChange(selected.includes(v) ? '' : v)
    } else {
      if (selected.includes(v)) {
        onChange(selected.filter(x => x !== v))
      } else {
        onChange([...selected, v])
      }
    }
  }
  const colorStyles = {
    red: { active: 'bg-red-500/20 text-red-400 border-red-500/40', hover: 'hover:border-red-500/30' },
    blue: { active: 'bg-blue-500/20 text-blue-400 border-blue-500/40', hover: 'hover:border-blue-500/30' },
    yellow: { active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', hover: 'hover:border-yellow-500/30' },
    green: { active: 'bg-green-500/20 text-green-400 border-green-500/40', hover: 'hover:border-green-500/30' },
  }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt.value)
          const cs = colorStyles[opt.color] || colorStyles.yellow
          return (
            <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
                active ? cs.active : `text-gray-500 border-tactical-border ${cs.hover}`
              }`}>
              {active && '✓ '}{opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Input avec autocomplétion dropdown. Supporte les suggestions en string ou {value, label}. */
function AutocompleteInput({ field, value, onChange, onSelect, suggestions }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const rawList = suggestions?.[field.suggestionsKey] || []

  // Normalise les suggestions : toujours { value, label }
  const list = useMemo(() =>
    rawList.map(s => typeof s === 'string' ? { value: s, label: s } : s),
    [rawList]
  )

  // Résoudre la valeur affichée : si la valeur est un slug, afficher le label correspondant
  const displayValue = useMemo(() => {
    if (!value) return ''
    const match = list.find(s => s.value === value)
    return match ? match.label : value
  }, [value, list])

  const filtered = useMemo(() => {
    const q = (query || displayValue || '').toLowerCase()
    if (!q) return list.slice(0, 20)
    return list.filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)).slice(0, 20)
  }, [list, query, displayValue])

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (s) => {
    onChange(s.value)
    setOpen(false)
    setQuery('')
    // Signal that user selected from the list (not just typed)
    onSelect?.(s.value)
  }

  return (
    <div ref={ref} className="relative">
      <FieldLabel field={field} />
      <input type="text" value={query || (open ? '' : displayValue)} placeholder={field.placeholder || 'Rechercher...'}
        onChange={e => { onChange(e.target.value); setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(displayValue); setOpen(true) }}
        className={inputClass} />
      {open && filtered.length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-tactical-panel border border-tactical-border rounded shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s.value} type="button" onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-shd/10 hover:text-shd transition-colors truncate">
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Array d'éléments avec autocomplétion pour chaque ajout */
/** Array d'éléments avec autocomplétion. Supporte les suggestions en string ou {value, label}. */
function AutocompleteArrayInput({ field, value, onChange, suggestions }) {
  const items = Array.isArray(value) ? value : []
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const rawList = suggestions?.[field.suggestionsKey] || []

  // Normalise les suggestions : toujours { value, label }
  const list = useMemo(() =>
    rawList.map(s => typeof s === 'string' ? { value: s, label: s } : s),
    [rawList]
  )

  // Map slug → label pour l'affichage
  const labelMap = useMemo(() => {
    const m = {}
    for (const s of list) m[s.value] = s.label
    // Also check _slugToName global map
    const slugMap = suggestions?._slugToName || {}
    for (const [k, v] of Object.entries(slugMap)) m[k] = v
    return m
  }, [list, suggestions])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const existing = new Set(items.map(i => (typeof i === 'string' ? i : i).toLowerCase()))
    let res = list.filter(s => !existing.has(s.value.toLowerCase()))
    if (q) res = res.filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q))
    return res.slice(0, 20)
  }, [list, query, items])

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const add = (val) => { onChange([...items, val]); setQuery(''); setOpen(false) }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const addCustom = () => { if (query.trim()) { add(query.trim()) } }

  return (
    <div ref={ref}>
      <FieldLabel field={field} />
      {/* Éléments sélectionnés */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-shd/10 text-shd border border-shd/30 rounded text-xs">
              {labelMap[item] || item}
              <button type="button" onClick={() => remove(i)} className="text-shd/60 hover:text-red-400 ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}
      {/* Input de recherche */}
      <div className="relative">
        <input type="text" value={query} placeholder={field.placeholder || 'Rechercher...'}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          className={inputClass} />
        {open && filtered.length > 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-tactical-panel border border-tactical-border rounded shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(s => (
              <button key={s.value} type="button" onClick={() => add(s.value)}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-shd/10 hover:text-shd transition-colors truncate">
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArrayInput({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : []

  const add = () => onChange([...items, ''])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, v) => { const arr = [...items]; arr[i] = v; onChange(arr) }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            {field.itemType === 'enum' ? (
              <select value={item} onChange={e => update(i, e.target.value)}
                className={`${inputClass} flex-1`}>
                <option value="">— Choisir —</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={item} onChange={e => update(i, e.target.value)}
                placeholder={field.placeholder || ''} className={`${inputClass} flex-1`} />
            )}
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors shrink-0">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="mt-1.5 text-xs text-shd/60 hover:text-shd uppercase tracking-widest transition-colors">
        + Ajouter
      </button>
    </div>
  )
}

/** Tableau d'objets avec sous-champs. Ex: attributs [{ nom, valeur }, ...] */
function ObjectArrayInput({ field, value, onChange, suggestions }) {
  const items = Array.isArray(value) ? value : []
  const subFields = field.fields || []

  const add = () => {
    const empty = {}
    for (const sf of subFields) {
      empty[sf.key] = sf.type === 'number' ? '' : ''
    }
    onChange([...items, empty])
  }

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))

  const update = (i, key, val) => {
    const arr = [...items]
    arr[i] = { ...arr[i], [key]: val }
    onChange(arr)
  }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 bg-tactical-bg/50 rounded border border-tactical-border/30 p-2">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subFields.map(sf => (
                <FieldRenderer
                  key={sf.key}
                  field={sf}
                  value={item[sf.key]}
                  onChange={v => update(i, sf.key, v)}
                  suggestions={suggestions}
                />
              ))}
            </div>
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors shrink-0 mt-5">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="mt-1.5 text-xs text-shd/60 hover:text-shd uppercase tracking-widest transition-colors">
        + Ajouter
      </button>
    </div>
  )
}

/** Groupe de sous-champs formant un objet. Ex: obtention { description, butinCible, ... } */
function ObjectGroupInput({ field, value, onChange, suggestions }) {
  const obj = value && typeof value === 'object' ? value : {}
  const subFields = field.fields || []

  const updateField = (key, val) => {
    onChange({ ...obj, [key]: val })
  }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="bg-tactical-bg/50 rounded border border-tactical-border/30 p-3 space-y-2.5">
        {subFields.map(sf => (
          <FieldRenderer
            key={sf.key}
            field={sf}
            value={obj[sf.key]}
            onChange={v => updateField(sf.key, v)}
            suggestions={suggestions}
          />
        ))}
      </div>
    </div>
  )
}

function CheckboxMapInput({ field, value, onChange }) {
  const map = value || {}
  const toggle = (key) => onChange({ ...map, [key]: !map[key] })

  return (
    <div>
      <FieldLabel field={field} />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {field.keys.map(k => (
          <label key={k.key} className="flex items-center gap-2 cursor-pointer group">
            <span
              className={`relative inline-flex items-center justify-center w-4 h-4 rounded border-2 transition-all shrink-0 ${
                map[k.key]
                  ? 'bg-shd/20 border-shd text-shd'
                  : 'bg-tactical-bg border-tactical-border group-hover:border-gray-500'
              }`}
            >
              {map[k.key] && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <input type="checkbox" checked={!!map[k.key]} onChange={() => toggle(k.key)} className="sr-only" />
            <span className="text-gray-400 group-hover:text-gray-200 transition-colors text-xs">{k.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}



