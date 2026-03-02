/**
 * Script pour matcher automatiquement les talents avec leurs fichiers d'icônes.
 * Mapping FR → fichier EN basé sur les noms connus du jeu.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'src', 'data')

function readJ(f) {
  return JSON.parse(readFileSync(join(DATA, f), 'utf8').replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, ''))
}
function writeJ(f, d, c) {
  writeFileSync(join(DATA, f), `// ${c}\n` + JSON.stringify(d, null, 2) + '\n', 'utf8')
}

// ================================================================
// Mapping nom français → slug fichier icône (talents d'armes classiques)
// ================================================================
const TALENT_ARME_MAP = {
  'Tir déstabilisant': 'breadbasket',
  'Tueur': 'killer',
  'Préservation': 'preservation',
  'Optimiste': 'optimist',
  'Contrainte': 'strained',
  'Corps à corps': 'close_and_personal',
  'Mains rapides': 'fast_hands',
  'Sadique': 'sadist',
  'Vindicatif': 'vindicative',
  'Ranger': 'ranger',
  'Main ferme': 'jazz_hands',
  'Pointe': 'spike',
  'Réalisme': 'naked',
  'Inflammabilité': 'ignited',
  'Perpétuation': 'perpetuation',
  'Reformation': 'reformation',
  'Futur Parfait': 'future_perfect',
  'Synchro': 'in_sync',
  'Ligne plate': 'flatline',
  'Fusilier': 'rifleman',
  'Boomerang': 'boomerang',
  'Tir chanceux': 'lucky_shot',
  'Myope': 'near_sighted',
  'A vide': 'on_empty',
  'Mesure': 'measured',
  'Surcapacité': 'overflowing',
  'Nudité': 'naked',
  'Premier sang': 'first_blood',
  'Martèlement': 'pummel',
  'Motivé': 'pumped_up',
  'Outsider': 'outsider',
  'Indéfectible': 'unwavering',
  'Déséquilibre': 'unhinged',
  'Frénésie': 'frenzy',
  'Accablement': 'overwhelm',
  'Débarras': 'salvage',
  'Finisseur': 'finisher',
  'Coup de massue': 'sledgehammer',
  'Résolu': 'determined',
  'Coup de tonnerre': 'thunder_strike',
  'Stablilisation': 'stabilize',
  'Stabilisation': 'stabilize',
  'Derrière toi': 'behind_you',
  'Imprudence': 'brazen',
  'Frappe de précision': 'precision_strike',
  'Point de pression': 'primer_rounds',
  'Rationalisation': 'optimized',
  'Petit faible': 'eyeless',
  'Immobilisation': 'steady_handed',
  // Extras (si noms avec accents cassés)
  'Tir dstabilisant': 'breadbasket',
  'Prservation': 'preservation',
  'Ralisme': 'naked',
  'Inflammabilit': 'ignited',
  'Perptuation': 'perpetuation',
  'Drire toi': 'behind_you',
  'Dsquilibre': 'unhinged',
  'Frnsie': 'frenzy',
  'Dbarras': 'salvage',
  'Rsolu': 'determined',
  'Indfectible': 'unwavering',
  'Surcapacit': 'overflowing',
  'Nudit': 'naked',
  'Martlement': 'pummel',
  'Motiv': 'pumped_up',
  'Stablilisation': 'stabilize',
  'Imprudence': 'brazen',
  'Frappe de prcision': 'precision_strike',
  'Rationalisation': 'optimized',
}

// ================================================================
// Appliquer aux talents d'armes
// ================================================================
let talents = readJ('talents-armes.jsonc')
let fixes = 0

talents.forEach(t => {
  if (!t.icone || t.icone === '') {
    const slug = TALENT_ARME_MAP[t.nom]
    if (slug) {
      t.icone = slug
      fixes++
      console.log(`  ✓ "${t.nom}" → ${slug}`)
    } else {
      console.log(`  ✗ "${t.nom}" — pas de match`)
    }
  }
})

console.log(`\n${fixes} talents d'armes mis à jour`)
writeJ('talents-armes.jsonc', talents, "Talents d'armes \u2014 The Division 2")
console.log('Sauvegardé!')

