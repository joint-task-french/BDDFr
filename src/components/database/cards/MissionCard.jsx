import { useState, useEffect } from 'react'
import MarkdownText from '../../common/MarkdownText'

function formatTime(seconds) {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

export default function MissionCard({ item }) {
    // On filtre les clés internes comme 'slug'
    const variantKeys = Object.keys(item).filter(k => k !== 'slug');

    // Gestion de la variante
    const initialVariant = variantKeys.includes('default') ? 'default' : variantKeys[0];
    const [activeVariantKey, setActiveVariantKey] = useState(initialVariant);
    const activeVariantData = item[activeVariantKey] || {};

    // Gestion sécurisée de la difficulté
    const difficultyKeys = activeVariantData.difficulte ? Object.keys(activeVariantData.difficulte) : [];
    const [selectedDiffKey, setSelectedDiffKey] = useState(''); // Ce que l'utilisateur a cliqué en dernier

    // Clé calculée dynamiquement : si le choix de l'utilisateur n'existe pas dans la variante actuelle, on force la première difficulté disponible.
    const activeDiffKey = difficultyKeys.includes(selectedDiffKey) ? selectedDiffKey : (difficultyKeys[0] || '');

    // Ajuster la sélection quand la variante change (si la difficulté précédente n'est plus dispo)
    useEffect(() => {
        if (!difficultyKeys.includes(selectedDiffKey) && difficultyKeys.length > 0) {
            setSelectedDiffKey(difficultyKeys[0]);
        }
    }, [activeVariantKey, difficultyKeys, selectedDiffKey]);

    // Récupération des données en toute sécurité
    const activeDiffData = activeDiffKey && activeVariantData.difficulte ? activeVariantData.difficulte[activeDiffKey] : {};

    const getFactionColor = (faction) => {
        const f = (faction || '').toLowerCase();
        if (f.includes('hyène')) return 'text-green-400 bg-green-500/15 border-green-500/30';
        if (f.includes('parias')) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
        if (f.includes('vrais fils')) return 'text-red-400 bg-red-500/15 border-red-500/30';
        if (f.includes('white tusk')) return 'text-gray-100 bg-gray-200/20 border-white/50';
        if (f.includes('black tusk')) return 'text-gray-300 bg-gray-600/30 border-gray-500/50';
        if (f.includes('nettoyeurs')) return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
        if (f.includes('rikers')) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
        return 'text-shd bg-shd/15 border-shd/30';
    };

    const factionColor = getFactionColor(activeVariantData.faction);

    // Fusion des récompenses au niveau de la variante globale et au niveau de la difficulté spécifique
    const allRewards = [
        ...(activeVariantData.recompenses || []),
        ...(activeDiffData.recompenses || [])
    ];

    return (
        <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex flex-col h-full hover:border-tactical-border/80 transition-colors">

            {/* Header : Nom de la mission + Badge Faction */}
            <div className="px-4 py-3 border-b border-tactical-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-base text-white uppercase tracking-wide">
                        {activeVariantData.nom || 'Mission inconnue'}
                    </h4>
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        {activeVariantData.faction && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${factionColor}`}>
                                {activeVariantData.faction}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sélecteur de Variantes */}
                {variantKeys.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {variantKeys.map(vk => (
                            <button
                                key={vk}
                                onClick={(e) => { e.stopPropagation(); setActiveVariantKey(vk); }}
                                className={`text-[10px] font-bold px-2 py-1 rounded uppercase transition-colors ${activeVariantKey === vk ? 'bg-shd/20 text-shd border border-shd/40' : 'bg-black/30 text-gray-500 border border-gray-700 hover:text-gray-300'}`}
                            >
                                {vk === 'default' ? 'Standard' : vk}
                            </button>
                        ))}
                    </div>
                )}

                {/* Sélecteur de Difficultés */}
                {difficultyKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 border-t border-tactical-border/30 pt-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest my-auto mr-1">Niveau :</span>
                        {difficultyKeys.map(dk => (
                            <button
                                key={dk}
                                onClick={(e) => { e.stopPropagation(); setSelectedDiffKey(dk); }}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors ${activeDiffKey === dk ? 'bg-white/10 text-white border border-white/20' : 'bg-black/30 text-gray-500 border border-gray-700 hover:text-gray-300'}`}
                            >
                                {dk}
                            </button>
                        ))}
                    </div>
                )}

                {activeVariantData.description && (
                    <MarkdownText className="text-xs text-gray-400 italic leading-relaxed mt-2">
                        {activeVariantData.description}
                    </MarkdownText>
                )}
            </div>

            {/* Grid de Stats dynamiques (Salles, Ennemis, Temps) */}
            <div className="grid grid-cols-3 gap-px bg-tactical-border/30">
                <Stat
                    label="Salles"
                    value={activeDiffData.salles || '—'}
                />
                <Stat
                    label="Ennemis Moy."
                    value={activeDiffData.ennemisMoyen ? `~${activeDiffData.ennemisMoyen}` : '—'}
                />
                <Stat
                    label="Temps CLM"
                    value={activeDiffData.tempsContreLaMontre ? formatTime(activeDiffData.tempsContreLaMontre) : '—'}
                    accent
                />
            </div>

            {/* Récompenses affichées une par ligne */}
            {allRewards.length > 0 && (
                <div className="px-4 py-3 border-t border-tactical-border/50 bg-tactical-bg/30">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                        Récompenses {activeDiffKey ? `(${activeDiffKey})` : ''}
                    </div>
                    {/* flex-col pour forcer l'affichage 1 par ligne */}
                    <div className="flex flex-col gap-1.5">
                        {allRewards.map((rec, i) => (
                            <div
                                key={i}
                                className={`w-full px-3 py-2 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                                    rec.unique
                                        ? 'bg-blue-900/20 border-blue-800/50 text-blue-300'
                                        : 'bg-black/40 border-gray-700 text-gray-300'
                                }`}
                            >
                                <MarkdownText className="text-xs leading-tight [&>p]:m-0">
                                    {rec.nom}
                                </MarkdownText>

                                {/* Affichage du taux de drop et de la note optionnels */}
                                {(rec.taux || rec.note) && (
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] shrink-0">
                                        {rec.note && (
                                            <span className="text-gray-400 italic">
                                                {rec.note}
                                            </span>
                                        )}
                                        {rec.taux && (
                                            <span className="bg-black/60 border border-tactical-border/50 px-1.5 py-0.5 rounded text-orange-400 font-bold tracking-wider">
                                                {rec.taux}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Informations additionnelles */}
            {activeVariantData.notes && (
                <div className="px-4 py-3 border-t border-tactical-border/50 bg-black/10 flex-1">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Notes & Stratégies</div>
                    <MarkdownText className="text-xs text-gray-400 leading-relaxed">
                        {activeVariantData.notes}
                    </MarkdownText>
                </div>
            )}
        </div>
    )
}

function Stat({ label, value, accent }) {
    if (!value || value === '—') return <div className="bg-tactical-bg/50 p-3" />
    return (
        <div className="bg-tactical-bg/50 p-3 text-center flex flex-col justify-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">
                {label}
            </div>
            <div className={`text-lg font-bold ${accent ? 'text-shd' : 'text-gray-200'}`}>
                {value}
            </div>
        </div>
    )
}