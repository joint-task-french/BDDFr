import { WEAPON_TYPE_LABELS, GEAR_SLOT_LABELS } from '../utils/formatters'

// ================================================================
// Utilitaire : calcul des bornes min/max depuis un tableau de valeurs
// ================================================================
function bounds(items, field, { step = 1, fallbackMin = 0, fallbackMax = 100 } = {}) {
  const values = items.map(i => i[field]).filter(v => typeof v === 'number' && v > 0)
  if (values.length === 0) return { min: fallbackMin, max: fallbackMax }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  // Arrondir au step inférieur/supérieur pour avoir des bornes propres
  const min = Math.floor(rawMin / step) * step
  const max = Math.ceil(rawMax / step) * step
  return { min, max }
}

// ================================================================
// ARMES
// ================================================================
export function getWeaponFilters(data) {
  const armes = data?.armes || []
  const typeOptions = Object.entries(WEAPON_TYPE_LABELS)
    .filter(([k]) => k !== 'autre')
    .map(([value, label]) => ({ value, label }))

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
    { key: 'estExotique', type: 'toggle', label: 'Exotique uniquement' },
    { key: 'estNomme', type: 'toggle', label: 'Nommé uniquement' },
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
    estExotique: false,
    estNomme: false,
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
    if (filters.estExotique && !item.estExotique) return false
    if (filters.estNomme && !item.estNomme) return false
    return true
  })
}

// ================================================================
// ÉQUIPEMENTS
// ================================================================
export function getGearFilters(data) {
  const slotOptions = Object.entries(GEAR_SLOT_LABELS).map(([value, label]) => ({ value, label }))

  // Marques uniques depuis les données
  const marques = data?.ensembles
    ? [...new Set(data.ensembles.map(e => e.nom))].sort().map(m => ({ value: m, label: m }))
    : []

  const catAttrOptions = [
    { value: 'degats', label: 'Dégâts' },
    { value: 'protection', label: 'Protection' },
    { value: 'competences', label: 'Compétences' },
  ]

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
      key: 'categorieAttribut', type: 'select', label: 'Attribut essentiel',
      options: catAttrOptions,
    },
    { key: 'estExotique', type: 'toggle', label: 'Exotique uniquement' },
    { key: 'estNomme', type: 'toggle', label: 'Nommé uniquement' },
  ]
}

export function getGearDefaults() {
  return {
    emplacement: '',
    marque: '',
    categorieAttribut: '',
    estExotique: false,
    estNomme: false,
  }
}

export function applyGearFilters(items, filters) {
  return items.filter(item => {
    if (filters.emplacement && item.emplacement !== filters.emplacement) return false
    if (filters.marque && item.marque !== filters.marque) return false
    if (filters.categorieAttribut && item.categorieAttribut !== filters.categorieAttribut) return false
    if (filters.estExotique && !item.estExotique) return false
    if (filters.estNomme && !item.estNomme) return false
    return true
  })
}

// ================================================================
// TALENTS D'ARMES
// ================================================================
export function getTalentArmeFilters() {
  const typeOptions = Object.entries(WEAPON_TYPE_LABELS)
    .filter(([k]) => !['autre', 'arme_specifique'].includes(k))
    .map(([value, label]) => ({ value, label }))

  return [
    {
      key: 'compatibilite', type: 'checkboxes', label: 'Compatible avec',
      options: typeOptions,
    },
    { key: 'estExotique', type: 'toggle', label: 'Exotique uniquement' },
    { key: 'aParfait', type: 'toggle', label: 'Avec version parfaite' },
  ]
}

export function getTalentArmeDefaults() {
  return { compatibilite: [], estExotique: false, aParfait: false }
}

export function applyTalentArmeFilters(items, filters) {
  return items.filter(item => {
    if (filters.compatibilite.length > 0) {
      const compat = item.compatibilite || {}
      return filters.compatibilite.every(type => compat[type] === true)
    }
    if (filters.estExotique && !item.estExotique) return false
    if (filters.aParfait && !item.perfectDescription) return false
    return true
  })
}

// ================================================================
// TALENTS D'ÉQUIPEMENTS
// ================================================================
export function getTalentEquipFilters() {
  return [
    {
      key: 'emplacement', type: 'select', label: 'Emplacement',
      options: [
        { value: 'torse', label: 'Torse' },
        { value: 'sac_a_dos', label: 'Sac à dos' },
        { value: 'tous', label: 'Les deux' },
      ],
    },
    { key: 'estExotique', type: 'toggle', label: 'Exotique uniquement' },
    { key: 'aParfait', type: 'toggle', label: 'Avec version parfaite' },
  ]
}

export function getTalentEquipDefaults() {
  return { emplacement: '', estExotique: false, aParfait: false }
}

export function applyTalentEquipFilters(items, filters) {
  return items.filter(item => {
    if (filters.emplacement) {
      if (filters.emplacement === 'tous') return item.emplacement === 'tous'
      return item.emplacement === filters.emplacement || item.emplacement === 'tous'
    }
    if (filters.estExotique && !item.estExotique) return false
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
        { value: 'accessoire', label: 'Accessoire' },
      ],
    },
  ]
}

export function getModArmeDefaults() {
  return { type: [] }
}

export function applyModArmeFilters(items, filters) {
  return items.filter(item => {
    if (filters.type.length > 0 && !filters.type.includes(item.type)) return false
    return true
  })
}

