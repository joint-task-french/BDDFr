import { getWeaponTypeEntries, getGearSlots, getGearSlotLabel, getAttrCategoryLabel } from '../utils/formatters'

// ================================================================
// Ordre personnalisé des emplacements
// ================================================================
const SLOT_ORDER = {
  'masque': 1,
  'sac_a_dos': 2,
  'torse': 3,
  'gants': 4,
  'holster': 5,
  'genouilleres': 6
}

function getSlotOrder(slot) {
  return SLOT_ORDER[slot] || 99
}

// ================================================================
// Utilitaire : calcul des bornes min/max depuis un tableau de valeurs
// ================================================================
function bounds(items, field, { step = 1, fallbackMin = 0, fallbackMax = 100 } = {}) {
  const values = items.map(i => i[field]).filter(v => typeof v === 'number' && v > 0)
  if (values.length === 0) return { min: fallbackMin, max: fallbackMax }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const min = Math.floor(rawMin / step) * step
  const max = Math.ceil(rawMax / step) * step
  return { min, max }
}

// ================================================================
// Options de tri réutilisables
// Chaque option inclut directement sa direction (asc/desc).
// ================================================================
export const RAR_ALPHA_SORT_OPTION = [
  { value: 'rarity_asc', label: 'Rareté ↑' },
  { value: 'rarity_desc', label: 'Rareté ↓' },
  { value: 'alpha_asc', label: 'Alphabétique A→Z' },
  { value: 'alpha_desc', label: 'Alphabétique Z→A' },
]

export const GEAR_SORT_OPTIONS = [
  { value: 'rarity_asc', label: 'Rareté ↑' },
  { value: 'rarity_desc', label: 'Rareté ↓' },
  { value: 'alpha_asc', label: 'Alphabétique A→Z' },
  { value: 'alpha_desc', label: 'Alphabétique Z→A' },
  { value: 'marque_asc', label: 'Marque A→Z' },
  { value: 'marque_desc', label: 'Marque Z→A' },
  { value: 'emplacement_asc', label: 'Emplacement A→Z' },
  { value: 'emplacement_desc', label: 'Emplacement Z→A' },
]

export const GENERIC_SORT_OPTIONS = [
  { value: 'alpha_asc', label: 'Alphabétique A→Z' },
  { value: 'alpha_desc', label: 'Alphabétique Z→A' },
]

// estExotique=true → 2, estNomme=true → 1, arme_specifique → 3
function weaponRarity(item) {
  if (item.type === 'arme_specifique') return 3
  if (item.estExotique) return 2
  if (item.estNomme) return 1
  return 0
}

function genericRarity(item) {
  if (item.estExotique) return 2
  if (item.estNomme || item.perfectDescription) return 1
  return 0
}

// Equipement improvisé en tant que "moins rare que standard"
function gearRarity(item) {
  if (item.type === 'exotique') return 4
  if (item.estNomme) return 3
  if (item.type === 'gear_set') return 2
  if (item.type === 'standard') return 1
  if (item.type === 'improvise') return 0
  return 1 // Fallback (Standard)
}

/** Parse "alpha_desc" → { base: "alpha", desc: true } */
function parseSort(sortKey) {
  if (!sortKey) return { base: 'alpha', desc: false }
  const desc = sortKey.endsWith('_desc')
  const base = sortKey.replace(/_(?:asc|desc)$/, '')
  return { base, desc }
}

export function applySortWeapons(items, sortKey) {
  const { base, desc } = parseSort(sortKey)

  return [...items].sort((a, b) => {
    if (base === 'rarity') {
      const ra = weaponRarity(a), rb = weaponRarity(b)
      if (ra !== rb) return desc ? rb - ra : ra - rb
    }

    const nomA = a.nom || ''
    const nomB = b.nom || ''
    const cmpAlpha = nomA.localeCompare(nomB, 'fr')
    return (base === 'alpha' && desc) ? -cmpAlpha : cmpAlpha
  })
}

