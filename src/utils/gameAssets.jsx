/**
 * Mapping centralisé des assets visuels du jeu.
 * Les images dans src/img/game_assets/ sont importées statiquement par Vite,
 * ce qui garantit le bon fonctionnement en dev et en build (hash, base URL, etc.)
 *
 * Pour ajouter un nouvel asset : importer l'image et l'ajouter au mapping correspondant.
 */

// ================================================================
// ICÔNES TYPE D'ARME
// ================================================================
import arme_fusil_assaut from '../img/game_assets/armes/fusil_assaut.png'
import arme_fusil from '../img/game_assets/armes/fusil.png'
import arme_sniper from '../img/game_assets/armes/sniper.png'
import arme_pistolet_mitrailleur from '../img/game_assets/armes/pistolet_mitrailleur.png'
import arme_lmg from '../img/game_assets/armes/lmg_TODO.png'
import arme_calibre12 from '../img/game_assets/armes/calibre12.png'
import arme_pistolet from '../img/game_assets/armes/pistolet.png'

export const WEAPON_TYPE_ICONS = {
  fusil_assaut: arme_fusil_assaut,
  fusil: arme_fusil,
  fusil_precision: arme_sniper,
  pistolet_mitrailleur: arme_pistolet_mitrailleur,
  fusil_mitrailleur: arme_lmg,
  calibre_12: arme_calibre12,
  pistolet: arme_pistolet,
}

// ================================================================
// ICÔNES TYPE D'ÉQUIPEMENT
// ================================================================
import equip_masque from '../img/game_assets/equipements/masque.png'
import equip_torse from '../img/game_assets/equipements/torse.png'
import equip_holster from '../img/game_assets/equipements/holster.png'
import equip_sac from '../img/game_assets/equipements/sac.png'
import equip_gants from '../img/game_assets/equipements/gants.png'
import equip_genouilleres from '../img/game_assets/equipements/genouilleres.png'

export const GEAR_SLOT_ICONS_IMG = {
  masque: equip_masque,
  torse: equip_torse,
  holster: equip_holster,
  sac_a_dos: equip_sac,
  gants: equip_gants,
  genouilleres: equip_genouilleres,
}

// ================================================================
// ICÔNES ATTRIBUTS (offensif / défensif / compétences)
// ================================================================
import attr_offensif from '../img/game_assets/equipements/attribute/offensif.png'
import attr_defensif from '../img/game_assets/equipements/attribute/deffensif.png'
import attr_competences from '../img/game_assets/equipements/attribute/competances.png'

export const ATTRIBUTE_ICONS = {
  degats: attr_offensif,
  offensif: attr_offensif,
  protection: attr_defensif,
  defensif: attr_defensif,
  competences: attr_competences,
}

/**
 * Résout l'icône d'attribut à partir d'un texte libre.
 * Cherche des mots-clés dans le texte pour déterminer la catégorie.
 */
export function resolveAttributeIcon(text) {
  if (!text) return null
  const t = text.toLowerCase()
  if (t.includes('dégât') || t.includes('degat') || t.includes('dgts') || t.includes('dgat')
    || t.includes('offensi') || t.includes('critique') || t.includes('headshot')
    || t.includes('arme') || t === 'degats') {
    return attr_offensif
  }
  if (t.includes('protect') || t.includes('armure') || t.includes('défensi') || t.includes('defensi')
    || t.includes('vie') || t.includes('santé') || t.includes('sant') || t === 'protection') {
    return attr_defensif
  }
  if (t.includes('compétence') || t.includes('competence') || t.includes('comptence')
    || t.includes('hâte') || t.includes('hate') || t.includes('réparation') || t.includes('reparation')
    || t === 'competences') {
    return attr_competences
  }
  return null
}

