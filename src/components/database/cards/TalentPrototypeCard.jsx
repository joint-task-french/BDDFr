import { resolveAsset, GameIcon } from '../../common/GameAssets.jsx'
import MarkdownText from '../../common/MarkdownText'

export default function TalentPrototypeCard({ item }) {
  const nameColor = 'text-cyan-400'
  const talentIcon = resolveAsset(item.icon)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden border-l-2 border-l-cyan-500 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon src={talentIcon} alt="" size="w-6 h-6" />
            <div className={`font-bold text-sm uppercase tracking-wide ${nameColor}`}>{item.nom}</div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 px-1 py-0.5 rounded uppercase tracking-widest">
              Prototype
            </span>
          </div>
        </div>
      </div>

      {item.description && (
        <MarkdownText className="px-4 py-2.5 text-xs text-gray-400 leading-relaxed flex-1">
          {item.description.replace(/\{value\}/g, `(${item.statMin} à ${item.statMax})`)}
        </MarkdownText>
      )}

      <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10 mt-auto">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Statistique</div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-mono text-cyan-400">{item.statMin}</span>
            <span className="text-gray-600">→</span>
            <span className="text-xs font-mono text-cyan-400">{item.statMax}</span>
            {item.pas && <span className="text-xs text-gray-600">(pas : {item.pas})</span>}
          </div>
        </div>
        {item.pas && item.statMin != null && item.statMax != null && (
          <div className="mt-2">
            <div className="grid grid-cols-5 gap-px">
              {Array.from({ length: Math.round((item.statMax - item.statMin) / item.pas) + 1 }, (_, i) => {
                const val = +(item.statMin + i * item.pas).toFixed(4)
                return (
                  <div key={val} className="flex flex-col items-center py-1 bg-cyan-500/5 rounded">
                    <span className="text-xs text-gray-600 font-bold leading-none">Niv.{i + 1}</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold leading-tight mt-0.5">{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
