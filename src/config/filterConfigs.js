import { getWeaponTypeEntries } from '../utils/formatters'

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
// Ordre personnalisé des emplacements
// ================================================================
const SLOT_ORDER = {
  'masque': 1, 'sac_a_dos': 2, 'torse': 3, 'gants': 4, 'holster': 5, 'genouilleres': 6
}
function getSlotOrder(slot) { return SLOT_ORDER[slot] || 99 }

// ================================================================
// 🛠 MOTEUR DE TRI MULTI-COUCHES
// ================================================================
function multiSort(items, sortLayers, getters) {
  if (!Array.isArray(sortLayers) || sortLayers.length === 0) return items

  return [...items].sort((a, b) => {
    for (const layer of sortLayers) {
      const getter = getters[layer.id]
      if (!getter) continue

      const valA = getter(a)
      const valB = getter(b)

      if (valA !== valB) {
        // Tri alphabétique pour les chaînes
        if (typeof valA === 'string' && typeof valB === 'string') {
          const cmp = valA.localeCompare(valB, 'fr')
          return layer.desc ? -cmp : cmp
        }
        // Tri numérique
        if (typeof valA === 'number' && typeof valB === 'number') {
          return layer.desc ? valB - valA : valA - valB
        }
        // Fallback
        return layer.desc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1)
      }
    }
    return 0 // Totalement identiques sur toutes les couches
  })
}

// ----------------------------------------------------------------
// CALCULS DES RARETÉS
// ----------------------------------------------------------------
function weaponRarity(item) {
  if (item.type === 'arme_specifique') return 3
  if (item.estExotique) return 2
  if (item.estNomme) return 1
  return 0
}

function gearRarity(item) {
  if (item.type === 'exotique') return 4
  if (item.estNomme) return 3
  if (item.type === 'gear_set') return 2
  if (item.type === 'standard') return 1
  if (item.type === 'improvise') return 0
  return 1 // Fallback
}

function genericRarity(item) {
  if (item.type === 'exotique' || item.estExotique) return 4
  if (item.estNomme || item.perfectDescription) return 3
  if (item.type === 'gear_set') return 2
  if (item.type === 'improvise') return 0
  return 1
}

// ----------------------------------------------------------------
// DÉFINITIONS DES COUCHES DE TRI PAR CATÉGORIE
// ----------------------------------------------------------------

// ARMES
export const WEAPON_SORT_OPTIONS = [
  { id: 'rarity', label: 'Rareté', ascLabel: '↑', descLabel: '↓' },
  { id: 'alpha', label: 'Nom', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'type', label: "Type d'arme", ascLabel: 'A-Z', descLabel: 'Z-A' }
]
export const WEAPON_DEFAULT_SORT = [
  { id: 'rarity', desc: false },
  { id: 'type', desc: false },
  { id: 'alpha', desc: false }
]
const weaponGetters = {
  rarity: weaponRarity,
  alpha: (item) => item.nom || '',
  type: (item) => item.type || ''
}
export function applySortWeapons(items, sortLayers) { return multiSort(items, sortLayers, weaponGetters) }

// EQUIPEMENTS
export const GEAR_SORT_OPTIONS = [
  { id: 'rarity', label: 'Rareté', ascLabel: '↑', descLabel: '↓' },
  { id: 'alpha', label: 'Nom', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'marque', label: 'Marque / Ensemble', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'emplacement', label: 'Emplacement', ascLabel: '', descLabel: '', hideDirection: true }
]
export const GEAR_DEFAULT_SORT = [
  { id: 'rarity', desc: false },
  { id: 'marque', desc: false },
  { id: 'emplacement', desc: false },
  { id: 'alpha', desc: false }
]
const gearGetters = {
  rarity: gearRarity,
  alpha: (item) => item.nom || '',
  marque: (item) => item.marque || '',
  emplacement: (item) => getSlotOrder(item.emplacement)
}
export function applySortGear(items, sortLayers) { return multiSort(items, sortLayers, gearGetters) }

// ENSEMBLES (Gear Sets / Marques)
export const ENSEMBLE_SORT_OPTIONS = [
  { id: 'rarity', label: 'Type', ascLabel: '↑', descLabel: '↓' },
  { id: 'alpha', label: 'Nom', ascLabel: 'A-Z', descLabel: 'Z-A' }
]
export const ENSEMBLE_DEFAULT_SORT = [
  { id: 'rarity', desc: false },
  { id: 'alpha', desc: false }
]
const ensembleGetters = {
  rarity: genericRarity,
  alpha: (item) => item.nom || ''
}
export function applySortEnsembles(items, sortLayers) { return multiSort(items, sortLayers, ensembleGetters) }

// GENERIQUE (Talents, Mods, etc.)
export const GENERIC_SORT_OPTIONS = [
  { id: 'rarity', label: 'Rareté', ascLabel: '↑', descLabel: '↓' },
  { id: 'alpha', label: 'Nom / Variante', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'categorie', label: 'Catégorie / Type', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'parent', label: 'Compétence parente', ascLabel: 'A-Z', descLabel: 'Z-A' },
  { id: 'emplacement', label: 'Emplacement', ascLabel: '', descLabel: '', hideDirection: true }
]
export const GENERIC_DEFAULT_SORT = [
  { id: 'rarity', desc: false },
  { id: 'categorie', desc: false },
  { id: 'parent', desc: false },
  { id: 'emplacement', desc: false },
  { id: 'alpha', desc: false }
]
const genericGetters = {
  rarity: genericRarity,
  alpha: (item) => item.variante || item.nom || '',
  categorie: (item) => item.categorie || item.type || '',
  parent: (item) => item.competence || '',
  emplacement: (item) => item.emplacement ? getSlotOrder(item.emplacement) : 99
}
export function applySortGeneric(items, sortLayers) { return multiSort(items, sortLayers, genericGetters) }

// COMPÉTENCES
export const SKILL_DEFAULT_SORT = [
  { id: 'parent', desc: false },
  { id: 'alpha', desc: false },
  { id: 'rarity', desc: true },
  { id: 'categorie', desc: false },
  { id: 'emplacement', desc: false }
]
export function applySortSkills(items, sortLayers) { return multiSort(items, sortLayers, genericGetters) }


// ================================================================
// FILTRES
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

export function getGearFilters(data) {
  const eqType = data?.equipements_type || {}
  const attrType = data?.attributs_type || {}
  const slotOptions = Object.entries(eqType).map(([value, obj]) => ({ value, label: obj.nom }))

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

export function getEnsembleFilters(data) {
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

export function getCompetenceFilters(data) {
  const comps = data?.competencesGrouped || data?.competences || []
  let parentOptions = []
  if (Array.isArray(comps) && comps.length > 0) {
    if (comps[0]?.variantes) {
      parentOptions = comps
          .map(c => ({ value: c.competence, label: c.competence }))
          .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    } else {
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

export function getModEquipementFilters(data) {
  const rawData = data?.modsEquipements || {}
  const mods = Array.isArray(rawData) ? rawData : Object.values(rawData)

  const categories = [...new Set(mods.map(m => m.categorie).filter(Boolean))]
      .sort()
      .map(c => ({
        value: c,
        label: c.charAt(0).toUpperCase() + c.slice(1)
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