// ================================================================
// ICÔNES TALENTS D'ARMES
// ================================================================
import accurate from '../img/game_assets/talents/arme/accurate.png'
import allegro from '../img/game_assets/talents/arme/allegro.png'
import behind_you from '../img/game_assets/talents/arme/behind_you.png'
import boomerang from '../img/game_assets/talents/arme/boomerang.png'
import brazen from '../img/game_assets/talents/arme/brazen.png'
import breadbasket from '../img/game_assets/talents/arme/breadbasket.png'
import close_and_personal from '../img/game_assets/talents/arme/close_and_personal.png'
import determined from '../img/game_assets/talents/arme/determined.png'
import distance from '../img/game_assets/talents/arme/distance.png'
import extra from '../img/game_assets/talents/arme/extra.png'
import eyeless from '../img/game_assets/talents/arme/eyeless.png'
import fast_hands from '../img/game_assets/talents/arme/fast_hands.png'
import finisher from '../img/game_assets/talents/arme/finisher.png'
import first_blood from '../img/game_assets/talents/arme/first_blood.png'
import flatline from '../img/game_assets/talents/arme/flatline.png'
import frenzy from '../img/game_assets/talents/arme/frenzy.png'
import future_perfect from '../img/game_assets/talents/arme/future_perfect.png'
import hidden_rock from '../img/game_assets/talents/arme/hidden_rock.png'
import ignited from '../img/game_assets/talents/arme/ignited.png'
import in_sync from '../img/game_assets/talents/arme/in_sync.png'
import jazz_hands from '../img/game_assets/talents/arme/jazz_hands.png'
import killer from '../img/game_assets/talents/arme/killer.png'
import lucky_shot from '../img/game_assets/talents/arme/lucky_shot.png'
import measured from '../img/game_assets/talents/arme/measured.png'
import naked from '../img/game_assets/talents/arme/naked.png'
import near_sighted from '../img/game_assets/talents/arme/near_sighted.png'
import on_empty from '../img/game_assets/talents/arme/on_empty.png'
import optimist from '../img/game_assets/talents/arme/optimist.png'
import optimized from '../img/game_assets/talents/arme/optimized.png'
import outsider from '../img/game_assets/talents/arme/outsider.png'
import overflowing from '../img/game_assets/talents/arme/overflowing.png'
import overwhelm from '../img/game_assets/talents/arme/overwhelm.png'
import perpetuation from '../img/game_assets/talents/arme/perpetuation.png'
import precision_strike from '../img/game_assets/talents/arme/precision_strike.png'
import preservation from '../img/game_assets/talents/arme/preservation.png'
import primer_rounds from '../img/game_assets/talents/arme/primer_rounds.png'
import pummel from '../img/game_assets/talents/arme/pummel.png'
import pumped_up from '../img/game_assets/talents/arme/pumped_up.png'
import ranger from '../img/game_assets/talents/arme/ranger.png'
import reformation from '../img/game_assets/talents/arme/reformation.png'
import rifleman from '../img/game_assets/talents/arme/rifleman.png'
import sadist from '../img/game_assets/talents/arme/sadist.png'
import salvage from '../img/game_assets/talents/arme/salvage.png'
import sledgehammer from '../img/game_assets/talents/arme/sledgehammer.png'
import spike from '../img/game_assets/talents/arme/spike.png'
import stabilize from '../img/game_assets/talents/arme/stabilize.png'
import steady_handed from '../img/game_assets/talents/arme/steady_handed.png'
import strained from '../img/game_assets/talents/arme/strained.png'
import swift from '../img/game_assets/talents/arme/swift.png'
import thunder_strike from '../img/game_assets/talents/arme/thunder_strike.png'
import twinkling_lights from '../img/game_assets/talents/arme/twinkling_lights.png'
import unhinged from '../img/game_assets/talents/arme/unhinged.png'
import unwavering from '../img/game_assets/talents/arme/unwavering.png'
import vindicative from '../img/game_assets/talents/arme/vindicative.png'

