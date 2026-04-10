import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {RefreshCw, Coins, Box, Cpu, Shirt, Star, Info, Settings, Target, Play, Square, Check, ChevronDown, RotateCcw, CreditCard} from 'lucide-react';
import { GameIcon, resolveAsset, resolveAttribut, GEAR_SLOT_ICONS_IMG } from '../components/common/GameAssets.jsx';
import MarkdownText from '../components/common/MarkdownText.jsx';

const REROLL_COST = {
  credits: 979,
  polycarbonate: 36,
  electronique: 26,
  tissu: 60,
  exotique: 1
};

const getRandomStats = (essentialPool, secondaryPool) => {
  if (!essentialPool.length || !secondaryPool.length) return null;

  const essential = essentialPool[Math.floor(Math.random() * essentialPool.length)];
  const isEssentialFixed = essential.unite?.includes('pts') || essential.id === 'tiers_de_competence';
  
  const shuffled = [...secondaryPool].sort(() => 0.5 - Math.random());
  const selectedAttrs = shuffled.slice(0, 3).map(attr => {
    const isFixedValue = attr.unite?.includes('pts') || attr.id === 'tiers_de_competence';
    return {
      ...attr,
      value: (Math.random() * (attr.max * 0.5) + (attr.max * 0.5)).toFixed(isFixedValue ? 0 : 1)
    };
  });

  return {
    essential: {
      ...essential,
      value: (Math.random() * (essential.max * 0.5) + (essential.max * 0.5)).toFixed(isEssentialFixed ? 0 : 1)
    },
    attributes: selectedAttrs
  };
};

