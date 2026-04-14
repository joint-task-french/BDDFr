import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { getSpecFromWeapon, getSpecialisations } from '../utils/formatters'
import { getSHDLevels } from '../hooks/useSHDWatch'

const BuildContext = createContext(null)

const STORAGE_KEY = 'div2_current_build'

const getInitialState = () => {
  const defaultState = {
    // Arme spécifique (signature) — détermine la spécialisation
    specialWeapon: null,
    // Armes classiques : primaire, secondaire
    weapons: [null, null],
    weaponTalents: [null, null],
    // Attributs armes : [{nom, valeur}] par slot (0=primaire, 1=secondaire, 'sidearm'=poing)
    weaponAttributes: [null, null],
    sidearmAttribute: null,
    // Valeurs des attributs essentiels par slot : { weapon0: {slug: valeur}, weapon1: {slug: valeur}, sidearm: {slug: valeur} }
    weaponEssentialValues: { weapon0: {}, weapon1: {}, sidearm: {} },
    // Mods d'armes : [array_de_mods] par slot
    weaponMods: [null, null],
    sidearmMods: null,
    // Arme de poing
    sidearm: null,
    sidearmTalent: null,
    // Équipements
    gear: { masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null },
    gearTalents: { torse: null, sac_a_dos: null },
    // Attributs équipements : { slot: { essentiels: [{nom,valeur}], classiques: [{nom,valeur}] } }
    gearAttributes: {},
    // Mods d'équipements : { slot: [mod_object_1, mod_object_2] }
    gearMods: {},
    // Compétences
    skills: [null, null],
    // Mods de compétences : [mod_object, mod_object]
    skillMods: [null, null],
    // Valeurs utilisateur des mods (curseurs) : { gearMods: { slot: { modIndex: { attrSlug: val } } }, skillMods: { slotIndex: { attrSlug: val } } }
    modValues: { gearMods: {}, skillMods: {} },
    // Niveaux de la montre SHD (0-50 pour chaque stat)
    shdLevels: getSHDLevels(),
    // Expertise : niveaux 0-20 par slot
    expertise: {
      weapon0: 0, weapon1: 0, sidearm: 0,
      masque: 0, torse: 0, holster: 0, sac_a_dos: 0, gants: 0, genouilleres: 0,
    },
    // Prototypes : booleans par slot
    prototypes: {
      weapon0: false, weapon1: false, sidearm: false,
      masque: false, torse: false, holster: false, sac_a_dos: false, gants: false, genouilleres: false,
    },
    // Talents prototypes : { slot: talent_object }
    prototypeTalents: {
      weapon0: null, weapon1: null, sidearm: null,
      masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null,
    },
    // Infos sur le build en cours d'édition (si chargé depuis la bibliothèque)
    editingInfo: null, // { type: 'local' | 'api', id: string, originalMetadata: {nom, description, tags} }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // On s'assure de fusionner avec les niveaux de la montre actuels 
      // pour que les changements dans la page Montre soient reflétés
      return { ...defaultState, ...parsed, shdLevels: getSHDLevels() }
    }
  } catch (e) {
    console.error("Failed to load build from localStorage", e)
  }
  return defaultState
}

const INITIAL_STATE = getInitialState()