export function applySortGear(items, sortKey) {
  const { base, desc } = parseSort(sortKey)

  return [...items].sort((a, b) => {
    if (base === 'rarity') {
      const ra = gearRarity(a), rb = gearRarity(b)
      if (ra !== rb) return desc ? rb - ra : ra - rb

      // Sous-tri 1 : Marque (alphabétique)
      const marqueA = a.marque || ''
      const marqueB = b.marque || ''
      const cmpMarque = marqueA.localeCompare(marqueB, 'fr')
      if (cmpMarque !== 0) return cmpMarque

      // Sous-tri 2 : Emplacement (ordre personnalisé)
      const orderA = getSlotOrder(a.emplacement)
      const orderB = getSlotOrder(b.emplacement)
      if (orderA !== orderB) return orderA - orderB

    } else if (base === 'marque') {
      const cmp = (a.marque || '').localeCompare(b.marque || '', 'fr')
      if (cmp !== 0) return desc ? -cmp : cmp
    } else if (base === 'emplacement') {
      const orderA = getSlotOrder(a.emplacement)
      const orderB = getSlotOrder(b.emplacement)
      if (orderA !== orderB) return desc ? orderB - orderA : orderA - orderB
    }

    const nomA = a.nom || ''
    const nomB = b.nom || ''
    const cmpAlpha = nomA.localeCompare(nomB, 'fr')
    return (base === 'alpha' && desc) ? -cmpAlpha : cmpAlpha
  })
}

export function applySortGeneric(items, sortKey) {
  const { base, desc } = parseSort(sortKey)

  return [...items].sort((a, b) => {
    if (base === 'rarity') {
      const ra = genericRarity(a), rb = genericRarity(b)
      if (ra !== rb) return desc ? rb - ra : ra - rb
    }

    const nomA = a.nom || a.variante || ''
    const nomB = b.nom || b.variante || ''
    const cmpAlpha = nomA.localeCompare(nomB, 'fr')
    return (base === 'alpha' && desc) ? -cmpAlpha : cmpAlpha
  })
}

export function applySortSkills(items, sortKey) {
  const { base, desc } = parseSort(sortKey)

  return [...items].sort((a, b) => {
    // Tri primaire : par compétence parente
    const compA = a.competence || ''
    const compB = b.competence || ''
    const cmpComp = compA.localeCompare(compB, 'fr')

    if (cmpComp !== 0) {
      return (base === 'alpha' && desc) ? -cmpComp : cmpComp
    }

    // Tri secondaire : par variante (ou nom si la variante n'existe pas)
    const nomA = a.variante || a.nom || ''
    const nomB = b.variante || b.nom || ''
    const cmpAlpha = nomA.localeCompare(nomB, 'fr')

    return (base === 'alpha' && desc) ? -cmpAlpha : cmpAlpha
  })
}

// ================================================================
// ARMES
// ================================================================
export function getWeaponFilters(data) {
  const armes = data?.armes || []
  const armesType = data?.armes_type || {}
  const typeOptions = getWeaponTypeEntries(armesType)
      .filter(([k]) => k !== 'autre')
      .map(([value, obj]) => ({ value, label: obj.nom }))

  const portee = bounds(armes, 'portee', { step: 5 })
  const rpm = bounds(armes, 'rpm', { step: 50 })
  const chargeur = bounds(armes, 'chargeur', { step: 5 })
  const rechargement = bounds(armes, 'rechargement', { step: 0.5, fallbackMax: 10 })

  return [
    {
      key: 'types', type: 'checkboxes', label: "Type d'arme",
      options: typeOptions,
    },
    { key: 'porteeMin', type: 'range', label: 'Portée (m)', ...portee, step: 5 },
    { key: 'rpm', type: 'range', label: 'CPM (coups/min)', ...rpm, step: 50 },
    { key: 'chargeur', type: 'range', label: 'Chargeur', ...chargeur, step: 5 },
    { key: 'rechargement', type: 'range', label: 'Rechargement (s)', ...rechargement, step: 0.5 },
    { key: 'estExotique', type: 'tri-state', label: 'Exotique' },
    { key: 'estNomme', type: 'tri-state', label: 'Nommé' },
  ]
}

export function getWeaponDefaults(data) {
  const armes = data?.armes || []
  const portee = bounds(armes, 'portee', { step: 5 })
  const rpm = bounds(armes, 'rpm', { step: 50 })
  const chargeur = bounds(armes, 'chargeur', { step: 5 })
  const rechargement = bounds(armes, 'rechargement', { step: 0.5, fallbackMax: 10 })

  return {
    types: [],
    porteeMin: [portee.min, portee.max],
    rpm: [rpm.min, rpm.max],
    chargeur: [chargeur.min, chargeur.max],
    rechargement: [rechargement.min, rechargement.max],
    estExotique: null,
    estNomme: null,
  }
}

