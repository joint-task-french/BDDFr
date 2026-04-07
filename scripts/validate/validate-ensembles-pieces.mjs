/**
 * Validation de l'intégrité des ensembles (Marques et Gear Sets).
 * Vérifie que chaque ensemble possède exactement 1 équipement non nommé
 * pour chacun des 6 emplacements (masque, sac_a_dos, torse, gants, holster, genouilleres).
 *
 * Usage: node scripts/validate-ensembles-pieces.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'src', 'data')

const REQUIRED_SLOTS = [
    'masque',
    'sac_a_dos',
    'torse',
    'gants',
    'holster',
    'genouilleres'
]

// -----------------------------------------------------------------------------
// UTILITAIRES
// -----------------------------------------------------------------------------

function stripComments(text) {
    text = text.replace(/^\uFEFF/, '');
    return text.replace(/("(?:\\.|[^\\"])*")|(\/\*[\s\S]*?\*\/)|(\/\/(?:.*)$)/gm, (match, string) => {
        if (string) return string;
        return '';
    });
}

function loadJsonc(filename) {
    try {
        const filepath = join(DATA_DIR, filename)
        const content = readFileSync(filepath, 'utf8')
        return JSON.parse(stripComments(content))
    } catch (e) {
        throw new Error(`Impossible de charger ${filename} : ${e.message}`)
    }
}

// -----------------------------------------------------------------------------
// EXÉCUTION DE LA VALIDATION
// -----------------------------------------------------------------------------

console.log('🛡️  Validation des pièces d\'ensembles (6 emplacements requis)...\n')

let ensemblesData
let equipementsData

try {
    ensemblesData = loadJsonc('equipements/ensembles.jsonc')
    equipementsData = loadJsonc('equipements/equipements.jsonc')
} catch (e) {
    console.log(`❌ Erreur fatale : ${e.message}`)
    process.exit(1)
}

// 1. Regrouper tous les équipements "standard" par marque/ensemble
const piecesParMarque = {}

for (const [slug, eq] of Object.entries(equipementsData)) {
    // On ignore les équipements nommés et exotiques
    if (eq.estNomme === true || eq.type === 'exotique') continue;

    // On ignore les équipements qui n'ont pas de marque définie ou qui ont la marque joker "*"
    if (!eq.marque || eq.marque === '*') continue;

    if (!piecesParMarque[eq.marque]) {
        piecesParMarque[eq.marque] = []
    }

    piecesParMarque[eq.marque].push({
        slug: slug,
        nom: eq.nom,
        emplacement: eq.emplacement
    })
}

// 2. Vérifier chaque ensemble déclaré
let hasErrors = false
let totalEnsembles = 0
let validEnsembles = 0

for (const [ensembleSlug, ensembleDef] of Object.entries(ensemblesData)) {
    totalEnsembles++

    const pieces = piecesParMarque[ensembleSlug] || []
    const slotsPresents = pieces.map(p => p.emplacement)

    // Vérification des manques
    const missingSlots = REQUIRED_SLOTS.filter(slot => !slotsPresents.includes(slot))

    // Vérification des doublons (ex: deux masques non-nommés pour la même marque)
    const duplicateSlots = REQUIRED_SLOTS.filter(slot =>
        slotsPresents.filter(s => s === slot).length > 1
    )

    if (missingSlots.length === 0 && duplicateSlots.length === 0) {
        validEnsembles++
    } else {
        hasErrors = true
        const nomAffichage = ensembleDef.nom || ensembleSlug
        console.log(`  ❌ [${nomAffichage}] — Structure invalide :`)

        if (missingSlots.length > 0) {
            console.log(`     → Emplacements manquants : ${missingSlots.join(', ')}`)
        }

        if (duplicateSlots.length > 0) {
            console.log(`     → Doublons détectés sur : ${duplicateSlots.join(', ')}`)
            // Afficher le nom exact des doublons pour faciliter la correction
            duplicateSlots.forEach(dupSlot => {
                const armesDoublons = pieces.filter(p => p.emplacement === dupSlot).map(p => `"${p.slug}"`)
                console.log(`        - ${dupSlot} : ${armesDoublons.join(' et ')}`)
            })
        }
        console.log('') // Espace de lisibilité
    }
}

// 3. Rapport final
console.log(`${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${validEnsembles}/${totalEnsembles} ensembles validés`)

if (hasErrors) {
    console.log('❌ La validation des pièces d\'équipement a échoué.\n')
    process.exit(1)
} else {
    console.log('✅ Tous les ensembles possèdent exactement leurs 6 pièces standard !\n')
    process.exit(0)
}