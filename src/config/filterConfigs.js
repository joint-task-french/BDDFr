import { getWeaponTypeEntries, getGearSlots, getGearSlotLabel, getAttrCategoryLabel } from '../utils/formatters'

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

function gearRarity(item) {
  if (item.type === 'exotique') return 3
  if (item.estNomme) return 2
  if (item.type === 'gear_set') return 1
  return 0
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
  let sorted
  if (base === 'rarity') {
    sorted = [...items].sort((a, b) => {
      const ra = weaponRarity(a), rb = weaponRarity(b)
      if (ra !== rb) return ra - rb
      return (a.nom || '').localeCompare(b.nom || '', 'fr')
    })
  } else {
    sorted = [...items].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
  }
  return desc ? sorted.reverse() : sorted
}

export function applySortGear(items, sortKey) {
  const { base, desc } = parseSort(sortKey)
  let sorted
  if (base === 'rarity') {
    sorted = [...items].sort((a, b) => {
      const ra = gearRarity(a), rb = gearRarity(b)
      if (ra !== rb) return ra - rb
      return (a.nom || '').localeCompare(b.nom || '', 'fr')
    })
  } else if (base === 'marque') {
    sorted = [...items].sort((a, b) => {
      const cmp = (a.marque || '').localeCompare(b.marque || '', 'fr')
      return cmp !== 0 ? cmp : (a.nom || '').localeCompare(b.nom || '', 'fr')
    })
  } else if (base === 'emplacement') {
    sorted = [...items].sort((a, b) => {
      const cmp = (a.emplacement || '').localeCompare(b.emplacement || '', 'fr')
      return cmp !== 0 ? cmp : (a.nom || '').localeCompare(b.nom || '', 'fr')
    })
  } else {
    sorted = [...items].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
  }
  return desc ? sorted.reverse() : sorted
}

export function applySortGeneric(items, sortKey) {
  const { base, desc } = parseSort(sortKey)
  let sorted
  if (base === 'rarity') {
    sorted = [...items].sort((a, b) => {
      const ra = genericRarity(a), rb = genericRarity(b)
      if (ra !== rb) return ra - rb
      return (a.nom || a.variante || '').localeCompare(b.nom || b.variante || '', 'fr')
    })
  } else {
    sorted = [...items].sort((a, b) => (a.nom || a.variante || '').localeCompare(b.nom || b.variante || '', 'fr'))
  }
  return desc ? sorted.reverse() : sorted
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
  const torseLabel = eqType.torse?.nom || 'Torse'
  const sacLabel = eqType.sac_a_dos?.nom || 'Sac à dos'
  return [
    {
      key: 'emplacement', type: 'select', label: 'Emplacement',
      options: [
        { value: 'torse', label: torseLabel },
        { value: 'sac_a_dos', label: sacLabel },
        { value: 'tous', label: 'Les deux' },
      ],
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
      const match = filters.emplacement === 'tous' ? item.emplacement === 'tous' : (item.emplacement === filters.emplacement || item.emplacement === 'tous')
      if (!match) return false
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
