/**
 * Validation des références croisées (clés primaires) entre les fichiers JSONC.
 * Utilisé en CI (GitHub Actions) pour garantir l'intégrité relationnelle des données.
 *
 * Usage: node scripts/validate/validate-slugs.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'src', 'data')

// -----------------------------------------------------------------------------
// CONFIGURATION DES RELATIONS À VALIDER
// -----------------------------------------------------------------------------
const RELATIONS = [
    // ==========================================
    // 🔫 ARMES
    // ==========================================
    {
        name: "Armes -> Types d'armes",
        sourceFile: 'armes/armes-type.jsonc',
        targetFile: 'armes/armes.jsonc',
        targetKey: 'type'
    },
    {
        name: "Armes -> Talents d'armes",
        sourceFile: 'armes/talents-armes.jsonc',
        targetFile: 'armes/armes.jsonc',
        targetKey: 'talents'
    },
    {
        name: "Armes -> Mods pré-équipés",
        sourceFile: 'armes/mods-armes.jsonc',
        targetFile: 'armes/armes.jsonc',
        targetKey: 'modsPredefinis'
    },
    {
        name: "Armes -> Attributs Essentiels",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'armes/armes.jsonc',
        targetKey: 'attributs_essentiels'
    },
    {
        name: "Armes -> Attributs (Classiques)",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'armes/armes.jsonc',
        targetKey: 'attributs'
    },
    {
        name: "Types d'armes -> Attributs Essentiels",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'armes/armes-type.jsonc',
        targetKey: 'attributs_essentiels'
    },

    // ==========================================
    // 🌟 TALENTS (ARMES)
    // ==========================================
    {
        name: "Talents d'armes -> Armes (Armes Parfaites)",
        sourceFile: 'armes/armes.jsonc',
        targetFile: 'armes/talents-armes.jsonc',
        targetKey: 'armesParfaites'
    },
    {
        name: "Talents d'armes -> Compatibilité (Types d'armes)",
        sourceFile: 'armes/armes-type.jsonc',
        targetFile: 'armes/talents-armes.jsonc',
        targetKey: 'compatibilite',
        targetIsKey: true
    },

    // ==========================================
    // 🛡️ ÉQUIPEMENTS
    // ==========================================
    {
        name: "Équipements -> Types d'équipements (Emplacements)",
        sourceFile: 'equipements/equipements-type.jsonc',
        targetFile: 'equipements/equipements.jsonc',
        targetKey: 'emplacement'
    },
    {
        name: "Équipements -> Marques / Gear Sets",
        sourceFile: 'equipements/ensembles.jsonc',
        targetFile: 'equipements/equipements.jsonc',
        targetKey: 'marque' // ⚠️ Attention au slug "*"
    },
    {
        name: "Équipements -> Talents d'équipements",
        sourceFile: 'equipements/talents-equipements.jsonc',
        targetFile: 'equipements/equipements.jsonc',
        targetKey: 'talents'
    },
    {
        name: "Équipements -> Attributs",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'equipements/equipements.jsonc',
        targetKey: 'attributs'
    },
    {
        name: "Équipements -> Type d'attribut Essentiel",
        sourceFile: 'attributs/attributs-type.jsonc',
        targetFile: 'equipements/equipements.jsonc',
        targetKey: 'attributEssentiel'
    },

    // ==========================================
    // 🌟 TALENTS (ÉQUIPEMENTS)
    // ==========================================
    {
        name: "Talents d'équipements -> Équipements (Pièces Parfaites)",
        sourceFile: 'equipements/equipements.jsonc',
        targetFile: 'equipements/talents-equipements.jsonc',
        targetKey: 'equipementsParfaits'
    },

    // ==========================================
    // 🧩 ENSEMBLES (MARQUES & GEAR SETS)
    // ==========================================
    {
        name: "Ensembles -> Talent Torse",
        sourceFile: 'equipements/talents-equipements.jsonc',
        targetFile: 'equipements/ensembles.jsonc',
        targetKey: 'talentTorse'
    },
    {
        name: "Ensembles -> Talent Sac",
        sourceFile: 'equipements/talents-equipements.jsonc',
        targetFile: 'equipements/ensembles.jsonc',
        targetKey: 'talentSac'
    },

    // ==========================================
    // 📊 ATTRIBUTS & STATISTIQUES
    // ==========================================
    {
        name: "Attributs -> Statistiques de jeu",
        sourceFile: 'attributs/statistiques.jsonc',
        targetFile: 'attributs/attributs.jsonc',
        targetKey: 'statistiques'
    },

    // ==========================================
    // 🛠️ MODS & COMPÉTENCES
    // ==========================================
    {
        name: "Mods d'armes (Compatibilité) -> Types de mods",
        sourceFile: 'armes/mods-armes-type.jsonc',
        targetFile: 'armes/mods-armes.jsonc',
        targetKey: 'compatible'
    },
    {
        name: "Mods d'armes -> Attributs",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'armes/mods-armes.jsonc',
        targetKey: 'attribut'
    },
    {
        name: "Mods d'équipements -> Catégorie (Type d'attribut)",
        sourceFile: 'attributs/attributs-type.jsonc',
        targetFile: 'equipements/mods-equipements.jsonc',
        targetKey: 'categorie'
    },
    {
        name: "Mods d'équipements -> Attributs",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'equipements/mods-equipements.jsonc',
        targetKey: 'attribut'
    },
    {
        name: "Mods de compétences -> Attributs",
        sourceFile: 'attributs/attributs.jsonc',
        targetFile: 'mods-competences.jsonc',
        targetKey: 'attribut'
    }
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

const fileCache = new Map()

function loadJsonc(filename) {
    if (fileCache.has(filename)) return fileCache.get(filename)
    try {
        const filepath = join(DATA_DIR, filename)
        const content = readFileSync(filepath, 'utf8')
        const data = JSON.parse(stripComments(content))
        fileCache.set(filename, data)
        return data
    } catch (e) {
        throw new Error(`Impossible de charger ou parser ${filename} : ${e.message}`)
    }
}

/**
 * Extrait récursivement les valeurs d'une clé cible dans un objet JSON.
 * @param {any} data L'objet JSONC parsé.
 * @param {string} targetKey La clé dont on veut extraire les valeurs (ex: "talents", "type").
 * @param {boolean} targetIsKey Si true, extrait les CLÉS de l'objet contenu dans targetKey.
 * @param {Set<string>} results Set accumulateur pour éviter les doublons de traitement.
 * @returns {Set<string>}
 */