export function applyWeaponFilters(items, filters) {
  return items.filter(item => {
    if (filters.types.length > 0 && !filters.types.includes(item.type)) return false
    const portee = item.portee || 0
    if (portee > 0 && (portee < filters.porteeMin[0] || portee > filters.porteeMin[1])) return false
    const rpm = item.rpm || 0
    if (rpm > 0 && (rpm < filters.rpm[0] || rpm > filters.rpm[1])) return false
    const charg = item.chargeur || 0
    if (charg > 0 && (charg < filters.chargeur[0] || charg > filters.chargeur[1])) return false
    const rech = item.rechargement || 0
    if (rech > 0 && (rech < filters.rechargement[0] || rech > filters.rechargement[1])) return false
    if (filters.estExotique !== null && filters.estExotique !== undefined && !!item.estExotique !== filters.estExotique) return false
    if (filters.estNomme !== null && filters.estNomme !== undefined && !!item.estNomme !== filters.estNomme) return false
    return true
  })
}

// ================================================================
// ÉQUIPEMENTS
// ================================================================
export function getGearFilters(data) {
  const eqType = data?.equipements_type || {}
  const attrType = data?.attributs_type || {}
  const slotOptions = Object.entries(eqType).map(([value, obj]) => ({ value, label: obj.nom }))

  // Marques uniques depuis les données
  const marques = data?.ensembles
      ? [...new Map(data.ensembles.map(e => [e.slug || e.nom, e.nom])).entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([slug, nom]) => ({ value: slug, label: nom }))
      : []

  const catAttrOptions = Object.entries(attrType).map(([value, obj]) => ({ value, label: obj.nom }))

  return [
    {
      key: 'emplacement', type: 'select', label: 'Emplacement',
      options: slotOptions,
    },
    {
      key: 'marque', type: 'select', label: 'Marque / Ensemble',
      options: marques,
    },
    {
      key: 'attributEssentiel', type: 'select', label: 'Attribut essentiel',
      options: catAttrOptions,
    },
    { key: 'estExotique', type: 'tri-state', label: 'Exotique' },
    { key: 'estNomme', type: 'tri-state', label: 'Nommé' },
  ]
}

export function getGearDefaults() {
  return {
    emplacement: '',
    marque: '',
    attributEssentiel: '',
    estExotique: null,
    estNomme: null,
  }
}

export function applyGearFilters(items, filters) {
  return items.filter(item => {
    if (filters.emplacement && item.emplacement !== filters.emplacement) return false
    if (filters.marque && item.marque !== filters.marque) return false
    if (filters.attributEssentiel && !(Array.isArray(item.attributEssentiel) && item.attributEssentiel.includes(filters.attributEssentiel))) return false
    if (filters.estExotique !== null && filters.estExotique !== undefined) {
      const isExo = item.type === 'exotique' || !!item.estExotique
      if (isExo !== filters.estExotique) return false
    }
    if (filters.estNomme !== null && filters.estNomme !== undefined && !!item.estNomme !== filters.estNomme) return false
    return true
  })
}

// ================================================================
// TALENTS D'ARMES
// ================================================================
export function getTalentArmeFilters(data) {
  const armesType = data?.armes_type || {}
  const typeOptions = Object.entries(armesType)
      .filter(([k]) => !['arme_specifique'].includes(k))
      .map(([value, obj]) => ({ value, label: obj.nom }))

  return [
    {
      key: 'compatibilite', type: 'checkboxes', label: 'Compatible avec',
      options: typeOptions,
    },
    { key: 'estExotique', type: 'tri-state', label: 'Exotique' },
    { key: 'aParfait', type: 'toggle', label: 'Avec version parfaite' },
  ]
}

export function getTalentArmeDefaults() {
  return { compatibilite: [], estExotique: null, aParfait: false }
}

export function applyTalentArmeFilters(items, filters) {
  return items.filter(item => {
    if (filters.compatibilite.length > 0) {
      const compat = item.compatibilite || {}
      if (!filters.compatibilite.every(type => compat[type] === true)) return false
    }
    if (filters.estExotique !== null && filters.estExotique !== undefined && !!item.estExotique !== filters.estExotique) return false
    if (filters.aParfait && !item.perfectDescription) return false
    return true
  })
}

