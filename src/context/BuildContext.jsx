import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { getSpecFromWeapon, getSpecialisations } from '../utils/formatters'

const BuildContext = createContext(null)

const INITIAL_STATE = {
  // Arme spécifique (signature) — détermine la spécialisation
  specialWeapon: null,
  // Armes classiques : primaire, secondaire
  weapons: [null, null],
  weaponTalents: [null, null],
  // Attributs armes : [{nom, valeur}] par slot (0=primaire, 1=secondaire, 'sidearm'=poing)
  weaponAttributes: [null, null],
  sidearmAttribute: null,
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
  // Mods d'équipements : { slot: mod_object }
  gearMods: {},
  // Compétences
  skills: [null, null],
  // Mods de compétences : [mod_object, mod_object]
  skillMods: [null, null],
}

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
      return { ...state, weapons, weaponTalents, weaponAttributes, weaponMods }
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
      return { ...state, weapons, weaponTalents, weaponAttributes, weaponMods }
    }
    case 'SET_WEAPON_TALENT': {
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = action.talent
      return { ...state, weaponTalents }
    }
    case 'SET_SIDEARM': {
      return { ...state, sidearm: action.weapon, sidearmTalent: null, sidearmAttribute: null, sidearmMods: null }
    }
    case 'REMOVE_SIDEARM': {
      return { ...state, sidearm: null, sidearmTalent: null, sidearmAttribute: null, sidearmMods: null }
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
      return { ...state, gear, gearTalents, gearAttributes, gearMods }
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
      return { ...state, gear, gearTalents, gearAttributes, gearMods }
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
      return { ...state, skills, skillMods }
    }
    case 'REMOVE_SKILL': {
      const skills = [...state.skills]
      skills[action.slot] = null
      const skillMods = [...state.skillMods]
      skillMods[action.slot] = null
      return { ...state, skills, skillMods }
    }
    // ---- Attributs d'arme (1 personnalisable par arme) ----
    case 'SET_WEAPON_ATTRIBUTE': {
      const weaponAttributes = [...state.weaponAttributes]
      weaponAttributes[action.slot] = action.attribute // {nom, valeur}
      return { ...state, weaponAttributes }
    }
    case 'SET_SIDEARM_ATTRIBUTE': {
      return { ...state, sidearmAttribute: action.attribute }
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
      const gearMods = { ...state.gearMods, [action.slot]: action.mod }
      return { ...state, gearMods }
    }
    // ---- Mods de compétence ----
    case 'SET_SKILL_MOD': {
      const skillMods = [...state.skillMods]
      skillMods[action.slot] = action.mod
      return { ...state, skillMods }
    }
    case 'LOAD_BUILD':
      return { ...INITIAL_STATE, ...action.build }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

export function BuildProvider({ children, classSpe }) {
  const [state, dispatch] = useReducer(buildReducer, INITIAL_STATE)

  // Initialize specialisation cache from data
  const SPECIALISATIONS = useMemo(() => getSpecialisations(classSpe), [classSpe])

  // Spécialisation déduite de l'arme spécifique
  const specialisation = useMemo(
    () => getSpecFromWeapon(state.specialWeapon?.nom, classSpe),
    [state.specialWeapon, classSpe]
  )

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
