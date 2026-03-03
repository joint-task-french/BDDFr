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
    case 'enum': return <EnumInput field={field} value={value} onChange={onChange} />
    case 'array': return <ArrayInput field={field} value={value} onChange={onChange} />
    case 'objectArray': return <ObjectArrayInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    case 'checkboxMap': return <CheckboxMapInput field={field} value={value} onChange={onChange} />
    case 'radioGroup': return <RadioGroupInput field={field} value={value} onChange={onChange} />
    case 'tagSelect': return <TagSelectInput field={field} value={value} onChange={onChange} />
    case 'autocomplete': return <AutocompleteInput field={field} value={value} onChange={onChange} onSelect={onSelect} suggestions={suggestions} />
    case 'autocomplete_array': return <AutocompleteArrayInput field={field} value={value} onChange={onChange} suggestions={suggestions} />
    default: return null
  }
}

function FieldLabel({ field }) {
  return (
    <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1">
      {field.label}
      {field.required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

const inputClass = 'w-full bg-tactical-bg border border-tactical-border rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-shd/50 transition-colors'

function TextInput({ field, value, onChange }) {
  return (
    <div>
      <FieldLabel field={field} />
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''} className={inputClass} />
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
  return (
    <div>
      <FieldLabel field={field} />
      <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value)}
        step={field.step || 'any'} className={inputClass} />
    </div>
  )
}

function BooleanInput({ field, value, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer group">
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-tactical-border bg-tactical-bg accent-shd cursor-pointer" />
      <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{field.label}</span>
    </label>
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
function TagSelectInput({ field, value, onChange }) {
  const isSingle = field.singleSelect
  const selected = isSingle ? (value ? [value] : []) : (Array.isArray(value) ? value : [])

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
        {field.options.map(opt => {
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

  const filtered = useMemo(() => {
    const q = (query || value || '').toLowerCase()
    if (!q) return list.slice(0, 20)
    return list.filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)).slice(0, 20)
  }, [list, query, value])

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
      <input type="text" value={value || ''} placeholder={field.placeholder || 'Rechercher...'}
        onChange={e => { onChange(e.target.value); setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
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
        className="mt-1.5 text-[11px] text-shd/60 hover:text-shd uppercase tracking-widest transition-colors">
        + Ajouter
      </button>
    </div>
  )
}

function ObjectArrayInput({ field, value, onChange, suggestions }) {
  const items = Array.isArray(value) ? value : []
  const subFields = field.fields || []

  const add = () => {
    const empty = {}
    subFields.forEach(f => { empty[f.key] = '' })
    onChange([...items, empty])
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, key, v) => {
    const arr = [...items]
    const sf = subFields.find(f => f.key === key)
    arr[i] = { ...arr[i], [key]: sf?.type === 'number' ? (v === '' ? '' : Number(v)) : v }
    onChange(arr)
  }

  return (
    <div>
      <FieldLabel field={field} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5 items-end bg-tactical-bg/50 rounded p-2 border border-tactical-border/30">
            {subFields.map(sf => (
              <div key={sf.key} className="flex-1 min-w-0">
                <span className="text-[9px] text-gray-600 uppercase">{sf.label}</span>
                {sf.type === 'autocomplete' ? (
                  <AutocompleteInput
                    field={sf}
                    value={item[sf.key] || ''}
                    onChange={v => update(i, sf.key, v)}
                    suggestions={suggestions}
                  />
                ) : (
                  <input
                    type={sf.type === 'number' ? 'number' : 'text'}
                    value={item[sf.key] ?? ''}
                    onChange={e => update(i, sf.key, e.target.value)}
                    step={sf.type === 'number' ? 'any' : undefined}
                    className={`${inputClass} text-xs py-1`}
                  />
                )}
              </div>
            ))}
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-300 text-xs px-1.5 py-1 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors shrink-0">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="mt-1.5 text-[11px] text-shd/60 hover:text-shd uppercase tracking-widest transition-colors">
        + Ajouter
      </button>
    </div>
  )
}

function CheckboxMapInput({ field, value, onChange }) {
  const map = value || {}
  const toggle = (key) => onChange({ ...map, [key]: !map[key] })

  return (
    <div>
      <FieldLabel field={field} />
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {field.keys.map(k => (
          <label key={k.key} className="flex items-center gap-1.5 cursor-pointer group text-sm">
            <input type="checkbox" checked={!!map[k.key]} onChange={() => toggle(k.key)}
              className="w-3.5 h-3.5 rounded border-tactical-border bg-tactical-bg accent-shd cursor-pointer" />
            <span className="text-gray-400 group-hover:text-gray-200 transition-colors text-[12px]">{k.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}








