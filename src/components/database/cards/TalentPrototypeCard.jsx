import { resolveIcon, GameIcon } from '../../common/gameAssets.jsx'
import MarkdownText from '../../common/MarkdownText'

export default function TalentPrototypeCard({ item }) {
  const nameColor = 'text-cyan-400'
  const talentIcon = resolveIcon(item.icon)

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
          {item.description}
        </MarkdownText>
      )}

      <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10 flex justify-between items-center mt-auto">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Statistique</div>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-mono text-cyan-400">{item.statMin}</span>
          <span className="text-gray-600">→</span>
          <span className="text-xs font-mono text-cyan-400">{item.statMax}</span>
        </div>
      </div>
    </div>
  )
}