// ================================================================
// TALENTS D'ÉQUIPEMENTS
// ================================================================
export function getTalentEquipFilters(data) {
  const eqType = data?.equipements_type || {}
  const options = Object.entries(eqType).map(([key, value]) => ({
    value: key,
    label: value.nom || key
  }))

  return [
    {
      key: 'emplacement', type: 'select', label: 'Emplacement',
      options: options,
    },
    { key: 'estExotique', type: 'tri-state', label: 'Exotique' },
    { key: 'aParfait', type: 'toggle', label: 'Avec version parfaite' },
  ]
}

export function getTalentEquipDefaults() {
  return { emplacement: '', estExotique: null, aParfait: false }
}

export function applyTalentEquipFilters(items, filters) {
  return items.filter(item => {
    if (filters.emplacement) {
      if (item.emplacement !== filters.emplacement) return false
    }
    if (filters.estExotique !== null && filters.estExotique !== undefined && !!item.estExotique !== filters.estExotique) return false
    if (filters.aParfait && !item.perfectDescription) return false
    return true
  })
}

// ================================================================
// MODS D'ARMES
// ================================================================
export function getModArmeFilters() {
  return [
    {
      key: 'type', type: 'checkboxes', label: 'Type de mod',
      options: [
        { value: 'chargeur', label: 'Chargeur' },
        { value: 'canon', label: 'Canon' },
        { value: 'viseur', label: 'Viseur' },
        { value: 'bouche', label: 'bouche' },
      ],
    },
    { key: 'estExotique', type: 'tri-state', label: 'Exotique' },
  ]
}

export function getModArmeDefaults() {
  return { type: [], estExotique: null }
}

export function applyModArmeFilters(items, filters) {
  return items.filter(item => {
    if (filters.type.length > 0 && !filters.type.includes(item.type)) return false
    if (filters.estExotique !== null && filters.estExotique !== undefined && !!item.estExotique !== filters.estExotique) return false
    return true
  })
}

