/**
 * Script pour renommer les fichiers d'icônes de talents EN → FR (snake_case, sans accents)
 * et mettre à jour les champs "icone" dans les JSONC.
 */
import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'src', 'data')
const ASSETS = join(__dirname, '..', 'src', 'img', 'game_assets')

function readJ(f) {
  return JSON.parse(readFileSync(join(DATA, f), 'utf8').replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, ''))
}
function writeJ(f, d, c) {
  writeFileSync(join(DATA, f), `// ${c}\n` + JSON.stringify(d, null, 2) + '\n', 'utf8')
}

/** Retire les accents et convertit en snake_case */
function toSlug(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retire accents
    .toLowerCase()
    .replace(/['']/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ================================================================
// Mapping fichier EN → slug FR pour les talents d'armes classiques
// ================================================================
const RENAME_MAP = {
  // Talents présents dans talents-armes.jsonc
  'breadbasket':      'tir_destabilisant',
  'killer':           'tueur',
  'preservation':     'preservation',
  'optimist':         'optimiste',
  'strained':         'contrainte',
  'close_and_personal':'corps_a_corps',
  'fast_hands':       'mains_rapides',
  'sadist':           'sadique',
  'vindicative':      'vindicatif',
  'ranger':           'ranger',
  'jazz_hands':       'main_ferme',
  'spike':            'pointe',
  'naked':            'realisme',
  'ignited':          'inflammabilite',
  'perpetuation':     'perpetuation',
  'reformation':      'reformation',
  'future_perfect':   'futur_parfait',
  'in_sync':          'synchro',
  'flatline':         'ligne_plate',
  'rifleman':         'fusilier',
  'boomerang':        'boomerang',
  'lucky_shot':       'tir_chanceux',
  'near_sighted':     'myope',
  'on_empty':         'a_vide',
  'measured':         'mesure',
  'overflowing':      'surcapacite',
  'first_blood':      'premier_sang',
  'pummel':           'martelement',
  'pumped_up':        'motive',
  'outsider':         'outsider',
  'unwavering':       'indefectible',
  'unhinged':         'desequilibre',
  'frenzy':           'frenesie',
  'overwhelm':        'accablement',
  'salvage':          'debarras',
  'finisher':         'finisseur',
  'sledgehammer':     'coup_de_massue',
  'determined':       'resolu',
  'thunder_strike':   'coup_de_tonnerre',
  'stabilize':        'stabilisation',
  'behind_you':       'derriere_toi',
  'brazen':           'imprudence',
  'precision_strike': 'frappe_de_precision',
  'primer_rounds':    'point_de_pression',
  'optimized':        'rationalisation',
  'eyeless':          'petit_faible',
  'steady_handed':    'immobilisation',
  // Fichiers non référencés dans les talents mais présents comme icônes
  'accurate':         'precision',
  'allegro':          'allegro',
  'distance':         'distance',
  'extra':            'extra',
  'hidden_rock':      'pierre_cachee',
  'swift':            'rapidite',
  'twinkling_lights': 'lumieres_scintillantes',
}

// ================================================================
// Mapping fichier EN → slug FR pour les talents exotiques
// ================================================================
const EXOTIC_RENAME_MAP = {
  'actum_est':                    'actum_est',
  'adaptive_instincts':           'instincts_adaptatifs',
  'agonizing_bite':               'morsure_atroce',
  'ardent':                       'ardent',
  'big_game_hunter':              'chasseur_de_gros_gibier',
  'binary_trigger':               'gachette_binaire',
  'breathe_free':                 'respirer_librement',
  'bullet_hell':                  'enfer_de_balles',
  'busy_little_bee':              'petite_abeille_ouvriere',
  'capacitance':                  'capacitance',
  'capitulate':                   'capitulation',
  'disruptor_rounds':             'munitions_disruptives',
  'doctor_home':                  'docteur_maison',
  'eagle_strike':                 'frappe_de_l_aigle',
  'electromagnetic_accelerator':  'accelerateur_electromagnetique',
  'full_stop':                    'point_final',
  'geri_and_freki':               'geri_et_freki',
  'incessant_chatter':            'bavardage_incessant',
  'liberty_or_death':             'liberte_ou_mort',
  'mosquito_song':                'chant_du_moustique',
  'ortiz_assault_interface':      'interface_assaut_ortiz',
  'payment_in_kind':              'paiement_en_nature',
  'plague_of_the_outcasts':       'fleau_des_parias',
  'regicide_mantis':              'regicide_mantis',
  'regicide_regulus':             'regicide_regulus',
  'rule_them_all':                'les_gouverner_tous',
  'sandman':                      'marchand_de_sable',
  'septic_shock':                 'choc_septique',
  'tenacity':                     'tenacite',
  'the_trap':                     'le_piege',
  'unnerve':                      'destabiliser',
}

// ================================================================
// Renommer les fichiers
// ================================================================
function renameFiles(dir, map) {
  let count = 0
  for (const [oldName, newName] of Object.entries(map)) {
    if (oldName === newName) continue
    const oldPath = join(dir, `${oldName}.png`)
    const newPath = join(dir, `${newName}.png`)
    if (!existsSync(oldPath)) {
      console.log(`  ⚠ Fichier introuvable: ${oldName}.png`)
      continue
    }
    if (existsSync(newPath) && oldPath !== newPath) {
      console.log(`  ⚠ Conflit: ${newName}.png existe déjà, skip`)
      continue
    }
    renameSync(oldPath, newPath)
    console.log(`  ✓ ${oldName}.png → ${newName}.png`)
    count++
  }
  return count
}

console.log('=== Talents d\'armes classiques ===')
const classiquesDir = join(ASSETS, 'talents', 'arme')
const c1 = renameFiles(classiquesDir, RENAME_MAP)
console.log(`  ${c1} fichiers renommés\n`)

console.log('=== Talents d\'armes exotiques ===')
const exotiquesDir = join(ASSETS, 'talents', 'arme', 'exotiques')
const c2 = renameFiles(exotiquesDir, EXOTIC_RENAME_MAP)
console.log(`  ${c2} fichiers renommés\n`)

// ================================================================
// Mettre à jour les champs "icone" dans talents-armes.jsonc
// ================================================================
console.log('=== Mise à jour talents-armes.jsonc ===')
let talents = readJ('talents-armes.jsonc')
let updates = 0
talents.forEach(t => {
  if (t.icone && RENAME_MAP[t.icone]) {
    const newSlug = RENAME_MAP[t.icone]
    if (newSlug !== t.icone) {
      console.log(`  ✓ "${t.nom}": ${t.icone} → ${newSlug}`)
      t.icone = newSlug
      updates++
    }
  }
})
// Cas spécial: "Nudité" utilise aussi "naked" → "realisme", mais c'est le même fichier
// Nudité doit avoir son propre slug
const nudite = talents.find(t => t.nom === 'Nudité')
if (nudite) {
  // Nudité est en fait un talent différent de Réalisme mais partageait la même icône naked
  // On garde "realisme" pour les deux car c'est le même fichier
  // Si on veut séparer, il faudra dupliquer l'image
  nudite.icone = 'realisme'
  console.log(`  ✓ "Nudité": naked → realisme (même fichier)`)
}
writeJ('talents-armes.jsonc', talents, "Talents d'armes — The Division 2")
console.log(`  ${updates} icônes mises à jour\n`)

// ================================================================
// Mettre à jour les champs "icone" dans armes.jsonc (armes exotiques/nommées)
// ================================================================
console.log('=== Mise à jour armes.jsonc ===')
let armes = readJ('armes.jsonc')
let armesUpdates = 0
armes.forEach(a => {
  if (a.icone) {
    const newSlug = RENAME_MAP[a.icone] || EXOTIC_RENAME_MAP[a.icone]
    if (newSlug && newSlug !== a.icone) {
      console.log(`  ✓ "${a.nom}": ${a.icone} → ${newSlug}`)
      a.icone = newSlug
      armesUpdates++
    }
  }
})
writeJ('armes.jsonc', armes, 'Armes — The Division 2')
console.log(`  ${armesUpdates} icônes mises à jour\n`)

console.log(`=== Total: ${c1 + c2} fichiers renommés, ${updates + armesUpdates} JSONC mis à jour ===`)

