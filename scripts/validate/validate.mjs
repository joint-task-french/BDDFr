/**
 * Script maître de validation.
 * Recherche et exécute séquentiellement tous les scripts nommés "validate-*.mjs"
 * présents dans le même dossier que ce script.
 *
 * Usage: node scripts/validate/validate.mjs
 * Exit code 0 = Tous les scripts ont réussi, 1 = Au moins un script a échoué
 */
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(__dirname);
const validateScripts = files.filter(file =>
    file.startsWith('validate-') &&
    file.endsWith('.mjs') &&
    file !== 'validate.mjs'
);
if (validateScripts.length === 0) {
    console.log('⚠️ Aucun script de validation (validate-*.mjs) trouvé dans le dossier.');
    process.exit(0);
}
console.log(`🚀 Lancement de la suite de validation (${validateScripts.length} scripts trouvés)...\n`);
let hasErrors = false;
const results = [];
for (const script of validateScripts) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`▶️  EXÉCUTION : ${script}`);
    console.log(`${'═'.repeat(60)}\n`);
    const scriptPath = join(__dirname, script);
    const result = spawnSync('node', [scriptPath], { stdio: 'inherit' });
    if (result.status !== 0) {
        hasErrors = true;
        results.push({ script, status: '❌ ÉCHEC' });
    } else {
        results.push({ script, status: '✅ SUCCÈS' });
    }
}
console.log(`\n\n${'═'.repeat(60)}`);
console.log(`📋 RÉCAPITULATIF DES VALIDATIONS`);
console.log(`${'═'.repeat(60)}\n`);
results.forEach(res => {
    console.log(` ${res.status} — ${res.script}`);
});
console.log(`\n${'─'.repeat(60)}`);
if (hasErrors) {
    console.error('💥 La suite de validation a échoué : un ou plusieurs scripts ont retourné une erreur.\n');
    process.exit(1);
} else {
    console.log('🎉 Succès total : tous les scripts de validation sont passés au vert !\n');
    process.exit(0);
}