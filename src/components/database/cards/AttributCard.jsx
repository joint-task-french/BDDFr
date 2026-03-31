import { resolveAttributeIcon, GameIcon } from '../../common/gameAssets.jsx'
import { getAttrCategoryLabel } from '../../../utils/formatters'
import MarkdownText from '../../common/MarkdownText'

const CATEGORIE_COLORS = {
  offensif: 'text-red-400 bg-red-500/10 border-red-500/30',
  defensif: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  utilitaire: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
}

const CIBLE_LABELS = {
  arme: 'Armes',
  equipement: 'Équipements',
  mod_arme: "Mods d'armes",
  mod_equipement: "Mods d'équipements",
  competence: 'Compétences',
  mod_competence: 'Mods de compétences',
}

export default function AttributCard({ item, attributsType }) {
  const catColor = CATEGORIE_COLORS[item.categorie] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
  const icon = resolveAttributeIcon(item.categorie)
  const essentialColor = item.estEssentiel ? 'text-shd' : 'text-white'


  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          <GameIcon src={icon} alt="" size="w-5 h-5" />
          <div className='flex justify-between w-full'>
            <span className={ "font-bold text-sm uppercase tracking-wide " + essentialColor }>{item.nom}</span>
            { item.estEssentiel && (
                <span className={ "text-xs tracking-wide text-gray-500" }>Attribut essentiel</span>
            ) }
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${catColor}`}>
            {getAttrCategoryLabel(attributsType, item.categorie)}
          </span>
          {item.cible?.map(c => (
            <span key={c} className="text-xs font-bold uppercase tracking-widest bg-tactical-bg text-gray-500 px-1.5 py-0.5 rounded border border-tactical-border">
              {CIBLE_LABELS[c] || c}
            </span>
          ))}
        </div>
      </div>

      {/* Valeurs min/max */}
      <div className="grid grid-cols-2 gap-px bg-tactical-border/30">
        <div className="bg-tactical-bg/50 p-3 text-center">
          <div className="text-xs text-gray-600 uppercase tracking-widest">Min</div>
          <div className="text-sm font-bold text-gray-300">
            {item.min != null ? `${item.min}${item.unite || ''}` : '—'}
          </div>
        </div>
        <div className="bg-tactical-bg/50 p-3 text-center">
          <div className="text-xs text-gray-600 uppercase tracking-widest">Max</div>
          <div className="text-sm font-bold text-shd">
            {item.max != null ? `${item.max}${item.unite || ''}` : '—'}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <MarkdownText className="px-4 py-2.5 text-xs text-gray-400 leading-relaxed">
          {item.description}
        </MarkdownText>
      )}
    </div>
  )
}

