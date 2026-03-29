import { getSpecialisations } from '../../../utils/formatters'
import {GameIcon, resolveIcon} from "../../../utils/gameAssets.jsx";
import MarkdownText from '../../common/MarkdownText'

function hasContent(v) {
    return v && v !== '' && v !== 'n/a' && v !== '-' && v !== 'N/A'
}

const formatText = (text) => {
    return text.split('\n').map((line, i) => (
        <span key={i}>
      {line}
            <br />
    </span>
    ));
};

export default function SkillCard({ item }) {
    const SPECIALISATIONS = getSpecialisations()
    const specLabel = item.prerequis ? (SPECIALISATIONS?.[item.prerequis]?.label || item.prerequis) : null
    const slug = item.slug || (item.variante ? item.variante.toLowerCase().replace(/\s+/g, '_') : 'skill')

    return (
        <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex flex-col h-full">
            <div className='flex flex-row gap-2 text-start items-center px-4 py-3 border-b border-tactical-border/50'>
                {resolveIcon(item.icon) && (
                    <GameIcon src={resolveIcon(item.icon)} alt="" size="w-10 h-10" className="rounded" />
                )}

                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-400 text-sm uppercase tracking-wide">{item.variante}</span>
                        {specLabel && (
                            <span className="text-xs font-bold bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-blue-500/30">
                                {specLabel}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        <span className="text-yellow-500/70 font-bold">{item.competence}</span>
                    </div>
                </div>
            </div>



            <div className="px-4 py-2.5 space-y-1.5">
                {hasContent(item.statistiques) && (
                    <MarkdownText className="text-xs text-gray-400 leading-relaxed">
                        {item.statistiques}
                    </MarkdownText>
                )}
                {hasContent(item.effetEtat) && (
                    <div className="text-xs">
                        <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">Effet d'état : </span>
                        <span className="text-gray-400">{item.effetEtat}</span>
                    </div>
                )}

                {hasContent(item.expertise) && (
                    <div className="text-xs">
                        <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Expertise : </span>
                        <span className="text-gray-400">{item.expertise}</span>
                    </div>
                )}
            </div>

            {/* Tiers */}
            <div className="flex-1" />
            {(hasContent(item.tier1) || hasContent(item.tier6)) && (
                <div className="px-4 py-3 border-t border-tactical-border/50">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        {[1, 2, 3, 4, 5, 6].map((n) => {
                            const val = item[`tier${n}`];
                            if (!hasContent(val)) return null;
                            return (
                                <div key={n} className="text-xs leading-tight">
                                    <div className="text-shd font-bold uppercase tracking-tighter mb-1">
                                        Tier {n}
                                    </div>
                                    <MarkdownText className="text-gray-400 text-xs">
                                        {val}
                                    </MarkdownText>
                                </div>
                            );
                        })}
                    </div>
                    {hasContent(item.surcharge) && (
                        <div className="mt-3 pt-2 border-t border-tactical-border/30 text-xs">
        <span className="text-rogue font-bold uppercase tracking-widest block mb-0.5">
          Surcharge :
        </span>
                            <MarkdownText className="text-gray-400">
                                {item.surcharge}
                            </MarkdownText>
                        </div>
                    )}
                </div>
            )}

            {/* Notes */}
            {(hasContent(item.notes) || hasContent(item.notesType)) && (
                <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Notes</div>
                    <div className="flex flex-col gap-2">
                        {hasContent(item.notes) && (
                            <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
                                {item.notes}
                            </MarkdownText>
                        )}
                        {hasContent(item.notesType) && (
                            <div className="text-xs text-gray-500 italic leading-relaxed border-t border-tactical-border/30 pt-1">
                                <span className="not-italic font-bold text-xs text-yellow-500/50 mr-1 uppercase">{item.competence}:</span>
                                <MarkdownText className="inline-block">{item.notesType}</MarkdownText>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

