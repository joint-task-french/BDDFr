import React from 'react'
import {GameIcon, resolveAttributeIcon} from "../../../utils/gameAssets.jsx";
import MarkdownText from '../../common/MarkdownText'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function ModEquipementCard({ item, allAttributs }) {
  const icon = resolveAttributeIcon(item.categorie)

  const attributs = Array.isArray(item.attributs) ? item.attributs.map(entry => {
    let attrDef = null
    if (allAttributs && !Array.isArray(allAttributs)) {
      attrDef = allAttributs[entry.attribut]
    } else if (Array.isArray(allAttributs)) {
      attrDef = allAttributs.find(a => a.slug === entry.attribut)
    }
    return {
      nom: attrDef?.nom || entry.attribut,
      min: attrDef?.min,
      max: attrDef?.max,
      unite: attrDef?.unite || '',
    }
  }) : []

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex">
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex items-center flex-row gap-1 font-bold text-xs uppercase tracking-widest">
          <GameIcon src={icon} alt="" size="w-5 h-5" />
          <span className='text-shd truncate'>{item.nom || item.slug}</span>
        </div>

        {attributs.length > 0 && (
          <div className="grid grid-cols-2 gap-px mt-2 mb-2">
            <div className="text-center font-bold text-xs text-gray-600 uppercase tracking-widest col-span-2">Valeurs min/max du mod</div>
            {attributs.map((attr, i) => (
              <React.Fragment key={attr.nom + i}>
                <div className="text-center">
                  <div className="text-xs text-gray-600 uppercase tracking-widest">Min</div>
                  <div className="text-sm font-bold text-gray-300">{attr.min != null ? `${attr.min}${attr.unite}` : '—'}</div>
                  <div className="text-xs mt-1 text-gray-500">{attr.nom}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 uppercase tracking-widest">Max</div>
                  <div className="text-sm font-bold text-shd">{attr.max != null ? `${attr.max}${attr.unite}` : '—'}</div>
                  <div className="text-xs mt-1 text-gray-500">{attr.nom}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {hasContent(item.notes) && (
          <div className="mt-2 pt-2 border-t border-tactical-border/50">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Notes</div>
            <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
              {item.notes}
            </MarkdownText>
          </div>
        )}
      </div>
    </div>
  )
}
