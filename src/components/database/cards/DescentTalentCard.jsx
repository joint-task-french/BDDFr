import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { slugify } from '../../../utils/slugify.js';
import MarkdownText from '../../common/MarkdownText'

export default function DescentTalentCard({ item, isStatic }) {
    const { nom, icon, descente, isWeaponTalent } = item;
    const { boucles, categorie, levels, notes } = descente;
    const { category, slug, modifier } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const itemSlug = item.slug || slugify(nom);
    const isThisCardActive = slug === itemSlug;

    const availableLevels = Object.keys(levels)
        .filter(key => key !== 'base')
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const [selectedLevel, setSelectedLevel] = useState(() => {
        if (isThisCardActive && modifier && availableLevels.includes(modifier)) {
            return modifier;
        }
        return availableLevels[0] || "1";
    });

    useEffect(() => {
        if (isStatic) {
            setSelectedLevel(availableLevels[0] || "1");
        } else if (isThisCardActive && modifier && availableLevels.includes(modifier)) {
            setSelectedLevel(modifier);
        }
    }, [isThisCardActive, modifier, availableLevels, isStatic]);

    const handleLevelChange = (e) => {
        const newLevel = e.target.value;
        setSelectedLevel(newLevel);

        if (isStatic) return;

        const currentCategory = category || 'descente';
        navigate(`/db/${currentCategory}/${itemSlug}/${newLevel}${location.search}`, { replace: true });
    };

    const parsedDescriptionMd = useMemo(() => {
        const baseText = levels.base;
        const currentLevelData = levels[selectedLevel];

        if (!baseText || !currentLevelData) return baseText || "Description indisponible.";

        return baseText.replace(/\{([^}]+)\}/g, (match, variableName) => {
            return currentLevelData[variableName] !== undefined
                ? `**${currentLevelData[variableName]}**`
                : match;
        });
    }, [levels, selectedLevel]);

    const categoryStyle = {
        "offensif": "bg-red-500/10 text-red-400 border-red-500/20",
        "defensif": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "utilitaire": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        "exotique": "bg-red-500/10 text-red-400 border-red-500/20"
    }[categorie] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

    return (
        <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex flex-col h-full hover:border-gray-500 transition-colors">

            {/* --- EN-TÊTE --- */}
            <div className="px-4 py-3 border-b border-tactical-border/50">
                <div className="flex items-start justify-between gap-2">

                    <div className="flex items-center gap-3">
                        {icon && (
                            <img
                                src={`/img/game_assets/talents/${isWeaponTalent ? 'arme' : 'equipements'}/${icon}.png`}
                                alt={nom}
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <div>
                            <div className="font-bold text-sm uppercase tracking-wide text-gray-100">
                                {nom}
                            </div>
                            <div className={`inline-block px-1.5 py-0.5 mt-1 text-xs font-bold uppercase tracking-widest rounded border ${categoryStyle}`}>
                                {categorie}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor={`level-select-${nom}`} className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Niv.
                        </label>
                        <select
                            id={`level-select-${nom}`}
                            value={selectedLevel}
                            onChange={handleLevelChange}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-tactical-bg text-gray-300 border border-tactical-border hover:border-gray-500 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded transition-all outline-none cursor-pointer focus:border-shd min-w-[3.5rem] text-center"
                        >
                            {availableLevels.map(lvl => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>
            <MarkdownText
                className="px-4 py-3 text-xs text-gray-400 leading-relaxed flex-1"
            >
                {parsedDescriptionMd}
            </MarkdownText>

            <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10 mt-auto">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                    Boucles compatibles
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {boucles.map(boucle => (
                        <span
                            key={boucle}
                            className="bg-tactical-bg border border-tactical-border text-gray-400 text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
                        >
              {boucle}
            </span>
                    ))}
                </div>
            </div>

            {notes && (
                <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                        Notes
                    </div>
                    <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
                        {notes}
                    </MarkdownText>
                </div>
            )}

        </div>
    );
}