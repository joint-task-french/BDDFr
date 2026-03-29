import { useState } from 'react'
import { useDataLoader } from '../hooks/useDataLoader'
import Loader from '../components/common/Loader'
import { ChevronDown, ChevronRight } from 'lucide-react'
import MarkdownText from "../components/common/MarkdownText.jsx";

function parseDate(dateObj) {
  // Accepte soit une string (YYYY-MM-DD), soit un objet {from, to}
  if (!dateObj) return null
  if (typeof dateObj === 'string') {
    const [year, month, day] = dateObj.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
  }
  if (typeof dateObj === 'object' && dateObj.from) {
    const [year, month, day] = dateObj.from.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
  }
  return null
}

function formatDateFr(dateObj) {
  if (!dateObj) return ''
  if (typeof dateObj === 'string') {
    const d = parseDate(dateObj)
    if (!d) return dateObj
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  if (typeof dateObj === 'object' && dateObj.from && dateObj.to) {
    const dFrom = parseDate(dateObj.from)
    const dTo = parseDate(dateObj.to)
    if (!dFrom || !dTo) return `${dateObj.from} - ${dateObj.to}`
    return `${dFrom.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} au ${dTo.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }
  return ''
}

export default function ChangelogPage() {
  const { data, loading, error, progress } = useDataLoader()

  if (loading) return <Loader progress={progress} />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-400 text-lg font-bold uppercase tracking-widest mb-2">Erreur de chargement</p>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  )

  let changelog = data.changelog || []
  const meta = data.metadata || {}

  // Trie le changelog par date décroissante (plus récente en premier)
  changelog = changelog.slice().sort((a, b) => {
    const da = parseDate(a.date)
    const db = parseDate(b.date)
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return db - da
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
          Journal des <span className="text-shd">Modifications</span>
        </h2>
        <p className="text-sm text-gray-500">
          Historique des mises à jour de la base de données
          {meta.version && <span> — <span className="text-shd">{meta.version}</span></span>}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-3.75 top-0 bottom-0 w-px bg-tactical-border" />

        <div className="space-y-6">
          {changelog.map((entry, index) => (
            <ChangelogEntry
              key={index}
              entry={entry}
              isFirst={index === 0}
              isLatest={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Crédits */}
      {meta.credits && meta.credits.length > 0 && (
        <div className="mt-12 pt-8 border-t border-tactical-border">
          <h3 className="text-sm font-bold text-shd uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>👥</span> Contributeurs
          </h3>
          <div className="flex flex-wrap gap-2">
            {meta.credits.map((name, i) => (
              <span key={i} className="px-3 py-1.5 bg-shd/10 text-shd border border-shd/30 rounded text-xs font-bold uppercase tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChangelogEntry({ entry, isFirst, isLatest }) {
  const hasPatch = entry.patch && entry.patch.trim() !== ''
  const [open, setOpen] = useState(true)

  return (
    <div className="relative pl-10 fade-in">
      {/* Point sur la timeline */}
      <div className={`absolute left-2.25 top-1 w-3.25 h-3.25 rounded-full border-2 ${
        isFirst
          ? 'bg-shd border-shd shadow-[0_0_8px_#ff9000]'
          : 'bg-tactical-panel border-tactical-border'
      }`} />

      {/* Carte */}
      <div className={`bg-tactical-panel border rounded-lg overflow-hidden ${
        isFirst
          ? 'border-shd/30'
          : 'border-tactical-border'
      }`}>
        <div className="px-4 py-2.5 border-b border-tactical-border/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={open ? 'Replier' : 'Déplier'}
              className="text-shd/60 hover:text-shd transition-colors focus:outline-none"
              onClick={() => setOpen(v => !v)}
            >
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            <span className={`text-sm font-bold uppercase tracking-wide ${isFirst ? 'text-shd' : 'text-gray-300'}`}>📅 {formatDateFr(entry.date)}</span>
          </div>
          {hasPatch && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded uppercase tracking-widest">
              {entry.patch}
            </span>
          )}
        </div>

        {/* Liste des changements */}
        {open && entry.changements && entry.changements.length > 0 && (
          <ul className="px-4 py-3 space-y-1.5">
            {entry.changements.map((change, i) => (
              <ChangeItem key={i} change={change} defaultOpen={!!isLatest} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


function ChangeItem({ change, defaultOpen }) {
  const isObject = typeof change === 'object' && change !== null
  const [open, setOpen] = useState(!!defaultOpen)

  if (!isObject) {
    const raw = String(change || '').trim()
    return (
      <li className="flex flex-col gap-1 text-sm text-gray-300 leading-relaxed">
        <MarkdownText>{raw}</MarkdownText>
      </li>
    )
  }

  const title = change.titre || change.title || 'Détail'
  let description = change.description || ''

  // Si description est un tableau, on le transforme en liste markdown
  if (Array.isArray(description)) {
    description = description.map(item => `- ${item}`).join('\n')
  }

  return (
    <li className="flex flex-col gap-1 text-sm text-gray-400 leading-relaxed">
      <button
        type="button"
        className="group flex items-start gap-2 text-left w-full"
        onClick={() => setOpen(v => !v)}
      >
        <span className="mt-0.5 shrink-0 text-shd/60 group-hover:text-shd transition-colors">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="font-semibold text-gray-200 group-hover:text-white">{title}</span>
      </button>
      {open && (
        <div className="pl-6 text-gray-300">
            <MarkdownText>{description}</MarkdownText>
        </div>
      )}
    </li>
  )
}
