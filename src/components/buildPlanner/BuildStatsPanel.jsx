import { useState } from 'react'
import { useBuildStats } from '../../hooks/useBuildStats'
import CoreAttributeBars from './CoreAttributeBars'
import SetBonusList from './SetBonusList'

/**
 * Panneau de statistiques du build — affiché en sidebar.
 * Toutes les données viennent du hook useBuildStats et des données chargées.
 */
export default function BuildStatsPanel({ data }) {
  const {
    coreStats,
    weaponStats,
    attributesByCategory,
    setBonuses,
    equippedSkills,
    totalGearPieces,
    totalWeapons,
  } = useBuildStats(data)

  const isEmpty = totalGearPieces === 0 && totalWeapons === 0

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-tactical-border bg-linear-to-r from-tactical-panel to-tactical-bg">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          📊 Statistiques (beta)
        </h3>
      </div>

      <div className="p-4 space-y-5">
        {/* Core Attributes Bars */}
        <Section title="Attributs principaux" icon="🎯">
          <CoreAttributeBars coreStats={coreStats} attributsType={data.attributs_type} />
        </Section>

        {/* Statistiques de Protection / Défensives */}
        {attributesByCategory.defensif.length > 0 && (
          <Section title="Protection" icon="🛡️">
            <div className="space-y-0.5">
              {attributesByCategory.defensif.map((attr, i) => (
                <GlobalStatRow key={i} attr={attr} color="text-blue-400" />
              ))}
            </div>
          </Section>
        )}

        {/* Statistiques Utilitaires */}
        {attributesByCategory.utilitaire.length > 0 && (
          <Section title="Utilitaires" icon="🔧">
            <div className="space-y-0.5">
              {attributesByCategory.utilitaire.map((attr, i) => (
                <GlobalStatRow key={i} attr={attr} color="text-yellow-400" />
              ))}
            </div>
          </Section>
        )}

        {/* Statistiques par arme — chaque arme a ses propres stats */}
        {weaponStats.length > 0 && (
          <Section title="Armes" icon="🔫">
            <div className="space-y-3">
              {weaponStats.map((w, i) => (
                <WeaponStatBlock key={i} w={w} />
              ))}
            </div>
          </Section>
        )}

        {/* Bonus d'ensemble */}
        {(setBonuses.gearSets.length > 0 || setBonuses.brandSets.length > 0) && (
          <Section title="Bonus d'ensemble" icon="🏅">
            <SetBonusList setBonuses={setBonuses} />
          </Section>
        )}

        {/* Compétences */}
        {equippedSkills.length > 0 && (
          <Section title="Compétences" icon="⚡">
            <div className="space-y-1">
              {equippedSkills.map((skill, i) => (
                <div key={i} className="text-xs">
                  <span className="text-yellow-400 font-bold">{skill.variante}</span>
                  <span className="text-gray-600 ml-1">({skill.competence})</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Placeholder si vide */}
        {isEmpty && (
          <div className="text-center py-6">
            <div className="text-gray-600 text-3xl mb-2">📋</div>
            <p className="text-xs text-gray-600 uppercase tracking-widest">
              Équipez des éléments pour voir les statistiques
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Section collapsible dans le panneau stats */
function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs">{icon}</span>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
      </div>
      {children}
    </div>
  )
}

/** Ligne de statistique globale */
function GlobalStatRow({ attr, color = 'text-green-400' }) {
  const isMainStat = attr.nom === "Armure totale";
  return (
    <div className={`flex items-center justify-between text-xs py-0.5 border-b border-tactical-border/10 last:border-0 ${isMainStat ? 'bg-white/5 -mx-1 px-1 rounded' : ''}`}>
      <span className={`${isMainStat ? 'text-gray-300 font-bold' : 'text-gray-500'} truncate mr-2`}>{attr.nom}</span>
      <span className={`font-bold shrink-0 ${isMainStat ? 'text-blue-300' : color}`}>
        {attr.total >= 0 && !isMainStat ? '+' : ''}{formatValue(attr.total, attr.unite)}
      </span>
    </div>
  )
}


/** Formatte une valeur numérique avec son unité */
function formatValue(value, unite) {
  if (value == null) return '—'
  if (unite === 'pts' || unite === 'pts/s') {
    return `${Math.round(value).toLocaleString('fr-FR')} ${unite}`
  }
  const rounded = Math.round(value * 10) / 10
  return `${rounded}${unite || ''}`
}

/** Bloc de stats par arme — regroupe les entrées par statistique cible */
function WeaponStatBlock({ w }) {
  const [expanded, setExpanded] = useState(null) // stat slug expanded

  return (
    <div className="border border-tactical-border/30 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-white font-bold truncate mr-2">
          <span className="text-gray-600 text-xs uppercase">{w.slot}</span>{' '}
          {w.nom}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-red-400 text-xs font-bold">
            {w.degatsAffiche ? w.degatsAffiche.toLocaleString('fr-FR') : (w.degatsExpertise ? w.degatsExpertise.toLocaleString('fr-FR') : (w.degatsBase ? w.degatsBase.toLocaleString('fr-FR') : '—'))}
          </span>
          {w.expertise > 0 && (
            <span className="text-xs text-shd">+{w.expertise}%</span>
          )}
        </div>
      </div>
      {/* Stats regroupées par statistique cible */}
      {w.groupedStats && Object.keys(w.groupedStats).length > 0 && (
        <div className="space-y-0.5 mt-1 pt-1 border-t border-tactical-border/20">
          {Object.entries(w.groupedStats).map(([statSlug, entry]) => {
            const hasSources = entry.sources && entry.sources.length > 1
            const isExpanded = expanded === statSlug
            return (
              <div key={statSlug}>
                <div
                  className={`flex items-center justify-between text-xs ${hasSources ? 'cursor-pointer hover:bg-white/5 rounded px-0.5 -mx-0.5' : ''}`}
                  onClick={hasSources ? () => setExpanded(isExpanded ? null : statSlug) : undefined}
                >
                  <span className="text-gray-500 truncate mr-2 flex items-center gap-1">
                    {hasSources && (
                      <span className="text-gray-700 text-2xs">{isExpanded ? '▾' : '▸'}</span>
                    )}
                    {entry.nom}
                  </span>
                  <span className={`font-bold shrink-0 ${entry.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.total >= 0 ? '+' : ''}{formatValue(entry.total, entry.unite)}
                  </span>
                </div>
                {/* Détail des sources */}
                {isExpanded && entry.sources.map((src, si) => (
                  <div key={si} className="flex items-center justify-between text-2xs pl-4 text-gray-600">
                    <span className="truncate mr-2">{src.nom}</span>
                    <span className="shrink-0">
                      {src.valeur >= 0 ? '+' : ''}{formatValue(src.valeur, src.unite)}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}










