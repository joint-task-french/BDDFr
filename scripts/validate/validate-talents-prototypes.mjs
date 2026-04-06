/**
 * Validation des talents prototypes.
 * Vérifie que chaque talent prototype possède exactement 10 niveaux,
 * c'est-à-dire que : min + pas * 9 = max
 *
 * Usage: node scripts/validate/validate-talents-prototypes.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'src', 'data')

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

console.log('🧬 Validation des talents prototypes (10 niveaux requis)...\n')

let talentsData

try {
    talentsData = loadJsonc('talents-prototypes.jsonc')
} catch (e) {
    console.log(`❌ Erreur fatale : ${e.message}`)
    process.exit(1)
}

let hasErrors = false
let totalTalents = 0
let validTalents = 0

for (const [slug, talent] of Object.entries(talentsData)) {
    totalTalents++

    const nom = talent.nom || slug
    const { statMin, statMax, pas } = talent

    // Vérifier que les champs requis sont présents
    if (statMin == null || statMax == null || pas == null) {
        hasErrors = true
        console.log(`  ❌ [${nom}] — Champs manquants : statMin=${statMin}, statMax=${statMax}, pas=${pas}`)
        continue
    }

    // Vérifier que pas > 0
    if (pas <= 0) {
        hasErrors = true
        console.log(`  ❌ [${nom}] — Le pas doit être positif (pas=${pas})`)
        continue
    }

    // Formule de l'issue : min + pas * 9 = max
    const expectedMax = +(statMin + pas * 9).toFixed(10)
    const actualMax = +statMax.toFixed(10)

    if (Math.abs(expectedMax - actualMax) > 1e-9) {
        hasErrors = true
        const niveaux = Math.round((statMax - statMin) / pas) + 1
        console.log(`  ❌ [${nom}] — Ne respecte pas la formule min + pas × 9 = max`)
        console.log(`     → statMin=${statMin}, pas=${pas}, statMax=${statMax}`)
        console.log(`     → Attendu : statMax = ${+(statMin + pas * 9).toFixed(4)}, obtenu : ${statMax}`)
        console.log(`     → Nombre de niveaux actuel : ${niveaux}`)
        console.log('')
    } else {
        validTalents++
    }
}

// Rapport final
console.log(`${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${validTalents}/${totalTalents} talents prototypes validés`)

if (hasErrors) {
    console.log('❌ La validation des talents prototypes a échoué.\n')
    process.exit(1)
} else {
    console.log('✅ Tous les talents prototypes possèdent exactement 10 niveaux !\n')
    process.exit(0)
}
