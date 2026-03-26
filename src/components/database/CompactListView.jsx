import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameIcon, WEAPON_TYPE_ICONS, GEAR_SLOT_ICONS_IMG, resolveAttributeIcon, resolveIcon } from '../../utils/gameAssets'
import {getWeaponTypeLabel, getGearSlotLabel, getAttrCategoryLabel, formatNumber, calculateMaxDamage, buildGearSlotLabels} from '../../utils/formatters'
import { slugify } from "../../utils/slugify.js"
import { useParams, useNavigate, useLocation } from 'react-router-dom'

export default function CompactListView({ items, category, CardComponent, extraProps }) {
  const { slug: urlSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedSlug, setExpandedSlug] = useState(urlSlug)

  useEffect(() => {
    if (urlSlug) {
      setExpandedSlug(urlSlug)
    }
  }, [urlSlug])

  const toggleExpand = (slug) => {
    setExpandedSlug(expandedSlug === slug ? null : slug)
  }

  const handleCardClick = (slug) => {
    const newUrl = `/db/${category.key}/${slug}${location.search}`
    if (location.pathname !== `/db/${category.key}/${slug}`) {
      navigate(newUrl, { replace: true })
    }
  }

  return (
    <div className="space-y-2 fade-in">
      {items.map((item) => {
        const slug = item.slug || slugify(item.nom)
        const isExpanded = expandedSlug === slug

        return (
          <div 
            key={slug} 
            id={`item-${slug}`}
            className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden transition-all shadow-lg"
          >
            <div
              className={`px-4 py-2 flex items-center gap-4 hover:bg-white/5 transition-colors ${isExpanded ? 'border-b border-tactical-border/50 bg-white/5' : ''}`}
              onClick={() => toggleExpand(slug)}
            >
              <CompactRow item={item} category={category} extraProps={extraProps} />
              <div className={`ml-auto text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-black/20 overflow-x-auto">
                    <div 
                      className="min-w-fit cursor-pointer hover:ring-1 hover:ring-shd/50 rounded-lg transition-all"
                      onClick={() => handleCardClick(slug)}
                    >
                      <CardComponent item={item} {...extraProps} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function CompactRow({ item, category, extraProps }) {
  const catKey = category?.key

  switch (catKey) {
    case 'armes':
      return <WeaponRow item={item} {...extraProps} />
    case 'equipements':
      return <GearRow item={item} {...extraProps} />
    case 'ensembles':
      return <EnsembleRow item={item} {...extraProps} />
    case 'competences':
      return <SkillRow item={item} {...extraProps} />
    case 'attributs':
      return <AttributeRow item={item} {...extraProps} />
    case 'talentsArmes':
    case 'talentsEquipements':
      return <TalentRow item={item} {...extraProps} />
    case 'modsArmes':
      return <ModArmeRow item={item} {...extraProps} />
    case 'modsEquipements':
      return <ModEquipRow item={item} {...extraProps} />
    case 'modsCompetences':
      return <ModSkillRow item={item} {...extraProps} />
    default:
      return <div className="text-white font-bold">{item.nom}</div>
  }
}

function WeaponRow({ item, armesType }) {
  const typeIcon = WEAPON_TYPE_ICONS[item.type]
  const isExotic = item.estExotique
  const isSpecific = item.type === 'arme_specifique'
  const isNamed = item.estNomme && !isExotic
  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isSpecific ? 'text-purple-400' : 'text-shd'

  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={typeIcon} alt={item.type} size="w-8 h-8" className="opacity-70" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className={`font-bold text-sm uppercase truncate ${nameColor}`}>
          {isExotic && <span className="mr-1">★</span>}
          {item.nom}
        </div>
        <div className="text-xs text-gray-500 uppercase truncate">{getWeaponTypeLabel(armesType, item.type)}</div>
      </div>
      <div className="flex gap-4 md:gap-8 flex-1">
        <div className="flex flex-col w-20 md:w-24 flex-shrink-0">
          <span className="text-xs text-gray-500 uppercase font-bold">Base</span>
          <span className="text-xs text-gray-300">{formatNumber(item.degatsBase)}</span>
        </div>
        <div className="flex flex-col w-20 md:w-24 flex-shrink-0">
          <span className="text-xs text-gray-500 uppercase font-bold text-shd">Max</span>
          <span className="text-xs text-shd font-bold">{formatNumber(calculateMaxDamage(item.degatsBase))}</span>
        </div>
      </div>
    </>
  )
}

function GearRow({ item, ensembles, equipementsType, attributsType }) {
  const isExotic = item.type === 'exotique'
  const isNamed = item.estNomme && !isExotic
  const isGearSet = item.type === 'gear_set'
  const isImprovised = item.type === 'improvise'
  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isGearSet ? 'text-emerald-400' : isImprovised ? 'text-indigo-400' : 'text-shd'
  const ensemble = (ensembles && !Array.isArray(ensembles)) 
    ? ensembles[item.marque] 
    : ensembles?.find(e => e.slug === item.marque )

  const attrsEssentiels = React.useMemo(() => {
    if (Array.isArray(item.attributEssentiel) && item.attributEssentiel.length > 0) return item.attributEssentiel
    if (!ensembles || !item.marque) return []
    const ensemble = (ensembles && !Array.isArray(ensembles))
      ? ensembles[item.marque]
      : ensembles.find(e => e.slug === item.marque || e.nom.toLowerCase() === item.marque.toLowerCase())
    return ensemble?.attributsEssentiels || []
  }, [item, ensembles])

  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={GEAR_SLOT_ICONS_IMG[item.emplacement]} alt={item.emplacement} size="w-8 h-8" className="opacity-70" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className={`font-bold text-sm uppercase truncate ${nameColor}`}>{item.nom}</div>
        <div className="text-xs text-gray-500 uppercase truncate">{getGearSlotLabel(equipementsType, item.emplacement)} - { ensemble?.nom }</div>
      </div>
      <div className="flex gap-1 flex-1 overflow-hidden">
        {attrsEssentiels.map((attr, i) => (
          <div key={i} className="flex items-center gap-1 px-1.5 py-0.5">
            <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3.5 h-3.5" />
            <span className="text-xs text-gray-400 hidden sm:inline truncate">{getAttrCategoryLabel(attributsType, attr)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function EnsembleRow({ item, attributsType }) {
  const isGearSet = item.type === 'gear_set'
  const nameColor = isGearSet ? 'text-emerald-400' : 'text-shd'
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveIcon(item.icon)} alt="" size="w-8 h-8" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className={`font-bold text-sm uppercase truncate ${nameColor}`}>{item.nom}</div>
        <div className="text-xs text-gray-500 uppercase truncate">{item.type === 'marque' ? 'Marque' : 'Gear Set'}</div>
      </div>
      <div className="flex gap-1 flex-1 overflow-hidden">
        {item.attributsEssentiels?.map((attr, i) => (
          <div key={i} className="flex items-center gap-1 px-1.5 py-0.5">
            <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3.5 h-3.5" />
            <span className="text-xs text-gray-400 hidden sm:inline truncate">{getAttrCategoryLabel(attributsType, attr)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function SkillRow({ item }) {
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveIcon(item.icon)} alt="" size="w-8 h-8" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className="font-bold text-sm uppercase truncate text-yellow-400">{item.variante}</div>
        <div className="text-xs text-yellow-500/70 uppercase truncate">{item.competence}</div>
      </div>
    </>
  )
}

function AttributeRow({ item }) {
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveAttributeIcon(item.categorie)} alt="" size="w-8 h-8" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className="font-bold text-sm uppercase truncate text-shd">{item.nom}</div>
        {item.estEssentiel && <div className="text-xs text-blue-400 uppercase font-bold">Essentiel</div>}
      </div>
    </>
  )
}

function TalentRow({ item }) {
  const isExotic = item.estExotique
  const isGearSet = item.gearSet || item.gear_set
  const nameColor = isExotic ? 'text-red-400' : isGearSet ? 'text-emerald-400' : 'text-shd'
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveIcon(item.icon)} alt="" size="w-8 h-8" />
      </div>
      <div className={`font-bold text-sm uppercase truncate w-48 md:w-80 flex-shrink-0 ${nameColor}`}>{item.nom}</div>
    </>
  )
}

const WEAPON_MOD_TYPES = {
  chargeur: 'Chargeur',
  canon: 'Canon',
  viseur: 'Viseur',
  bouche: 'Bouche',
  accessoire: 'Accessoire',
  autre: 'Autre',
}

function ModArmeRow({ item, armesType }) {
  const compatibility = item.compatible?.length > 0 
    ? item.compatible.map(c => getWeaponTypeLabel(armesType, c)).join(', ')
    : 'Tous types'
  const slot = WEAPON_MOD_TYPES[item.type] || item.type
  const nameColor = item.estExotique ? 'text-red-400' : 'text-shd'

  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveIcon(item.icon)} alt="" size="w-8 h-8" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className={`font-bold text-sm uppercase truncate ${nameColor}`}>{item.nom}</div>
        <div className="text-xs text-gray-500 uppercase truncate">{compatibility} · {slot}</div>
      </div>
    </>
  )
}

function ModEquipRow({ item }) {
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={resolveAttributeIcon(item.attribut)} alt="" size="w-8 h-8" />
      </div>
      <div className="font-bold text-sm uppercase truncate text-shd w-48 md:w-80 flex-shrink-0">{item.nom}</div>
    </>
  )
}

function ModSkillRow({ item, competencesGrouped }) {
  const skillName = competencesGrouped?.[item.competence]?.competence || item.competence
  const skillIcon = resolveIcon(item.competence) || resolveIcon(item.icon)
  return (
    <>
      <div className="w-10 flex-shrink-0 flex justify-center">
        <GameIcon src={skillIcon} alt="" size="w-8 h-8" />
      </div>
      <div className="flex flex-col min-w-0 w-48 md:w-80 flex-shrink-0">
        <div className="font-bold text-sm uppercase truncate text-shd">{item.nom}</div>
        <div className="text-xs text-gray-500 uppercase truncate">{skillName} · {item.emplacement}</div>
      </div>
    </>
  )
}
