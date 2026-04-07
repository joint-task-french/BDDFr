import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataLoader } from '../hooks/useDataLoader'
import { decodeBuild, resolveBuild } from '../utils/buildShare'
import Loader from '../components/common/Loader'
import { GameIcon, resolveAsset, GEAR_SLOT_ICONS_IMG, WEAPON_TYPE_ICONS } from '../components/common/GameAssets'

function ItemMini({ item, ensemble, slot }) {
  const isWeapon = slot === 'w1' || slot === 'w2' || slot === 'sa'
  const isSkill = slot === 's1' || slot === 's2'
  
  // Résolution d'icône
  let icon = null
  if (isWeapon) {
    // Priorité absolue au type d'arme pour les icônes (comme dans la DB)
    icon = WEAPON_TYPE_ICONS[item?.type] || resolveAsset(item?.slug)
  } else if (isSkill) {
    icon = resolveAsset(item?.icon)
  } else {
    // Équipement : Priorité à l'icône de la marque/set (comme dans la DB)
    icon = resolveAsset(ensemble?.icon) || resolveAsset(item?.marque) || resolveAsset(item?.slug) || GEAR_SLOT_ICONS_IMG[slot]
  }

  const name = isSkill ? item?.variante : item?.nom
  const isExotic = item?.qualite === 'exotique' || item?.type === 'exotique' || item?.estExotique
  const isNamed = item?.estNomme
  const isGearSet = item?.type === 'gear_set' || ensemble?.type === 'gear_set'
  const isSkillItem = isSkill && item
  
  // Détermination des couleurs unifiées selon la rareté
  let colorClass = 'text-gray-400'
  let borderColor = 'border-white/10'
  let bgColor = 'bg-black/40'

  if (item) {
    if (isExotic) {
      colorClass = 'text-red-500'
      borderColor = 'border-red-500/50'
      bgColor = 'bg-red-500/5'
    } else if (isGearSet) {
      colorClass = 'text-emerald-400'
      borderColor = 'border-emerald-400/30'
      bgColor = 'bg-emerald-400/5'
    } else if (isNamed) {
      colorClass = 'text-shd'
      borderColor = 'border-shd/50'
      bgColor = 'bg-shd/10'
    } else if (isSkillItem) {
      colorClass = 'text-blue-400'
      borderColor = 'border-blue-400/30'
      bgColor = 'bg-blue-400/5'
    } else {
      // Haut de gamme (High-end) par défaut
      colorClass = 'text-amber-400'
      borderColor = 'border-amber-400/20'
      bgColor = 'bg-amber-400/5'
    }
  } else {
    colorClass = 'text-gray-600'
    borderColor = 'border-white/5 opacity-20'
  }

  return (
    <div className="flex items-center gap-2 min-w-0" title={name || slot}>
      <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded border transition-colors ${bgColor} ${borderColor}`}>
        <GameIcon 
          src={icon} 
          size="w-5 h-5" 
          color={colorClass} 
        />
      </div>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className={`text-[10px] font-bold uppercase truncate transition-colors ${colorClass}`}>
          {name || '-'}
        </span>
        {ensemble?.nom && !isWeapon && (
           <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {ensemble.nom}
           </span>
        )}
        {isWeapon && item?.type && (
           <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {item.type.replace('_', ' ')}
           </span>
        )}
        {isSkill && item?.competence && (
           <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {item.competence}
           </span>
        )}
      </div>
    </div>
  )
}

export default function BuildLibraryPage() {
  const { data, loading, error, progress } = useDataLoader()
  const navigate = useNavigate()
  const [localBuilds, setLocalBuilds] = useState([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
      setLocalBuilds(Array.isArray(saved) ? saved : [])
    } catch (e) {
      console.error("Erreur de lecture du localStorage", e)
      setLocalBuilds([])
    }
  }, [])

  const handleDeleteLocal = (index) => {
    if (window.confirm('Supprimer ce build de votre bibliothèque locale ?')) {
      const newBuilds = [...localBuilds]
      newBuilds.splice(index, 1)
      setLocalBuilds(newBuilds)
      localStorage.setItem('div2_builds_v2', JSON.stringify(newBuilds))
    }
  }

  if (loading) return <Loader progress={progress} />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des données : {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-shd text-white rounded">Réessayer</button>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
          Buildo<span className="text-shd">thèque</span>
        </h2>
        <p className="text-sm text-gray-500">Retrouvez vos configurations et les builds de la communauté</p>
      </div>

      <div className="space-y-12">
        {/* Section Local */}
        <section>
          <h3 className="text-sm font-bold text-shd uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-shd rounded-full animate-pulse" />
            Vos Builds Enregistrés
          </h3>
          {localBuilds.length === 0 ? (
            <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
              Aucun build enregistré localement. Utilisez le Build Planner pour en créer un !
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localBuilds.map((b, i) => (
                <BuildCard 
                  key={i} 
                  build={b} 
                  data={data} 
                  onView={() => navigate(`/build?b=${b.encoded}`)}
                  onDelete={() => handleDeleteLocal(i)}
                  isLocal
                />
              ))}
            </div>
          )}
        </section>

        {/* Section Prédéfinis */}
        {data.builds && data.builds.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              Builds Recommandés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.builds.map((b, i) => (
                <BuildCard 
                  key={i} 
                  build={b} 
                  data={data} 
                  onView={() => navigate(`/build?b=${b.encoded}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function BuildCard({ build, data, onView, onDelete, isLocal }) {
  const resolved = useMemo(() => {
    const compact = decodeBuild(build.encoded)
    return resolveBuild(compact, data)
  }, [build.encoded, data])

  if (!resolved) return null

  // Extraction des éléments clés pour la vue rapide
  const spec = resolved.specialWeapon?.specialisation || 'Inconnue'
  const weapons = resolved.weapons.filter(Boolean)
  const gearPieces = Object.values(resolved.gear).filter(Boolean)
  
  // Compter les marques d'équipement pour identifier le set principal
  const resolvedEnsembles = useMemo(() => {
    const res = {}
    Object.entries(resolved.gear).forEach(([slot, item]) => {
      if (item?.marque) {
        // Recherche robuste de l'ensemble (insensible à la casse, slug ou clé directe)
        const brandKey = item.marque.toLowerCase()
        res[slot] = data.ensembles?.[brandKey] || 
                    Object.values(data.ensembles || {}).find(e => 
                      (e.slug && e.slug.toLowerCase() === brandKey) || 
                      (e.nom && e.nom.toLowerCase() === brandKey)
                    )
      }
    })
    return res
  }, [resolved.gear, data.ensembles])

  const brandsInfo = gearPieces.reduce((acc, item) => {
    const ensemble = resolvedEnsembles[item.emplacement]
    const key = ensemble?.slug || item.marque || item.nom
    if (!acc[key]) {
      acc[key] = { count: 0, ensemble, name: ensemble?.nom || item.nom }
    }
    acc[key].count += 1
    return acc
  }, {})
  const mainBrandInfo = Object.values(brandsInfo).sort((a, b) => b.count - a.count)[0]
  const mainBrand = mainBrandInfo?.name
  const mainBrandIcon = resolveAsset(mainBrandInfo?.ensemble?.icon) || resolveAsset(mainBrandInfo?.ensemble?.slug)

  const statsCount = { offensif: 0, defensif: 0, utilitaire: 0 }

  // Utiliser les attributs résolus du build pour le compte des stats
  if (resolved.gearAttributes) {
    Object.values(resolved.gearAttributes).forEach(slotAttrs => {
      if (slotAttrs.essentiels) {
        slotAttrs.essentiels.forEach(a => {
          if (a && a.categorie) {
            const cat = a.categorie.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            if (statsCount.hasOwnProperty(cat)) statsCount[cat] += 1
          }
        })
      }
    })
  }

  return (
    <div className="group bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-shd/50 transition-all flex flex-col h-full shadow-lg">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-bold text-white uppercase tracking-wider group-hover:text-shd transition-colors line-clamp-1">
              {build.nom}
            </h4>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="text-blue-400">{spec}</span>
              <span className="text-gray-700">|</span>
              <div className="flex gap-1">
                <span className="text-red-500">{statsCount.offensif}</span>
                <span className="text-blue-500">{statsCount.defensif}</span>
                <span className="text-yellow-500">{statsCount.utilitaire}</span>
              </div>
            </div>
          </div>
          {isLocal && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-gray-600 hover:text-red-500 p-1 transition-colors"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-6 line-clamp-2 h-10 italic">
          {build.description || "Aucune description fournie."}
        </p>

        {/* Vue Rapide Elements */}
        <div className="bg-black/20 p-3 rounded border border-white/5 space-y-4">
          {/* Ligne principale : Armes (Principal 1, 2 + Pistolet) */}
          <div className="grid grid-cols-3 gap-2">
            <ItemMini item={resolved.weapons[0]} slot="w1" />
            <ItemMini item={resolved.weapons[1]} slot="w2" />
            <ItemMini item={resolved.sidearm} slot="sa" />
          </div>
          {/* Grille d'équipement (2 colonnes, 3 lignes) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 pt-3">
            <ItemMini item={resolved.gear.masque} ensemble={resolvedEnsembles.masque} slot="masque" />
            <ItemMini item={resolved.gear.sac_a_dos} ensemble={resolvedEnsembles.sac_a_dos} slot="sac_a_dos" />
            
            <ItemMini item={resolved.gear.torse} ensemble={resolvedEnsembles.torse} slot="torse" />
            <ItemMini item={resolved.gear.gants} ensemble={resolvedEnsembles.gants} slot="gants" />

            <ItemMini item={resolved.gear.holster} ensemble={resolvedEnsembles.holster} slot="holster" />
            <ItemMini item={resolved.gear.genouilleres} ensemble={resolvedEnsembles.genouilleres} slot="genouilleres" />
          </div>

          {/* Ligne Compétences */}
          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
            <ItemMini item={resolved.skills[0]} slot="s1" />
            <ItemMini item={resolved.skills[1]} slot="s2" />
          </div>


        </div>
      </div>

      <button 
        onClick={onView}
        className="w-full py-3 bg-tactical-bg hover:bg-shd/10 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-shd border-t border-tactical-border transition-all flex items-center justify-center gap-2"
      >
        Consulter le build
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