// ================================================================
// ENSEMBLES
// ================================================================
export function getEnsembleFilters(data) {
  // Extraire les attributsEssentiels uniques depuis les ensembles
  const statsSet = new Map()
  const ensembles = data?.ensembles || []
  const statistiques = data?.statistiques || []
  for (const ens of ensembles) {
    if (ens.attributsEssentiels) {
      for (const slug of ens.attributsEssentiels) {
        if (!statsSet.has(slug)) {
          const stat = statistiques.find(s => s.slug === slug)
          statsSet.set(slug, stat?.nom || slug)
        }
      }
    }
  }
  const attrOptions = [...statsSet.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
      .map(([value, label]) => ({ value, label }))

  return [
    { key: 'isGearSet', type: 'tri-state', label: 'Type', trueLabel: 'set', falseLabel: 'marque', isGearSetType: true },
    {
      key: 'attributEssentiel', type: 'select', label: 'Attribut essentiel',
      options: attrOptions,
    },
  ]
}

export function getEnsembleDefaults() {
  return { isGearSet: null, attributEssentiel: '' }
}

export function applyEnsembleFilters(items, filters) {
  return items.filter(item => {
    if (filters.isGearSet !== null && filters.isGearSet !== undefined) {
      const isGS = item.type === 'gear_set'
      if (isGS !== filters.isGearSet) return false
    }
    if (filters.attributEssentiel && !(Array.isArray(item.attributsEssentiels) && item.attributsEssentiels.includes(filters.attributEssentiel))) return false
    return true
  })
}

// ================================================================
// ATTRIBUTS
// ================================================================
const CIBLE_OPTIONS = [
  { value: 'arme', label: 'Armes' },
  { value: 'equipement', label: 'Équipements' },
  { value: 'mod_arme', label: "Mods d'armes" },
  { value: 'mod_equipement', label: "Mods d'équipements" },
  { value: 'competence', label: 'Compétences' },
  { value: 'mod_competence', label: 'Mods de compétences' },
]

export function getAttributFilters(data) {
  const attrType = data?.attributs_type || {}
  const typeOptions = Object.entries(attrType).map(([value, obj]) => ({ value, label: obj.nom }))

  // Statistiques uniques référencées par les attributs
  const statistiques = data?.statistiques || []
  const statOptions = statistiques
      .map(s => ({ value: s.slug, label: s.nom }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))

  return [
    { key: 'estEssentiel', type: 'tri-state', label: 'Essentiel' },
    {
      key: 'categorie', type: 'select', label: 'Type',
      options: typeOptions,
    },
    {
      key: 'cible', type: 'select', label: 'Cible',
      options: CIBLE_OPTIONS,
    },
    {
      key: 'statistique', type: 'select', label: 'Statistique affectée',
      options: statOptions,
    },
  ]
}

export function getAttributDefaults() {
  return { estEssentiel: null, categorie: '', cible: '', statistique: '' }
}

export function applyAttributFilters(items, filters) {
  return items.filter(item => {
    if (filters.estEssentiel !== null && filters.estEssentiel !== undefined && !!item.estEssentiel !== filters.estEssentiel) return false
    if (filters.categorie && item.categorie !== filters.categorie) return false
    if (filters.cible && !(Array.isArray(item.cible) && item.cible.includes(filters.cible))) return false
    if (filters.statistique && !(Array.isArray(item.statistiques) && item.statistiques.includes(filters.statistique))) return false
    return true
  })
}

// ================================================================
// COMPÉTENCES
// ================================================================
export function getCompetenceFilters(data) {
  // Extraire les compétences parentes uniques
  const comps = data?.competencesGrouped || data?.competences || []
  let parentOptions = []
  if (Array.isArray(comps) && comps.length > 0) {
    // Si groupé (a .variantes), extraire les parents
    if (comps[0]?.variantes) {
      parentOptions = comps
          .map(c => ({ value: c.competence, label: c.competence }))
          .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    } else {
      // Si aplati, extraire les compétences uniques
      const unique = [...new Set(comps.map(c => c.competence).filter(Boolean))]
      parentOptions = unique
          .sort((a, b) => a.localeCompare(b, 'fr'))
          .map(c => ({ value: c, label: c }))
    }
  }

  return [
    {
      key: 'competence', type: 'select', label: 'Compétence',
      options: parentOptions,
    },
  ]
}

export function getCompetenceDefaults() {
  return { competence: '' }
}

export function applyCompetenceFilters(items, filters) {
  return items.filter(item => {
    if (filters.competence && item.competence !== filters.competence) return false
    return true
  })
}

// ================================================================
// MODS D'ÉQUIPEMENTS
// ================================================================
export function getModEquipementFilters(data) {
  // 1. On utilise camelCase pour cibler la bonne clé
  const rawData = data?.modsEquipements || {}

  // 2. On s'assure de transformer l'objet JSON en tableau pour pouvoir utiliser .map()
  const mods = Array.isArray(rawData) ? rawData : Object.values(rawData)

  // Extraire les catégories uniques (offensif, defensif, utilitaire)
  const categories = [...new Set(mods.map(m => m.categorie).filter(Boolean))]
      .sort()
      .map(c => ({
        value: c,
        label: c.charAt(0).toUpperCase() + c.slice(1) // Majuscule
      }))

  return [
    {
      key: 'categorie', type: 'select', label: 'Catégorie',
      options: categories,
    }
  ]
}

export function getModEquipementDefaults() {
  return { categorie: '' }
}

export function applyModEquipementFilters(items, filters) {
  return items.filter(item => {
    if (filters.categorie && item.categorie !== filters.categorie) return false
    return true
  })
}

// ================================================================
// MODS DE COMPÉTENCES
// ================================================================
export function getModCompetenceFilters(data, values = {}) {
  const rawData = data?.modsCompetences || {}
  const mods = Array.isArray(rawData) ? rawData : Object.values(rawData)

  const competences = [...new Set(mods.map(m => m.competence).filter(Boolean))].sort()
  const compOptions = competences.map(c => ({
    value: c,
    label: c.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  }))

  const filters = [
    {
      key: 'competence', type: 'select', label: 'Compétence ciblée',
      options: compOptions,
    }
  ]

  if (values.competence) {
    const modsFiltres = mods.filter(m => m.competence === values.competence)
    const emplacements = [...new Set(modsFiltres.map(m => m.emplacement).filter(Boolean))].sort()
    const empOptions = emplacements.map(e => ({ value: e, label: e }))

    filters.push({
      key: 'emplacement', type: 'select', label: 'Emplacement',
      options: empOptions,
    })
  }

  return filters
}

export function getModCompetenceDefaults() {
  return { competence: '', emplacement: '' }
}

export function applyModCompetenceFilters(items, filters) {
  return items.filter(item => {
    if (filters.competence && item.competence !== filters.competence) return false
    if (filters.emplacement && item.emplacement !== filters.emplacement) return false
    return true
  })
}