function extractValues(data, targetKey, targetIsKey = false, results = new Set()) {
    if (Array.isArray(data)) {
        data.forEach(item => extractValues(item, targetKey, targetIsKey, results))
    } else if (typeof data === 'object' && data !== null) {
        for (const [key, value] of Object.entries(data)) {
            if (key === targetKey) {

                if (targetIsKey) {
                    // Extraction des clés (ex: "compatibilite": { "fusil": true, "pistolet": false })
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        Object.keys(value).forEach(k => results.add(k))
                    }
                } else {
                    // Extraction des valeurs
                    if (Array.isArray(value)) {
                        value.forEach(v => {
                            if (typeof v === 'string' && v !== '*') {
                                results.add(v)
                            } else if (typeof v === 'object' && v !== null && typeof v.nom === 'string') {
                                results.add(v.nom)
                            }
                        })
                    } else if (typeof value === 'string' && value !== '*') {
                        results.add(value)
                    }
                }

            } else {
                // Parcours récursif en profondeur
                extractValues(value, targetKey, targetIsKey, results)
            }
        }
    }
    return results
}

// -----------------------------------------------------------------------------
// EXÉCUTION DE LA VALIDATION
// -----------------------------------------------------------------------------

let hasErrors = false
let totalRules = 0
let passedRules = 0

console.log('🔗 Validation des clés primaires entre fichiers JSONC...\n')

for (const rule of RELATIONS) {
    totalRules++

    let sourceData, targetData

    try {
        sourceData = loadJsonc(rule.sourceFile)
        targetData = loadJsonc(rule.targetFile)
    } catch (e) {
        console.log(`  ❌ [${rule.name}] — ${e.message}`)
        hasErrors = true
        continue
    }

    // 1. Récupération des slugs valides : Ce sont les clés du premier niveau de l'objet source
    const validSlugsSet = new Set(Object.keys(sourceData))

    // 2. Extraction dynamique de toutes les références utilisées dans le fichier cible
    const usedSlugsSet = extractValues(targetData, rule.targetKey, rule.targetIsKey)

    // 3. Identification des erreurs
    const invalidReferences = []
    for (const usedSlug of usedSlugsSet) {
        if (!validSlugsSet.has(usedSlug)) {
            invalidReferences.push(usedSlug)
        }
    }

    if (invalidReferences.length === 0) {
        console.log(`  ✅ [${rule.name}] — OK (${usedSlugsSet.size} références vérifiées)`)
        passedRules++
    } else {
        console.log(`  ❌ [${rule.name}] — ${invalidReferences.length} référence(s) introuvable(s) dans ${rule.sourceFile} :`)

        // Affichage limité pour la lisibilité de la console CI
        invalidReferences.slice(0, 10).forEach(slug => {
            console.log(`     → Clé introuvable : "${slug}"`)
        })

        if (invalidReferences.length > 10) {
            console.log(`     ... et ${invalidReferences.length - 10} autre(s) erreur(s)`)
        }
        hasErrors = true
    }
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${passedRules}/${totalRules} règles validées`)

if (hasErrors) {
    console.log('❌ La validation relationnelle a échoué.\n')
    process.exit(1)
} else {
    console.log('✅ Toutes les clés et références sont valides !\n')
    process.exit(0)
}