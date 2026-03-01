import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { getSpecFromWeapon, getSkillRequiredSpec } from '../utils/formatters'

const BuildContext = createContext(null)

const INITIAL_STATE = {
  // Arme spécifique (signature) — détermine la spécialisation
  specialWeapon: null,
  // Armes classiques : primaire, secondaire
  weapons: [null, null],
  weaponTalents: [null, null],
  // Arme de poing
  sidearm: null,
  sidearmTalent: null,
  // Équipements
  gear: { masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null },
  gearTalents: { torse: null, sac_a_dos: null },
  // Compétences
  skills: [null, null],
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
      return { ...state, weapons, weaponTalents }
    }
    case 'REMOVE_WEAPON': {
      const weapons = [...state.weapons]
      weapons[action.slot] = null
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = null
      return { ...state, weapons, weaponTalents }
    }
    case 'SET_WEAPON_TALENT': {
      const weaponTalents = [...state.weaponTalents]
      weaponTalents[action.slot] = action.talent
      return { ...state, weaponTalents }
    }
    case 'SET_SIDEARM': {
      return { ...state, sidearm: action.weapon, sidearmTalent: null }
    }
    case 'REMOVE_SIDEARM': {
      return { ...state, sidearm: null, sidearmTalent: null }
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
      return { ...state, gear, gearTalents }
    }
    case 'REMOVE_GEAR': {
      const gear = { ...state.gear, [action.slot]: null }
      const gearTalents = { ...state.gearTalents }
      if (action.slot === 'torse' || action.slot === 'sac_a_dos') {
        gearTalents[action.slot] = null
      }
      return { ...state, gear, gearTalents }
    }
    case 'SET_GEAR_TALENT': {
      const gearTalents = { ...state.gearTalents, [action.slot]: action.talent }
      return { ...state, gearTalents }
    }
    case 'SET_SKILL': {
      const skills = [...state.skills]
      skills[action.slot] = action.skill
      return { ...state, skills }
    }
    case 'REMOVE_SKILL': {
      const skills = [...state.skills]
      skills[action.slot] = null
      return { ...state, skills }
    }
    case 'LOAD_BUILD':
      return { ...INITIAL_STATE, ...action.build }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

export function BuildProvider({ children }) {
  const [state, dispatch] = useReducer(buildReducer, INITIAL_STATE)

  // Spécialisation déduite de l'arme spécifique
  const specialisation = useMemo(
    () => getSpecFromWeapon(state.specialWeapon?.nom),
    [state.specialWeapon]
  )

  // Contraintes exotiques — armes classiques + arme de poing
  const hasExoticWeapon = state.weapons.some(w => w?.estExotique) || state.sidearm?.estExotique
  const hasExoticGear = Object.values(state.gear).some(g => g?.estExotique)

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
    return state.gear[slot]?.estExotique === true
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
    const required = getSkillRequiredSpec(skill.variante)
    if (!required) return null // pas de spé requise
    if (required === specialisation) return null // spé correcte
    return required // retourne la spé manquante
  }, [specialisation])

  const value = {
    ...state,
    dispatch,
    specialisation,
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
