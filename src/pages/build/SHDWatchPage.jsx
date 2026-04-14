import React, { useState, useMemo } from 'react';
import { useSHDWatch } from '../../hooks/useSHDWatch';
import { useDataLoader } from '../../hooks/useDataLoader';
import { GameIcon, resolveAsset } from '../../components/common/GameAssets';
import Loader from '../../components/common/Loader';

export default function SHDWatchPage() {
  const { data, loading } = useDataLoader();
  const { shdLevels, updateStat, setAllToMax, resetAll } = useSHDWatch(data.montre);

  // On utilise les catégories depuis les données JSONC si disponibles
  const SHD_CATEGORIES = useMemo(() => {
    if (!data.montre?.categories) return [];
    return Object.values(data.montre.categories).map(cat => ({
      ...cat,
      stats: Object.entries(cat.stats).map(([id, stat]) => ({
        id,
        ...stat
      }))
    }));
  }, [data.montre]);

  const [selectedCat, setSelectedCat] = useState(null);

  // Initialiser la catégorie sélectionnée quand les données sont chargées
  React.useEffect(() => {
    if (SHD_CATEGORIES.length > 0 && !selectedCat) {
      setSelectedCat(SHD_CATEGORIES[0].id);
    }
  }, [SHD_CATEGORIES, selectedCat]);

  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) return <Loader />;
  if (SHD_CATEGORIES.length === 0) return null;

  const currentCategory = SHD_CATEGORIES.find(c => c.id === selectedCat);

  const handleLevelChange = (statId, level) => {
    updateStat(statId, parseInt(level));
    // Forcer un rafraîchissement global via le context
    window.dispatchEvent(new Event('shd-levels-updated'));
  };

  const handleSetAllToMax = () => {
    setAllToMax();
    window.dispatchEvent(new Event('shd-levels-updated'));
  };

  const handleResetAll = () => {
    resetAll();
    window.dispatchEvent(new Event('shd-levels-updated'));
  };

  const totalPoints = Object.values(shdLevels || {}).reduce((acc, val) => acc + val, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
            Ma Montre <span className="text-shd">SHD</span>
          </h2>
          <p className="text-sm text-gray-500">Configurez les bonus de statistiques de votre montre SHD (Niveau 1000+ recommandé)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleResetAll}
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40 transition-all"
          >
            🔄 Réinitialiser
          </button>
          <button 
            onClick={handleSetAllToMax}
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest bg-shd/20 text-shd border border-shd/40 hover:bg-shd/30 transition-all"
          >
            ⚡ Niveau 1000
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Navigation des catégories (Le cercle SHD) */}
        <div className="lg:col-span-6 flex items-center justify-center py-10">
          <div className="relative w-80 h-80 md:w-[480px] md:h-[480px]">
            {/* Centre de la montre */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-tactical-panel border-4 border-shd rounded-full flex flex-col items-center justify-center pointer-events-auto">
                <GameIcon src={resolveAsset('shd')} alt="SHD" size="w-20 h-20 md:w-32 md:h-32" />
              </div>
            </div>

            {/* Boutons de catégories */}
            {SHD_CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              
              // Positionnement en carré (Offensif/Défensif en haut, Maniement/Utilitaire en bas)
              let x = 0;
              let y = 0;
              
              const offsetX = isMobile ? 120 : 165;
              const offsetY = isMobile ? 70 : 100;

              if (cat.id === 'offensif') { x = -offsetX; y = -offsetY; }
              else if (cat.id === 'defensif') { x = offsetX; y = -offsetY; }
              else if (cat.id === 'maniement') { x = offsetX; y = offsetY; }
              else if (cat.id === 'utilitaire') { x = -offsetX; y = offsetY; }

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`absolute w-24 h-24 md:w-40 md:h-40 flex flex-col items-center justify-center group
                    ${isActive ? 'z-30 scale-110' : 'z-20 opacity-60 hover:opacity-100'}`}
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div className="mb-1 md:mb-2">
                    <GameIcon 
                      src={resolveAsset(cat.icon)} 
                      alt={cat.label} 
                      size="w-8 h-8"
                    />
                  </div>
                  <span className={`text-xs md:text-xs font-bold uppercase tracking-widest ${isActive ? 'text-shd' : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
            
            {/* Lignes de connection */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 480 480">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {SHD_CATEGORIES.map(cat => {
                const isActive = selectedCat === cat.id;
                let points = "";
                const cx = 240;
                const cy = 240;
                
                // On définit les points en fonction de la catégorie et du mode (mobile/desktop)
                // Ces points sont basés sur le viewBox 480
                // Desktop: offsetX=165, offsetY=100. Bouton w-32 (128px). Bord=64.
                // Mobile (scalé): offsetX=120, offsetY=70. Bouton w-24 (96px). Bord=48.
                
                if (isMobile) {
                  // En mobile, on ajuste les points pour que le tracé soit correct malgré le scaling
                  // Note: les offsets px sont relatifs à la taille réelle (320px), donc on multiplie par (480/320)=1.5
                  const ox = 120 * 1.5;
                  const oy = 70 * 1.5;
                  const bw = 32 * 1.5; // Bord de l'icône
                  
                  if (cat.id === 'offensif') points = `${cx-ox+bw},${cy-oy} ${cx-ox+bw+10},${cy-oy} ${cx},${cy}`;
                  else if (cat.id === 'defensif') points = `${cx+ox-bw},${cy-oy} ${cx+ox-bw-10},${cy-oy} ${cx},${cy}`;
                  else if (cat.id === 'maniement') points = `${cx+ox-bw},${cy+oy} ${cx+ox-bw-10},${cy+oy} ${cx},${cy}`;
                  else if (cat.id === 'utilitaire') points = `${cx-ox+bw},${cy+oy} ${cx-ox+bw+10},${cy+oy} ${cx},${cy}`;
                } else {
                  const ox = 165;
                  const oy = 100;
                  const bw = 48; // Bord de l'icône (96/2)
                  
                  if (cat.id === 'offensif') points = `${cx-ox+bw},${cy-oy} ${cx-ox+bw+15},${cy-oy} ${cx},${cy}`;
                  else if (cat.id === 'defensif') points = `${cx+ox-bw},${cy-oy} ${cx+ox-bw-15},${cy-oy} ${cx},${cy}`;
                  else if (cat.id === 'maniement') points = `${cx+ox-bw},${cy+oy} ${cx+ox-bw-15},${cy+oy} ${cx},${cy}`;
                  else if (cat.id === 'utilitaire') points = `${cx-ox+bw},${cy+oy} ${cx-ox+bw+15},${cy+oy} ${cx},${cy}`;
                }

                return (
                  <polyline
                    key={`line-${cat.id}`}
                    points={points}
                    fill="none"
                    stroke={isActive ? "#ff6600" : "rgba(255,255,255,0.1)"}
                    strokeWidth="3"
                    filter={isActive ? "url(#glow)" : ""}
                    className=""
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Détails de la catégorie sélectionnée */}
        <div className="lg:col-span-6">
          <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex flex-col h-full">
            {!currentCategory ? (
              <div className="flex-1 flex items-center justify-center p-12 text-gray-500 italic">
                Sélectionnez une catégorie pour voir les détails
              </div>
            ) : (
              <>
                {/* Header de catégorie — Style cohérent avec le Planner */}
                <div className={`px-6 py-4 border-b border-tactical-border flex items-center justify-between ${currentCategory.bgColor}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-1">
                      <GameIcon 
                        src={resolveAsset(currentCategory.icon)} 
                        alt="" 
                        size="w-10 h-10" 
                      />
                    </div>
                    <div>
                      <h3 className={`text-xl font-black uppercase tracking-widest ${currentCategory.color}`}>
                        {currentCategory.label}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Amélioration de l'agent</p>
                    </div>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Points attribués</div>
                    <div className={`text-2xl font-black ${currentCategory.color}`}>
                      {currentCategory.stats.reduce((acc, s) => acc + (shdLevels?.[s.id] || 0), 0)}
                      <span className="text-gray-600 text-sm ml-1">/ 200</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                  {currentCategory.stats.map(stat => {
                    const level = shdLevels?.[stat.id] || 0;
                    const value = (level * stat.step).toFixed(1);
                    const maxLevel = Math.round(stat.max / stat.step);
                    const progress = (level / maxLevel) * 100;

                    return (
                      <div key={stat.id} className="group">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold block mb-1 group-hover:text-shd transition-colors">{stat.label}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white leading-none">{value}</span>
                              <span className="text-sm font-bold text-gray-500 uppercase">{stat.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold block">Niveau</span>
                            <span className="text-xl font-black text-white leading-none">
                              {level}<span className="text-gray-600 text-sm">/{maxLevel}</span>
                            </span>
                          </div>
                        </div>

                        <div className="relative h-4 flex items-center">
                          <div className="absolute w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                              style={{ 
                                width: `${progress}%`, 
                                backgroundColor: isActiveColor(currentCategory.id),
                                boxShadow: `0 0 8px ${isActiveColor(currentCategory.id)}44`
                              }}
                            ></div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxLevel}
                            step="1"
                            value={level}
                            onChange={(e) => handleLevelChange(stat.id, e.target.value)}
                            className={`absolute w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none z-10 
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rotate-45 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:border-none
                              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rotate-45 [&::-moz-range-thumb]:border-none`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Footer informatif */}
                <div className="px-6 py-4 bg-black/40 border-t border-tactical-border flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Progression totale montre</div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-shd" style={{ width: `${(totalPoints / 800) * 100}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-shd">{totalPoints}/800</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 bg-tactical-panel/40 border border-tactical-border rounded-lg p-4 flex gap-4 items-start">
            <div className="p-2 bg-shd/10 rounded border border-shd/20">
              <svg className="w-5 h-5 text-shd" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-tight">
              Les bonus de la montre SHD sont appliqués globalement à votre build. Chaque statistique peut être améliorée jusqu'au niveau 50, pour un total de 800 points répartis sur les 4 catégories de combat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function isActiveColor(catId) {
  switch (catId) {
    case 'offensif': return '#ef4444';
    case 'defensif': return '#3b82f6';
    case 'utilitaire': return '#eab308';
    case 'maniement': return '#10b981';
    default: return '#ff6600';
  }
}