// Talents exotiques
import actum_est from '../img/game_assets/talents/arme/exotiques/actum_est.png'
import adaptive_instincts from '../img/game_assets/talents/arme/exotiques/adaptive_instincts.png'
import agonizing_bite from '../img/game_assets/talents/arme/exotiques/agonizing_bite.png'
import ardent from '../img/game_assets/talents/arme/exotiques/ardent.png'
import big_game_hunter from '../img/game_assets/talents/arme/exotiques/big_game_hunter.png'
import binary_trigger from '../img/game_assets/talents/arme/exotiques/binary_trigger.png'
import breathe_free from '../img/game_assets/talents/arme/exotiques/breathe_free.png'
import bullet_hell from '../img/game_assets/talents/arme/exotiques/bullet_hell.png'
import busy_little_bee from '../img/game_assets/talents/arme/exotiques/busy_little_bee.png'
import capacitance from '../img/game_assets/talents/arme/exotiques/capacitance.png'
import capitulate from '../img/game_assets/talents/arme/exotiques/capitulate.png'
import disruptor_rounds from '../img/game_assets/talents/arme/exotiques/disruptor_rounds.png'
import doctor_home from '../img/game_assets/talents/arme/exotiques/doctor_home.png'
import eagle_strike from '../img/game_assets/talents/arme/exotiques/eagle_strike.png'
import electromagnetic_accelerator from '../img/game_assets/talents/arme/exotiques/electromagnetic_accelerator.png'
import full_stop from '../img/game_assets/talents/arme/exotiques/full_stop.png'
import geri_and_freki from '../img/game_assets/talents/arme/exotiques/geri_and_freki.png'
import incessant_chatter from '../img/game_assets/talents/arme/exotiques/incessant_chatter.png'
import liberty_or_death from '../img/game_assets/talents/arme/exotiques/liberty_or_death.png'
import mosquito_song from '../img/game_assets/talents/arme/exotiques/mosquito_song.png'
import ortiz_assault_interface from '../img/game_assets/talents/arme/exotiques/ortiz_assault_interface.png'
import payment_in_kind from '../img/game_assets/talents/arme/exotiques/payment_in_kind.png'
import plague_of_the_outcasts from '../img/game_assets/talents/arme/exotiques/plague_of_the_outcasts.png'
import regicide_mantis from '../img/game_assets/talents/arme/exotiques/regicide_mantis.png'
import regicide_regulus from '../img/game_assets/talents/arme/exotiques/regicide_regulus.png'
import rule_them_all from '../img/game_assets/talents/arme/exotiques/rule_them_all.png'
import sandman from '../img/game_assets/talents/arme/exotiques/sandman.png'
import septic_shock from '../img/game_assets/talents/arme/exotiques/septic_shock.png'
import tenacity from '../img/game_assets/talents/arme/exotiques/tenacity.png'
import the_trap from '../img/game_assets/talents/arme/exotiques/the_trap.png'
import unnerve from '../img/game_assets/talents/arme/exotiques/unnerve.png'

/**
 * Index des talents d'armes par slug de fichier.
 * La clé correspond au nom de fichier (sans .png) dans game_assets/talents/arme/.
 * Pour associer un talent à son icône, ajouter "icone": "nom_fichier" dans le JSONC.
 */
export const WEAPON_TALENT_ICONS = {
  accurate, allegro, behind_you, boomerang, brazen, breadbasket,
  close_and_personal, determined, distance, extra, eyeless, fast_hands,
  finisher, first_blood, flatline, frenzy, future_perfect, hidden_rock,
  ignited, in_sync, jazz_hands, killer, lucky_shot, measured,
  naked, near_sighted, on_empty, optimist, optimized, outsider,
  overflowing, overwhelm, perpetuation, precision_strike, preservation,
  primer_rounds, pummel, pumped_up, ranger, reformation, rifleman,
  sadist, salvage, sledgehammer, spike, stabilize, steady_handed,
  strained, swift, thunder_strike, twinkling_lights, unhinged, unwavering,
  vindicative,
  // Exotiques
  actum_est, adaptive_instincts, agonizing_bite, ardent, big_game_hunter,
  binary_trigger, breathe_free, bullet_hell, busy_little_bee, capacitance,
  capitulate, disruptor_rounds, doctor_home, eagle_strike,
  electromagnetic_accelerator, full_stop, geri_and_freki, incessant_chatter,
  liberty_or_death, mosquito_song, ortiz_assault_interface, payment_in_kind,
  plague_of_the_outcasts, regicide_mantis, regicide_regulus, rule_them_all,
  sandman, septic_shock, tenacity, the_trap, unnerve,
}

/**
 * Composant image réutilisable avec fallback transparent si l'image n'est pas trouvée.
 */
export function GameIcon({ src, alt = '', size = 'w-5 h-5', className = '' }) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={`${size} object-contain shrink-0 ${className}`}
      onError={(e) => { e.target.style.display = 'none' }}
    />
  )
}