function buildReducer(state, action) {
  switch (action.type) {
    case 'SET_SPECIAL_WEAPON': {
      return { ...state, specialWeapon: action.weapon }
    }
    case 'REMOVE_SPECIAL_WEAPON': {
      return { ...state, specialWeapon: null }
    }
    case 'SET_WEAPON': {
      const weapons = [...state.weapons]
      weapons[action.slot] = action.weapon
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = null
      const weaponAttributes = [...state.weaponAttributes]
      weaponAttributes[action.slot] = null
      const weaponMods = [...state.weaponMods]
      weaponMods[action.slot] = null
      const slotKey = `weapon${action.slot}`
      const weaponEssentialValues = { ...state.weaponEssentialValues, [slotKey]: {} }
      const prototypes = { ...state.prototypes, [slotKey]: false }
      const prototypeTalents = { ...state.prototypeTalents, [slotKey]: null }
      return { ...state, weapons, weaponTalents, weaponAttributes, weaponMods, weaponEssentialValues, prototypes, prototypeTalents }
    }
    case 'REMOVE_WEAPON': {
      const weapons = [...state.weapons]
      weapons[action.slot] = null
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = null
      const weaponAttributes = [...state.weaponAttributes]
      weaponAttributes[action.slot] = null
      const weaponMods = [...state.weaponMods]
      weaponMods[action.slot] = null
      const slotKey2 = `weapon${action.slot}`
      const weaponEssentialValues2 = { ...state.weaponEssentialValues, [slotKey2]: {} }
      const prototypes2 = { ...state.prototypes, [slotKey2]: false }
      const prototypeTalents2 = { ...state.prototypeTalents, [slotKey2]: null }
      return { ...state, weapons, weaponTalents, weaponAttributes, weaponMods, weaponEssentialValues: weaponEssentialValues2, prototypes: prototypes2, prototypeTalents: prototypeTalents2 }
    }
    case 'SET_WEAPON_TALENT': {
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = action.talent
      return { ...state, weaponTalents }
    }
    case 'SET_SIDEARM': {
      const wev = { ...state.weaponEssentialValues, sidearm: {} }
      const prototypes = { ...state.prototypes, sidearm: false }
      const prototypeTalents = { ...state.prototypeTalents, sidearm: null }
      return { ...state, sidearm: action.weapon, sidearmTalent: null, sidearmAttribute: null, sidearmMods: null, weaponEssentialValues: wev, prototypes, prototypeTalents }
    }
    case 'REMOVE_SIDEARM': {
      const wev2 = { ...state.weaponEssentialValues, sidearm: {} }
      const prototypes2 = { ...state.prototypes, sidearm: false }
      const prototypeTalents2 = { ...state.prototypeTalents, sidearm: null }
      return { ...state, sidearm: null, sidearmTalent: null, sidearmAttribute: null, sidearmMods: null, weaponEssentialValues: wev2, prototypes: prototypes2, prototypeTalents: prototypeTalents2 }
    }
    case 'SET_SIDEARM_TALENT': {
      return { ...state, sidearmTalent: action.talent }
    }
    case 'SET_GEAR': {
      const gear = { ...state.gear, [action.slot]: action.piece }
      const gearTalents = { ...state.gearTalents }
      if (action.slot === 'torse' || action.slot === 'sac_a_dos') {
        gearTalents[action.slot] = null
      }
      const gearAttributes = { ...state.gearAttributes }
      delete gearAttributes[action.slot]
      const gearMods = { ...state.gearMods }
      delete gearMods[action.slot]
      const prototypes = { ...state.prototypes, [action.slot]: false }
      const prototypeTalents = { ...state.prototypeTalents, [action.slot]: null }
      const gmvSet = { ...state.modValues.gearMods }
      delete gmvSet[action.slot]
      return { ...state, gear, gearTalents, gearAttributes, gearMods, prototypes, prototypeTalents, modValues: { ...state.modValues, gearMods: gmvSet } }
    }
    case 'REMOVE_GEAR': {
      const gear = { ...state.gear, [action.slot]: null }
      const gearTalents = { ...state.gearTalents }
      if (action.slot === 'torse' || action.slot === 'sac_a_dos') {
        gearTalents[action.slot] = null
      }
      const gearAttributes = { ...state.gearAttributes }
      delete gearAttributes[action.slot]
      const gearMods = { ...state.gearMods }
      delete gearMods[action.slot]
      const prototypes = { ...state.prototypes, [action.slot]: false }
      const prototypeTalents = { ...state.prototypeTalents, [action.slot]: null }
      const gmvRm = { ...state.modValues.gearMods }
      delete gmvRm[action.slot]
      return { ...state, gear, gearTalents, gearAttributes, gearMods, prototypes, prototypeTalents, modValues: { ...state.modValues, gearMods: gmvRm } }
    }
    case 'SET_GEAR_TALENT': {
      const gearTalents = { ...state.gearTalents, [action.slot]: action.talent }
      return { ...state, gearTalents }
    }
    case 'SET_SKILL': {
      const skills = [...state.skills]
      skills[action.slot] = action.skill
      const skillMods = [...state.skillMods]
      skillMods[action.slot] = null
      const smvSet = { ...state.modValues.skillMods }
      delete smvSet[action.slot]
      return { ...state, skills, skillMods, modValues: { ...state.modValues, skillMods: smvSet } }
    }
    case 'REMOVE_SKILL': {
      const skills = [...state.skills]
      skills[action.slot] = null
      const skillMods = [...state.skillMods]
      skillMods[action.slot] = null
      const smvRm = { ...state.modValues.skillMods }
      delete smvRm[action.slot]
      return { ...state, skills, skillMods, modValues: { ...state.modValues, skillMods: smvRm } }
    }
    // ---- Attributs d'arme (1 personnalisable par arme) ----
    case 'SET_WEAPON_ATTRIBUTE': {
      const weaponAttributes = [...state.weaponAttributes]
      weaponAttributes[action.slot] = action.attribute // {nom, slug, valeur}
      return { ...state, weaponAttributes }
    }
    case 'SET_SIDEARM_ATTRIBUTE': {
      return { ...state, sidearmAttribute: action.attribute }
    }
    // ---- Valeurs des attributs essentiels d'arme ----
    case 'SET_WEAPON_ESSENTIAL_VALUE': {
      // action: { slotKey: 'weapon0'|'weapon1'|'sidearm', slug, valeur }
      const weaponEssentialValues = { ...state.weaponEssentialValues }
      weaponEssentialValues[action.slotKey] = {
        ...(weaponEssentialValues[action.slotKey] || {}),
        [action.slug]: action.valeur,
      }
      return { ...state, weaponEssentialValues }
    }
    // ---- Mods d'arme ----
    case 'SET_WEAPON_MODS': {
      const weaponMods = [...state.weaponMods]
      weaponMods[action.slot] = action.mods
      return { ...state, weaponMods }
    }
    case 'SET_SIDEARM_MODS': {
      return { ...state, sidearmMods: action.mods }
    }
    // ---- Attributs d'équipement ----
    case 'SET_GEAR_ATTRIBUTES': {
      const gearAttributes = { ...state.gearAttributes, [action.slot]: action.attributes }
      return { ...state, gearAttributes }
    }
    case 'SET_GEAR_MOD': {
      // action: { slot: string, modIndex: number, mod: object }
      const currentMods = state.gearMods[action.slot] || []
      const newMods = [...currentMods]
      newMods[action.modIndex || 0] = action.mod
      const gearMods = { ...state.gearMods, [action.slot]: newMods }
      // Reset mod values for this slot+index when mod changes
      const gmv = { ...state.modValues.gearMods }
      if (gmv[action.slot]) {
        const slotVals = { ...gmv[action.slot] }
        delete slotVals[action.modIndex || 0]
        gmv[action.slot] = slotVals
      }
      return { ...state, gearMods, modValues: { ...state.modValues, gearMods: gmv } }
    }
    // ---- Mods de compétence ----
    case 'SET_SKILL_MOD': {
      const skillMods = [...state.skillMods]
      skillMods[action.slot] = action.mod
      // Reset mod values for this skill slot when mod changes
      const smv = { ...state.modValues.skillMods }
      delete smv[action.slot]
      return { ...state, skillMods, modValues: { ...state.modValues, skillMods: smv } }
    }
    case 'SET_GEAR_MOD_VALUE': {
      // action: { slot, modIndex, attrSlug, valeur }
      const gmv2 = { ...state.modValues.gearMods }
      gmv2[action.slot] = { ...(gmv2[action.slot] || {}) }
      gmv2[action.slot][action.modIndex] = { ...(gmv2[action.slot][action.modIndex] || {}), [action.attrSlug]: action.valeur }
      return { ...state, modValues: { ...state.modValues, gearMods: gmv2 } }
    }
    case 'SET_SKILL_MOD_VALUE': {
      // action: { slot, attrSlug, valeur }
      const smv2 = { ...state.modValues.skillMods }
      smv2[action.slot] = { ...(smv2[action.slot] || {}), [action.attrSlug]: action.valeur }
      return { ...state, modValues: { ...state.modValues, skillMods: smv2 } }
    }
    case 'SET_EXPERTISE_LEVEL': {
      const expertise = { ...state.expertise, [action.slot]: Math.max(0, Math.min(20, action.level)) }
      return { ...state, expertise }
    }
    case 'SET_PROTOTYPE_TALENT': {
      const prototypeTalents = { ...state.prototypeTalents, [action.slot]: action.talent }
      return { ...state, prototypeTalents }
    }
    case 'SET_SHD_LEVEL': {
      const shdLevels = { ...state.shdLevels, [action.stat]: Math.max(0, Math.min(50, action.level)) }
      return { ...state, shdLevels }
    }
    case 'REFRESH_SHD_LEVELS': {
      return { ...state, shdLevels: getSHDLevels() }
    }
    case 'LOAD_BUILD': {
      const shdFromBuild = action.build.shdLevels || {};
      const mergedShd = { ...getSHDLevels(), ...shdFromBuild };
      return { ...INITIAL_STATE, ...action.build, editingInfo: action.editingInfo || null, shdLevels: mergedShd }
    }
    case 'SET_EDITING_INFO':
      return { ...state, editingInfo: action.editingInfo }
    case 'CLEAR_EDITING_INFO':
      return { ...state, editingInfo: null }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

export function BuildProvider({ children, classSpe, maxExpertiseLevel = 20 }) {
  const [state, dispatch] = useReducer((state, action) => {
    // Wrap the reducer to inject maxExpertiseLevel
    if (action.type === 'SET_EXPERTISE_LEVEL') {
      const expertise = { ...state.expertise, [action.slot]: Math.max(0, Math.min(maxExpertiseLevel, action.level)) }
      return { ...state, expertise }
    }
    if (action.type === 'SET_PROTOTYPE') {
      const prototypes = { ...state.prototypes, [action.slot]: action.active }
      const expertise = { ...state.expertise }
      const prototypeTalents = { ...state.prototypeTalents }
      if (action.active) {
        expertise[action.slot] = maxExpertiseLevel
      } else {
        prototypeTalents[action.slot] = null
      }
      return { ...state, prototypes, expertise, prototypeTalents }
    }
    return buildReducer(state, action)
  }, INITIAL_STATE)

  // Initialize specialisation cache from data
  const SPECIALISATIONS = useMemo(() => getSpecialisations(classSpe), [classSpe])

  // Spécialisation déduite de l'arme spécifique
  const specialisation = useMemo(
    () => getSpecFromWeapon(state.specialWeapon?.nom, classSpe),
    [state.specialWeapon, classSpe]
  )

  // Écouter les mises à jour de la montre SHD depuis le localStorage (page SHDWatch)
  useEffect(() => {
    const handleUpdate = () => {
      dispatch({ type: 'REFRESH_SHD_LEVELS' })
    };
    window.addEventListener('shd-levels-updated', handleUpdate);
    return () => window.removeEventListener('shd-levels-updated', handleUpdate);
  }, [dispatch]);

  // Sauvegarder le build dans le localStorage à chaque changement
  useEffect(() => {
    // On ne veut pas sauvegarder un state vide ou initial si on vient de charger
    if (state !== INITIAL_STATE) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  // Contraintes exotiques — armes classiques + arme de poing
  const hasExoticWeapon = state.weapons.some(w => w?.estExotique) || state.sidearm?.estExotique
  const hasExoticGear = Object.values(state.gear).some(g => g?.type === 'exotique')

  // Compétences déjà utilisées (par type)
  const usedSkillTypes = state.skills.filter(Boolean).map(s => s.competence)

  const canEquipExoticWeapon = useCallback((slot) => {
    if (!hasExoticWeapon) return true
    return state.weapons[slot]?.estExotique === true
  }, [hasExoticWeapon, state.weapons])

  const canEquipExoticSidearm = useCallback(() => {
    if (!hasExoticWeapon) return true
    return state.sidearm?.estExotique === true
  }, [hasExoticWeapon, state.sidearm])

  const canEquipExoticGear = useCallback((slot) => {
    if (!hasExoticGear) return true
    return state.gear[slot]?.type === 'exotique'
  }, [hasExoticGear, state.gear])

  const canEquipSkill = useCallback((skill, slot) => {
    // Contrainte : pas deux compétences du même type
    const otherSlot = slot === 0 ? 1 : 0
    const otherSkill = state.skills[otherSlot]
    if (otherSkill && otherSkill.competence === skill.competence) return false
    return true
  }, [state.skills])

  // Vérifie si une compétence nécessite une spécialisation spécifique
  const skillNeedsSpec = useCallback((skill) => {
    // Utilise uniquement le champ prerequis depuis les données
    const required = skill.prerequis
    if (!required) return null // pas de spé requise
    if (required === specialisation) return null // spé correcte
    return required // retourne la spé manquante
  }, [specialisation])

  const value = {
    ...state,
    dispatch,
    specialisation,
    SPECIALISATIONS,
    classSpe,
    maxExpertiseLevel,
    hasExoticWeapon,
    hasExoticGear,
    canEquipExoticWeapon,
    canEquipExoticSidearm,
    canEquipExoticGear,
    canEquipSkill,
    skillNeedsSpec,
    usedSkillTypes,
  }

  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>
}

export function useBuild() {
  const ctx = useContext(BuildContext)
  if (!ctx) throw new Error('useBuild must be inside BuildProvider')
  return ctx
}