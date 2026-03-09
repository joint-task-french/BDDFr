/**
 * Composant réutilisable pour afficher l'obtention structurée d'un objet (arme ou équipement).
 * Seuls les sous-champs réellement présents (!== undefined) sont affichés.
 * Si l'objet obtention est absent ou ne contient aucun sous-champ défini, rien n'est rendu.
 */
const OBTENTION_METHODS = [
  { key: 'butinCible', label: 'Butin ciblé' },
  { key: 'cachesExotiques', label: 'Caches exotiques' },
  { key: 'mission', label: 'Mission' },
  { key: 'raid', label: 'Raid' },
  { key: 'incursion', label: 'Incursion' },
]

function hasObtentionContent(obt) {
  if (!obt || typeof obt !== 'object') return false
  if (obt.description && obt.description.trim()) return true
  if (obt.represailles) return true
  return OBTENTION_METHODS.some(m => obt[m.key] !== undefined && obt[m.key] !== null)
}

function getMethodStatus(value) {
  if (typeof value === 'string' && value.length > 0) return 'conditional'
  if (value === true) return 'available'
  return 'unavailable'
}

export default function ObtentionDisplay({ obtention }) {
  if (!hasObtentionContent(obtention)) return null

  const presentMethods = OBTENTION_METHODS.filter(m => obtention[m.key] !== undefined && obtention[m.key] !== null)

  return (
    <div className="px-4 py-2 border-t border-tactical-border/50">
      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">Obtention</div>

      {presentMethods.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {presentMethods.map(m => {
            const status = getMethodStatus(obtention[m.key])
            return (
              <div key={m.key} className="flex items-start gap-1.5 text-xs">
                {status === 'available' && (
                  <span className="text-green-400 shrink-0 mt-px">✔</span>
                )}
                {status === 'unavailable' && (
                  <span className="text-red-400/60 shrink-0 mt-px">✕</span>
                )}
                {status === 'conditional' && (
                  <span className="text-amber-400 shrink-0 mt-px">⚠</span>
                )}
                <span className={
                  status === 'available' ? 'text-green-400' :
                  status === 'conditional' ? 'text-amber-400' :
                  'text-gray-600 line-through'
                }>
                  {m.label}
                  {status === 'conditional' && (
                    <span className="text-amber-400/70 ml-1 no-underline inline">
                      — {obtention[m.key]}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {obtention.represailles && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded border bg-orange-500/20 text-orange-400 border-orange-500/30">
            Schémas représailles : {obtention.represailles}
          </span>
        </div>
      )}

      {obtention.description && obtention.description.trim() && (
        <div className="text-xs text-gray-500 leading-relaxed mt-1.5 whitespace-pre-line">
          {obtention.description}
        </div>
      )}
    </div>
  )
}

export { hasObtentionContent }
