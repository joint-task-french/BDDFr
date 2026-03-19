/**
 * Validation de la présence des assets graphiques (icônes) appelés dans les fichiers JSONC.
 * Utilisé en CI (GitHub Actions) pour éviter les images manquantes en production.
 *
 * Usage: node scripts/validate-icons.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, dirname, relative, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
// Basé sur vos chemins précédents, le dossier s'appelle "img", modifiez si c'est bien "images"
const IMG_DIR = join(__dirname, '..', 'src', 'img', 'game_assets')

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

/**
 * Récupère récursivement tous les fichiers .png dans un dossier donné.
 */
function getAllImages(dir, fileList = []) {
    if (!existsSync(dir)) return fileList;
    const files = readdirSync(dir);
    for (const file of files) {
        const filepath = join(dir, file);
        if (statSync(filepath).isDirectory()) {
            getAllImages(filepath, fileList);
        } else if (file.endsWith('.png')) {
            fileList.push(filepath);
        }
    }
    return fileList;
}

/**
 * Extrait récursivement toutes les valeurs des clés "icon" dans un objet JSON.
 */
function extractIcons(data, results = []) {
    if (Array.isArray(data)) {
        data.forEach(item => extractIcons(item, results));
    } else if (typeof data === 'object' && data !== null) {
        for (const [key, value] of Object.entries(data)) {
            if (key === 'icon' && typeof value === 'string') {
                results.push(value);
            } else {
                extractIcons(value, results);
            }
        }
    }
    return results;
}

// -----------------------------------------------------------------------------
// PRÉPARATION DES DONNÉES DE VALIDATION
// -----------------------------------------------------------------------------

console.log('🖼️  Validation des icônes entre fichiers JSONC et game_assets...\n')

if (!existsSync(IMG_DIR)) {
    console.error(`❌ Le dossier d'images est introuvable : ${IMG_DIR}`);
    process.exit(1);
}

// 1. Indexation des images disponibles
const availableImagesPaths = getAllImages(IMG_DIR)
const validIconIdentifiers = new Set()

availableImagesPaths.forEach(filepath => {
    // On normalise les chemins (slashes) pour éviter les soucis Windows/Linux
    const relPath = relative(IMG_DIR, filepath).replace(/\\/g, '/');
    const relPathNoExt = relPath.replace(/\.png$/, '');
    const baseName = basename(filepath);
    const baseNameNoExt = basename(filepath, '.png');

    // On stocke toutes les variantes possibles qui pourraient être utilisées dans le JSONC
    validIconIdentifiers.add(relPath);
    validIconIdentifiers.add(relPathNoExt);
    validIconIdentifiers.add(baseName);
    validIconIdentifiers.add(baseNameNoExt);
});

// 2. Indexation des fichiers JSONC
const jsoncFiles = []
if (existsSync(DATA_DIR)) {
    const files = readdirSync(DATA_DIR);
    for (const file of files) {
        if (file.endsWith('.jsonc')) {
            jsoncFiles.push(file);
        }
    }
} else {
    console.error(`❌ Le dossier de données est introuvable : ${DATA_DIR}`);
    process.exit(1);
}

// -----------------------------------------------------------------------------
// EXÉCUTION DE LA VALIDATION
// -----------------------------------------------------------------------------

let hasErrors = false
let totalFiles = 0
let passedFiles = 0
let totalIconsChecked = 0

for (const filename of jsoncFiles) {
    totalFiles++;
    const filepath = join(DATA_DIR, filename);

    let dataContent, data;
    try {
        dataContent = readFileSync(filepath, 'utf8');
        data = JSON.parse(stripComments(dataContent));
    } catch (e) {
        console.log(`  ❌ [${filename}] — Erreur de lecture/parsing : ${e.message}`);
        hasErrors = true;
        continue;
    }

    const iconsInFile = extractIcons(data);
    totalIconsChecked += iconsInFile.length;

    // S'il n'y a aucune icône dans ce fichier, on le compte comme valide et on passe au suivant
    if (iconsInFile.length === 0) {
        console.log(`  ✅ [${filename}] — OK (Aucun champ "icon")`);
        passedFiles++;
        continue;
    }

    const invalidIcons = [];
    for (const iconValue of iconsInFile) {
        if (!validIconIdentifiers.has(iconValue)) {
            invalidIcons.push(iconValue);
        }
    }

    if (invalidIcons.length === 0) {
        console.log(`  ✅ [${filename}] — OK (${iconsInFile.length} icônes vérifiées)`);
        passedFiles++;
    } else {
        console.log(`  ❌ [${filename}] — ${invalidIcons.length} icône(s) introuvable(s) :`);

        // Affichage limité pour la lisibilité de la console CI
        invalidIcons.slice(0, 10).forEach(icon => {
            console.log(`     → Image introuvable pour la valeur : "${icon}"`);
        });

        if (invalidIcons.length > 10) {
            console.log(`     ... et ${invalidIcons.length - 10} autre(s) erreur(s)`);
        }
        hasErrors = true;
    }
}

// -----------------------------------------------------------------------------
// RÉSULTATS
// -----------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 Résultat : ${passedFiles}/${totalFiles} fichiers validés`);
console.log(`🏷️  Total des champs "icon" vérifiés : ${totalIconsChecked}`);
console.log(`📁 Total des images indexées : ${availableImagesPaths.length}`);

if (hasErrors) {
    console.log('\n❌ La validation des icônes a échoué.\n');
    process.exit(1);
} else {
    console.log('\n✅ Toutes les icônes appelées correspondent à une image existante !\n');
    process.exit(0);
}