const InvestisseurReroll = ({ allAttributs, allEquipements, allTalents, onClose }) => {
  const maskData = allEquipements?.investisseur || { nom: 'Investisseur', description: 'Masque Exotique' };
  const talentKey = maskData.talents?.[0] || 'triple_emplacement';
  const talentData = allTalents?.[talentKey] || { nom: 'Triple emplacement', description: 'Description non disponible' };

  const { essentialPool, secondaryPool } = React.useMemo(() => {
    if (!allAttributs) return { essentialPool: [], secondaryPool: [] };

    const EXCLUSIONS = [
      'degats_de_headshot_eqp',
      'sante_eqp',
      'competences_de_reparation_eqp'
    ];

    const all = Object.entries(allAttributs).map(([slug, data]) => ({
      id: slug,
      ...data
    }));

    const gearAttrs = all.filter(a => 
      a.cible?.includes('equipement') && 
      a.selectionable === true &&
      !EXCLUSIONS.includes(a.id)
    );

    const order = { offensif: 0, defensif: 1, utilitaire: 2 };

    return {
      essentialPool: gearAttrs.filter(a => a.estEssentiel).sort((a, b) => order[a.categorie] - order[b.categorie]),
      secondaryPool: gearAttrs.filter(a => !a.estEssentiel).sort((a, b) => order[a.categorie] - order[b.categorie])
    };
  }, [allAttributs]);

  const [maskStats, setMaskStats] = useState(() => getRandomStats(essentialPool, secondaryPool));
  const [isRerolling, setIsRerolling] = useState(false);
  const [cumulativeExotic, setCumulativeExotic] = useState(0);
  const [totalRerolls, setTotalRerolls] = useState(0);
  const rerollTimerRef = React.useRef(null);

  // Auto-Reroll State
  const [targets, setTargets] = useState({ essential: null, secondaries: [] });
  const [isAutoRerolling, setIsAutoRerolling] = useState(false);
  const [isTargetPanelCollapsed, setIsTargetPanelCollapsed] = useState(true);

  const checkMatch = useCallback((currentStats, targetConfig) => {
    if (!targetConfig.essential && targetConfig.secondaries.length === 0) return false;
    if (!currentStats) return false;

    const essMatch = !targetConfig.essential || currentStats.essential.id === targetConfig.essential;
    const currentSecIds = currentStats.attributes.map(a => a.id);
    const secMatch = targetConfig.secondaries.every(id => currentSecIds.includes(id));

    return essMatch && secMatch;
  }, []);

  // Re-initialiser si les pools changent (chargement asynchrone)
  useEffect(() => {
    if (!maskStats && essentialPool.length && secondaryPool.length) {
      setMaskStats(getRandomStats(essentialPool, secondaryPool));
    }
  }, [essentialPool, secondaryPool, maskStats]);

  const generateNewStats = useCallback((isAuto = false) => {
    if (!essentialPool.length || !secondaryPool.length) return;
    setIsRerolling(true);
    
    // On simule un délai de reroll (plus court si auto)
    if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
    rerollTimerRef.current = setTimeout(() => {
      setMaskStats(getRandomStats(essentialPool, secondaryPool));
      setIsRerolling(false);
      setCumulativeExotic(prev => prev + REROLL_COST.exotique);
      setTotalRerolls(prev => prev + 1);
      rerollTimerRef.current = null;
    }, isAuto ? 300 : 600);
  }, [essentialPool, secondaryPool]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
    };
  }, []);

  // Auto-Reroll Loop
  useEffect(() => {
    let timer;
    if (isAutoRerolling && !isRerolling) {
      if (checkMatch(maskStats, targets)) {
        setIsAutoRerolling(false);
      } else {
        timer = setTimeout(() => {
          generateNewStats(true);
        }, 150);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoRerolling, isRerolling, maskStats, targets, checkMatch, generateNewStats]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Reroll avec R ou X
    if ((e.key === 'r' || e.key === 'R' || e.key === 'x' || e.key === 'X') && !isRerolling) {
      generateNewStats();
    }
  }, [onClose, isRerolling, generateNewStats]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'offensif': return 'text-red-500';
      case 'defensif': return 'text-blue-500';
      case 'utilitaire': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getCategoryBarColor = (cat) => {
    switch (cat) {
      case 'offensif': return 'bg-red-500';
      case 'defensif': return 'bg-blue-500';
      case 'utilitaire': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryShadowColor = (cat) => {
    switch (cat) {
      case 'offensif': return 'shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'defensif': return 'shadow-[0_0_15px_rgba(59,130,246,0.4)]';
      case 'utilitaire': return 'shadow-[0_0_15px_rgba(234,179,8,0.4)]';
      default: return 'shadow-[0_0_15px_rgba(156,163,175,0.4)]';
    }
  };

  if (!maskStats) {
    return (
      <div className="flex items-center justify-center h-full p-20 text-zinc-500 animate-pulse font-black uppercase tracking-widest">
        Initialisation du protocole SHD...
      </div>
    );
  }

  const toggleSecondaryTarget = (id) => {
    setTargets(prev => {
      const exists = prev.secondaries.includes(id);
      if (exists) {
        return { ...prev, secondaries: prev.secondaries.filter(s => s !== id) };
      }
      if (prev.secondaries.length >= 3) return prev;
      return { ...prev, secondaries: [...prev.secondaries, id] };
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      {/* Target Selection Panel */}
      <div className="mb-8 bg-tactical-panel border border-tactical-border rounded-xl p-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-shd opacity-50" />
        
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsTargetPanelCollapsed(!isTargetPanelCollapsed)}
          >
            <div className="p-2 bg-shd/10 rounded-lg group-hover:bg-shd/20 transition-colors">
              <Target className="w-6 h-6 text-shd" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Objectifs de reroll</h3>
                {targets.secondaries.length > 0 && (
                  <span className="bg-shd/20 text-shd px-2 py-0.5 rounded text-xs font-black tabular-nums">{targets.secondaries.length}/3</span>
                )}
                <ChevronDown className={`w-5 h-5 text-zinc-600 transition-transform duration-300 ${isTargetPanelCollapsed ? '' : 'rotate-180'}`} />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1.5">Configurez les attributs cibles pour l'auto-reroll</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAutoRerolling ? (
              <button 
                onClick={() => setIsAutoRerolling(false)}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10"
              >
                <Square className="w-4 h-4 fill-red-400" /> Arrêter
              </button>
            ) : (
              <button 
                onClick={() => setIsAutoRerolling(true)}
                disabled={!targets.essential && targets.secondaries.length === 0}
                className="flex items-center gap-2 bg-shd/20 hover:bg-shd/30 text-shd border border-shd/50 disabled:opacity-20 disabled:grayscale px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-shd/10"
              >
                <Play className="w-4 h-4 fill-shd" /> Lancer l'auto-reroll
              </button>
            )}
            
            <button 
              onClick={() => {
                 setTargets({ essential: null, secondaries: [] });
                 setIsAutoRerolling(false);
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isTargetPanelCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 32 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-tactical-border/50 pt-8">
                <div className="grid grid-cols-[280px_1fr] gap-y-6">
                  {/* En-têtes de colonnes */}
                  <div className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 px-1 pr-8">
                    Essentiels
                  </div>
                  <div className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 px-1 pl-8 border-l border-tactical-border/20">
                    Secondaires
                  </div>

                  {['offensif', 'defensif', 'utilitaire'].map(cat => (
                    <React.Fragment key={cat}>
                      {/* Colonne Essentiels */}
                      <div className="space-y-2 border-t border-tactical-border/20 pt-4 pr-8">
                        <div className="flex flex-wrap gap-2">
                          {essentialPool.filter(a => a.categorie === cat).map(a => (
                            <button 
                              key={a.id}
                              onClick={() => setTargets(p => ({...p, essential: p.essential === a.id ? null : a.id}))}
                              className={`flex items-center gap-3 p-2 px-0 rounded text-left text-xs font-bold uppercase transition-all ${targets.essential === a.id ? 'text-shd' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <div className="w-5 h-5 flex items-center justify-center transition-colors">
                                <GameIcon src={resolveAsset(resolveAttribut(a))} size="w-5 h-5" color={getCategoryColor(a.categorie)} />
                              </div>
                              <span className="truncate">{a.nom}</span>
                              {targets.essential === a.id && <Check className="w-3 h-3 ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colonne Secondaires */}
                      <div className="space-y-2 border-t border-tactical-border/20 pt-4 pl-8 border-l border-tactical-border/20">
                        <div className="flex flex-wrap gap-2">
                          {secondaryPool.filter(a => a.categorie === cat).map(a => {
                            const isSelected = targets.secondaries.includes(a.id);
                            const isFull = targets.secondaries.length >= 3 && !isSelected;
                            return (
                              <button 
                                key={a.id}
                                disabled={isFull}
                                onClick={() => toggleSecondaryTarget(a.id)}
                                className={`flex items-center gap-3 p-2 px-0 rounded text-left text-xs font-bold uppercase transition-all ${isSelected ? 'text-zinc-100' : isFull ? 'opacity-20 cursor-not-allowed' : 'text-zinc-500 hover:text-zinc-300'}`}
                              >
                                <div className="w-5 h-5 flex items-center justify-center transition-colors">
                                  <GameIcon src={resolveAsset(resolveAttribut(a))} size="w-5 h-5" color={getCategoryColor(a.categorie)} />
                                </div>
                                <span className="truncate">{a.nom}</span>
                                {isSelected && <Check className="w-3 h-3 ml-1 text-shd" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Mask Stats */}
        <div className="flex-1 space-y-6">
          <div className="bg-tactical-panel border-l-4 border-l-red-500 rounded-r-xl overflow-hidden shadow-2xl border border-tactical-border/50">
            <div className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 flex items-center justify-center">
                   <GameIcon src={GEAR_SLOT_ICONS_IMG.masque} alt="Masque" size="w-16 h-16" color="text-white" className="opacity-80" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-red-400 uppercase tracking-tighter">{maskData.nom}</h2>
                  <p className="text-zinc-500 italic font-medium">Masque Exotique — Re-étalonnage</p>
                </div>
              </div>

              <div className="space-y-6">
                {maskStats && (
                  <>
                    <div className="bg-black/20 p-5 rounded border border-tactical-border/50">
                      <h3 className="text-xs font-black text-zinc-600 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">
                        <Info className="w-3 h-3" /> Attribut Essentiel
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-4 ${getCategoryColor(maskStats.essential.categorie)}`}>
                          <div className="p-2">
                            <GameIcon src={resolveAsset(resolveAttribut(maskStats.essential))} size="w-6 h-6" color={getCategoryColor(maskStats.essential.categorie)} />
                          </div>
                          <span className="font-bold text-xl tracking-tight">{maskStats.essential.nom}</span>
                        </div>
                        <span className="text-2xl font-black text-white tabular-nums">
                          +{maskStats.essential.value}{maskStats.essential.unite}
                        </span>
                      </div>
                      <div className="mt-4 w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(maskStats.essential.value / maskStats.essential.max) * 100}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`${getCategoryBarColor(maskStats.essential.categorie)} h-full ${getCategoryShadowColor(maskStats.essential.categorie)}`} 
                        />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <h3 className="text-xs font-black text-zinc-600 uppercase flex items-center gap-2 tracking-[0.2em] ml-1">
                        <Settings className="w-3 h-3" /> Attributs secondaires
                      </h3>
                      {maskStats.attributes.map((attr, index) => (
                        <div key={index} className="bg-black/20 p-5 rounded border border-tactical-border/50">
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-4 ${getCategoryColor(attr.categorie)}`}>
                              <div className="p-1.5">
                                <GameIcon src={resolveAsset(resolveAttribut(attr))} size="w-5 h-5" color={getCategoryColor(attr.categorie)} />
                              </div>
                              <span className="font-bold text-zinc-300 tracking-tight">{attr.nom}</span>
                            </div>
                            <span className="font-black text-white text-lg tabular-nums">
                              +{attr.value}{attr.unite}
                            </span>
                          </div>
                          <div className="mt-4 w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(attr.value / attr.max) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`${getCategoryBarColor(attr.categorie)} h-full ${getCategoryShadowColor(attr.categorie)}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-12 flex flex-col items-center gap-6">
                <button
                  onClick={generateNewStats}
                  disabled={isRerolling}
                  className="group relative flex items-center gap-4 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white px-12 py-5 rounded font-black text-xl transition-all shadow-xl hover:shadow-red-500/20 active:scale-95 overflow-hidden uppercase tracking-widest"
                >
                  <RefreshCw className={`w-7 h-7 ${isRerolling ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                  {isRerolling ? 'RÉÉTALONNAGE...' : 'REROLL LE MASQUE'}
                  
                  {isRerolling && (
                    <motion.div 
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                  )}
                </button>
                <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors text-xs uppercase tracking-[0.2em] font-bold border-b border-transparent hover:border-white/20">
                  Fermer le simulateur [ESC]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Talent & Expenses */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Talent Card */}
          <div className="bg-tactical-panel border border-tactical-border rounded-xl p-5 shadow-2xl relative overflow-hidden">
             <div className="flex items-center gap-4 mb-4 border-b border-tactical-border pb-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <GameIcon src={resolveAsset(talentKey)} color="text-red-500" size="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-red-400 font-black uppercase tracking-tighter text-lg leading-tight">
                    {talentData.nom}
                  </h3>
                </div>
             </div>
             <MarkdownText className="text-[12px] text-zinc-400 leading-relaxed">
                {talentData.description}
             </MarkdownText>
          </div>

          <div className="bg-tactical-panel border border-tactical-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Coins className="w-24 h-24" />
            </div>

            <div className="flex items-center justify-between border-b border-tactical-border pb-4 mb-6 relative z-20">
              <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 text-2xl">
                 DÉPENSE TOTALE
              </h3>
              <button 
                onClick={() => {
                  if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
                  rerollTimerRef.current = null;
                  setIsAutoRerolling(false);
                  setIsRerolling(false);
                  setCumulativeExotic(0);
                  setTotalRerolls(0);
                  setMaskStats(getRandomStats(essentialPool, secondaryPool));
                  setTargets({ essential: null, secondaries: [] });
                }}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all group z-30"
                title="Réinitialiser les compteurs, les objectifs et le masque"
              >
                <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="space-y-5 relative z-10">

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-tactical-border">
                <div className="group">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Rerolls</p>
                  <p className="text-xl font-black text-white group-hover:text-shd transition-colors">{totalRerolls}</p>
                </div>
              </div>

               <div className="flex items-center justify-between group">
                 <div>
                   <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-1">Composants exotiques</p>
                   <p className="text-4xl font-black tabular-nums text-white group-hover:text-red-400 transition-colors leading-none">{cumulativeExotic}</p>
                 </div>
                 <Star className="w-8 h-8 text-red-500/20 group-hover:text-red-500/40 transition-colors" />
               </div>


               <div className="space-y-3 pt-4 border-t border-tactical-border">
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-zinc-400">
                     <CreditCard className="w-4 h-4" />
                     <span className="uppercase font-bold text-xs tracking-wider">E-Crédits</span>
                   </div>
                   <span className="font-mono font-black text-white">{(totalRerolls * REROLL_COST.credits).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-zinc-400">
                     <Box className="w-4 h-4" />
                     <span className="uppercase font-bold text-xs tracking-wider">Polycarbonate</span>
                   </div>
                   <span className="font-mono font-black text-white">{(totalRerolls * REROLL_COST.polycarbonate).toLocaleString()}</span>
                 </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Cpu className="w-4 h-4" />
                      <span className="uppercase font-bold text-xs tracking-wider">Électronique</span>
                    </div>
                    <span className="font-mono font-black text-white">{(totalRerolls * REROLL_COST.electronique).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Shirt className="w-4 h-4" />
                      <span className="uppercase font-bold text-xs tracking-wider">Tissu protecteur</span>
                    </div>
                    <span className="font-mono font-black text-white">{(totalRerolls * REROLL_COST.tissu).toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestisseurReroll;
