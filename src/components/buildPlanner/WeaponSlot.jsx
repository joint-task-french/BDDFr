import { getWeaponTypeLabel, getWeaponEssentialAttributes } from '../../utils/formatters'
import StatChip from '../common/StatChip'
import WeaponAttributePanel from './WeaponAttributePanel'
import ExpertiseSlider from './ExpertiseSlider'

const HEADER_COLORS = {
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    hover: 'group-hover:text-red-500/50' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'group-hover:text-purple-500/50' },
    gray:   { bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   text: 'text-gray-400',   hover: 'group-hover:text-gray-500/50' },
}

export default function WeaponSlot({ label, weapon, talent, attribute, allAttributs, modsArmes, weaponMods, onSelect, onRemove, onSelectTalent, onSetAttribute, onSetMods, headerColor = 'red', badge, armesType, expertiseSlot, expertiseLevel, onExpertiseChange, maxExpertiseLevel, essentialSlotKey, essentialValues, dispatch, data, isPrototype, prototypeTalent, onSelectPrototypeTalent }) {
    const colors = HEADER_COLORS[headerColor] || HEADER_COLORS.red
    const isExotic = weapon?.estExotique
    const isSpecific = weapon?.type === 'arme_specifique'
    const nameColor = isPrototype ? 'text-cyan-400' : 'text-white'
    const borderColor = isPrototype ? 'border-cyan-500/50' : 'border-tactical-border'
    const headerBg = isPrototype ? 'bg-cyan-500/10' : colors.bg
    const headerBorder = isPrototype ? 'border-cyan-500/30' : colors.border
    const headerText = isPrototype ? 'text-cyan-400' : colors.text

    return (
        <div className="build-slot group" onClick={weapon ? undefined : onSelect}>
            <div className={`px-3 py-2 ${headerBg} ${headerBorder} border-b flex justify-between items-center`}>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${headerText} text-xs font-bold uppercase tracking-widest`}>🔫 {label}</span>
                    {badge}
                </div>
                <div className="flex items-center gap-2">
                    {weapon && !isExotic && !isSpecific && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                const newActive = !isPrototype
                                dispatch({ type: 'SET_PROTOTYPE', slot: expertiseSlot, active: newActive })
                                if (!newActive) {
                                    // Clamping des attributs hors prototype
                                    if (attribute && attribute.max != null && attribute.valeur > attribute.max) {
                                        onSetAttribute({ ...attribute, valeur: attribute.max })
                                    }
                                    if (essentialValues && essentialSlotKey) {
                                        const definitions = getWeaponEssentialAttributes(armesType, weapon?.type, allAttributs, weapon?.attributs_essentiels)
                                        definitions.forEach(def => {
                                            const val = essentialValues[def.slug]
                                            if (val != null && def.max != null && val > def.max) {
                                                dispatch({ type: 'SET_WEAPON_ESSENTIAL_VALUE', slotKey: essentialSlotKey, slug: def.slug, valeur: def.max })
                                            }
                                        })
                                    }
                                }
                            }}
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1 py-0.5 rounded border transition-all ${
                                isPrototype
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                    : 'bg-tactical-bg/50 text-gray-500 border-tactical-border hover:border-gray-500'
                            }`}
                        >
                            <span className="w-4 h-2.5 relative rounded-full border border-current inline-block">
                              <span className={`absolute top-0.5 w-1.5 h-1.5 rounded-full bg-current transition-all ${isPrototype ? 'left-2' : 'left-0.5'}`} />
                            </span>
                            Prototype
                        </button>
                    )}
                    {weapon && (
                        <button onClick={(e) => { e.stopPropagation(); onRemove?.() }} className={`${headerText} hover:text-white text-xs p-1`}>✕</button>
                    )}
                </div>
            </div>
            <div className="p-3 min-h-25">
                {weapon ? (
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className={`font-bold ${nameColor} text-sm uppercase tracking-wide`}>
                                    {isExotic && <span className="text-shd mr-1">★</span>}
                                    {weapon.nom}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {weapon.armePoing ? 'Arme de poing' : getWeaponTypeLabel(armesType, weapon.type)}
                                    {weapon.fabricant && ` — ${weapon.fabricant}`}
                                </div>
                            </div>
                        </div>
                        {/* Stats (pas pour les armes spécifiques si pas de données) */}
                        {!isSpecific && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                <StatChip icon="💥" value={(isPrototype && weapon.prototypeDegatsBase !== undefined ? weapon.prototypeDegatsBase : weapon.degatsBase)?.toLocaleString('fr-FR')} color={isPrototype ? "text-cyan-400" : "text-red-400"} />
                                <StatChip icon="⚡" value={(isPrototype && weapon.prototypeRpm !== undefined ? weapon.prototypeRpm : weapon.rpm) ? `${isPrototype && weapon.prototypeRpm !== undefined ? weapon.prototypeRpm : weapon.rpm} CPM` : null} color={isPrototype ? "text-cyan-400" : ""} />
                                <StatChip icon="📦" value={(isPrototype && weapon.prototypeChargeur !== undefined ? weapon.prototypeChargeur : weapon.chargeur) || null} color={isPrototype ? "text-cyan-400" : ""} />
                                <StatChip icon="🎯" value={(isPrototype && weapon.prototypeHeadshot !== undefined ? weapon.prototypeHeadshot : weapon.headshot) ? `${isPrototype && weapon.prototypeHeadshot !== undefined ? weapon.prototypeHeadshot : weapon.headshot}% HS` : null} color={isPrototype ? "text-cyan-400" : "text-yellow-400"} />
                                <StatChip icon="📏" value={(isPrototype && weapon.prototypePortee !== undefined ? weapon.prototypePortee : weapon.portee) ? `${isPrototype && weapon.prototypePortee !== undefined ? weapon.prototypePortee : weapon.portee}m` : null} color={isPrototype ? "text-cyan-400" : ""} />
                                <StatChip icon="⏳" value={(isPrototype && weapon.prototypeRechargement !== undefined ? weapon.prototypeRechargement : weapon.rechargement) ? `${isPrototype && weapon.prototypeRechargement !== undefined ? weapon.prototypeRechargement : weapon.rechargement}s` : null} color={isPrototype ? "text-cyan-400" : ""} />
                            </div>
                        )}
                        {/* Attributs */}
                        <WeaponAttributePanel
                            weapon={weapon}
                            attribute={attribute}
                            allAttributs={allAttributs}
                            modsArmes={modsArmes}
                            weaponMods={weaponMods}
                            onChangeAttribute={onSetAttribute}
                            onChangeMods={onSetMods}
                            armesType={armesType}
                            essentialSlotKey={essentialSlotKey}
                            essentialValues={essentialValues}
                            dispatch={dispatch}
                            isPrototype={isPrototype}
                        />
                        {/* Expertise */}
                        {expertiseSlot && onExpertiseChange && (
                            <ExpertiseSlider
                                slot={expertiseSlot}
                                level={expertiseLevel || 0}
                                onChange={onExpertiseChange}
                                maxLevel={maxExpertiseLevel}
                                disabled={isPrototype}
                            />
                        )}
                        {/* Talents exotiques (depuis talents[]) — non modifiables */}
                        {weapon.talents && weapon.talents.length > 0 && weapon.estExotique ? (
                            <div className="mt-3 pt-3 border-t border-tactical-border">
                                {weapon.talents.filter(t => t && t !== 'n/a').map((slug, i) => {
                                    const resolved = data?.talentsArmes && !Array.isArray(data.talentsArmes)
                                      ? data.talentsArmes[slug]
                                      : data?.talentsArmes?.find(t => t.slug === slug || t.nom === slug)
                                    return (
                                        <div key={i} className={i > 0 ? "mt-3" : ""}>
                                            <div className="text-xs text-shd font-bold uppercase tracking-widest">
                                                {resolved?.nom ? `Talent : ${resolved.nom}` : 'Talent Exotique'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                                                {resolved?.description || slug}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : weapon.estNomme && weapon.talents && weapon.talents.length > 0 && weapon.talents.some(t => t && t !== 'n/a' && t !== '') && !talent ? (
                            /* Arme nommée avec talent pré-inscrit — affiché si aucun talent n'a été manuellement sélectionné */
                            (() => {
                                const slug = weapon.talents.find(t => t && t !== 'n/a' && t !== '')
                                const resolved = data?.talentsArmes && !Array.isArray(data.talentsArmes)
                                  ? data.talentsArmes[slug]
                                  : data?.talentsArmes?.find(t => t.slug === slug || t.nom === slug)
                                const isPerfect = weapon.estNomme && resolved?.perfectDescription
                                return (
                                    <div className="mt-3 pt-3 border-t border-tactical-border">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                                                    Talent : {resolved?.nom || slug}
                                                </div>
                                                {isPerfect && (
                                                    <span className="text-[10px] font-bold text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none">
                            ★ Parfait
                          </span>
                                                )}
                                            </div>
                                            {/* Les talents des armes nommées sont fixes */}
                                            {(false && onSelectTalent) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                                                    className="text-xs text-gray-600 hover:text-shd transition-colors"
                                                    title="Changer le talent"
                                                >✎</button>
                                            )}
                                        </div>
                                        {(isPerfect ? resolved.perfectDescription : resolved?.description) && (
                                            <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                                                {isPerfect ? resolved.perfectDescription : resolved.description}
                                            </div>
                                        )}
                                    </div>
                                )
                            })()
                        ) : talent ? (
                            (() => {
                                const isPerfect = Boolean(weapon.estNomme && weapon.talents?.some(slug => slug === talent.slug || slug === talent.nom) && talent.perfectDescription)
                                return (
                                    <div className="mt-3 pt-3 border-t border-tactical-border">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs text-shd font-bold uppercase tracking-widest">
                                                    Talent : {talent.nom}
                                                </div>
                                                {isPerfect && (
                                                    <span className="text-[10px] font-bold text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none">
                            ★ Parfait
                          </span>
                                                )}
                                            </div>
                                            {/* Les talents des armes nommées sont fixes */}
                                            {(!weapon.estNomme && !isPerfect && onSelectTalent) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                                                    className="text-xs text-gray-600 hover:text-shd transition-colors"
                                                    title="Changer le talent"
                                                >✎</button>
                                            )}
                                        </div>
                                        {isPerfect ? (
                                            <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">{talent.perfectDescription}</div>
                                        ) : talent.description ? (
                                            <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">{talent.description}</div>
                                        ) : null}
                                    </div>
                                )
                            })()
                        ) : (!weapon.estExotique && !weapon.estNomme && !isSpecific && onSelectTalent) ? (
                            <div className="mt-3 pt-3 border-t border-tactical-border">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                                    className="text-xs text-shd/60 hover:text-shd uppercase tracking-widest"
                                >
                                    + Ajouter un talent
                                </button>
                            </div>
                        ) : null}

                        {/* Talent Prototype supplémentaire */}
                        {isPrototype && (
                            <div className="mt-3 pt-3 border-t border-cyan-500/30">
                                {prototypeTalent ? (
                                    <div className="py-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <div className="text-[10px] text-gray-600 uppercase tracking-widest">Talent Prototype</div>
                                            {onSelectPrototypeTalent && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelectPrototypeTalent() }}
                                                    className="text-xs text-gray-600 hover:text-cyan-400 transition-colors"
                                                    title="Changer le talent prototype"
                                                >✎</button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-xs text-cyan-400 font-bold uppercase truncate" title={prototypeTalent.nom}>
                                                {prototypeTalent.nom}
                                            </div>
                                            <span className="text-xs font-bold ml-auto shrink-0 text-cyan-400">
                                                {prototypeTalent.valeur !== undefined ? prototypeTalent.valeur.toFixed(1) : prototypeTalent.statMax}
                                            </span>
                                        </div>
                                        {prototypeTalent.statMin != null && prototypeTalent.statMax != null && prototypeTalent.statMin !== prototypeTalent.statMax && (
                                            <input
                                                type="range"
                                                min={prototypeTalent.statMin}
                                                max={prototypeTalent.statMax}
                                                step={0.1}
                                                value={prototypeTalent.valeur ?? prototypeTalent.statMax}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    dispatch({
                                                        type: 'SET_PROTOTYPE_TALENT',
                                                        slot: expertiseSlot,
                                                        talent: { ...prototypeTalent, valeur: parseFloat(e.target.value) }
                                                    })
                                                }}
                                                className="attr-slider mt-1 accent-cyan-400"
                                            />
                                        )}
                                        {prototypeTalent.description && (
                                            <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2 italic">{prototypeTalent.description}</div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSelectPrototypeTalent() }}
                                        className="text-xs text-cyan-500/60 hover:text-cyan-400 uppercase tracking-widest flex items-center gap-1 py-1"
                                    >
                                        <span className="text-lg leading-none">+</span> Talent Prototype
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 py-4">
                        <svg className={`w-10 h-10 ${colors.hover} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm uppercase tracking-widest mt-2">Sélectionner</span>
                    </div>
                )}
            </div>
        </div>
    )
}