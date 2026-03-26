import { useMemo, useState } from 'react'
import MarkdownText from '../common/MarkdownText'

// Human-readable labels for known keys
const COLUMN_LABELS = {
  nom: 'Nom', type: 'Type', fabricant: 'Fabricant', portee: 'Portée', rpm: 'CPM',
  chargeur: 'Chargeur', rechargement: 'Rechargement', headshot: 'Headshot',
  attributEssentiel: 'Attribut Essentiel', degatsBase: 'Dégâts Base',
  marque: 'Marque', emplacement: 'Emplacement',
  attributUnique: 'Attribut Unique', talent: 'Talent', mod: 'Mod', estNomme: 'Nommé',
  source: 'Source', description: 'Description', prerequis: 'Prérequis',
  compatibilite: 'Compatibilité', bonus1piece: 'Bonus 1p', bonus2pieces: 'Bonus 2p',
  bonus3pieces: 'Bonus 3p', bonus4pieces: 'Bonus 4p', talentTorse: 'Talent Torse',
  talentSac: 'Talent Sac', competence: 'Compétence', variante: 'Variante',
  expertise: 'Expertise', statistiques: 'Statistiques', effetEtat: 'Effet d\'État',
  surcharge: 'Surcharge', bonus: 'Bonus', malus: 'Malus', effet: 'Effet',
  statistique: 'Statistique', valeurMax: 'Valeur Max', typeArme: 'Type',
  talent1: 'Talent 1', talent2: 'Talent 2', obtention: 'Obtention',
  notes: 'Notes',
}

// Columns to skip in display
const SKIP_COLS = ['tier1','tier2','tier3','tier4','tier5','tier6']

function formatValue(val, col, allAttributs, statistiques) {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? '✔' : '✕'
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.join(', ')
    // Nouvel objet bonus
    if (val.attributs || val.talent) {
      const parts = []
      if (val.attributs && Array.isArray(val.attributs)) {
        val.attributs.forEach(a => {
          let name = a.slug
          if (allAttributs) {
            const attrList = Array.isArray(allAttributs) ? allAttributs : Object.values(allAttributs)
            const attr = attrList.find(x => x.slug === a.slug) || allAttributs[a.slug]
            if (attr) name = attr.nom
          }
          if (name === a.slug && statistiques) {
            const statList = Array.isArray(statistiques) ? statistiques : Object.values(statistiques)
            const stat = statList.find(x => x.slug === a.slug) || statistiques[a.slug]
            if (stat) name = stat.nom
          }
          parts.push(`${a.value} ${name}`)
        })
      }
      if (val.talent) parts.push(`Talent: ${val.talent}`)
      return parts.length > 0 ? parts.join(' | ') : '—'
    }
    // obtention object
    if (col === 'obtention') {
      const parts = []
      const methods = { butinCible: 'Butin ciblé', cachesExotiques: 'Caches exotiques', mission: 'Mission', raid: 'Raid', incursion: 'Incursion' }
      for (const [k, label] of Object.entries(methods)) {
        const v = val[k]
        if (v === undefined || v === null) continue
        if (v === true) parts.push(`✔ ${label}`)
        else if (typeof v === 'string' && v.length > 0) parts.push(`⚠ ${label}: ${v}`)
        else if (v === false) parts.push(`✕ ${label}`)
      }
      if (val.represailles) parts.push(`Faction pour schemas Représailles: ${val.represailles}`)
      if (val.description && val.description.trim()) parts.push(val.description)
      return parts.length > 0 ? parts.join(' | ') : '—'
    }
    // compatibilite object
    return Object.entries(val)
      .filter(([, v]) => v)
      .map(([k]) => COLUMN_LABELS[k] || k)
      .join(', ') || '—'
  }
  if (typeof val === 'number') {
    if (col === 'headshot') return `${val}%`
    return val.toLocaleString('fr-FR')
  }
  const s = String(val)
  if (s === 'FALSE' || s === 'false') return '✕'
  if (s === '-' || s === 'n/a') return '—'
  return s
}

export default function DataTable({ items, allAttributs, statistiques }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState(1)

  const columns = useMemo(() => {
    if (!items || items.length === 0) return []
    const keys = Object.keys(items[0]).filter(k => !SKIP_COLS.includes(k))
    return keys
  }, [items])

  const sorted = useMemo(() => {
    if (!sortCol) return items
    return [...items].sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir
      return String(va).localeCompare(String(vb), 'fr') * sortDir
    })
  }, [items, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => -d)
    } else {
      setSortCol(col)
      setSortDir(1)
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div className="overflow-x-auto border border-tactical-border rounded-lg">
      <table className="w-full text-left">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest bg-tactical-panel border-b border-shd/30 cursor-pointer hover:text-shd transition-colors whitespace-nowrap select-none"
              >
                {COLUMN_LABELS[col] || col}
                {sortCol === col && (
                  <span className="ml-1 text-shd">{sortDir === 1 ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr key={i} className="hover:bg-tactical-hover transition-colors border-b border-tactical-border/30">
              {columns.map(col => (
                <td key={col} className="px-3 py-2.5 text-sm text-gray-300 align-top max-w-xs">
                  <MarkdownText className="break-words">
                    {formatValue(item[col], col, allAttributs, statistiques)}
                  </MarkdownText>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

