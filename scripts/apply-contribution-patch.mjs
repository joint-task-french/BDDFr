import fs from 'fs';
import { applyEdits, modify } from 'jsonc-parser';

const body = process.env.ISSUE_BODY;

if (!body) {
    console.error("Erreur : La variable d'environnement ISSUE_BODY est manquante.");
    process.exit(1);
}

const regex = /[\s\S]*?```json\n([\s\S]*?)\n```[\s\S]*?/;
const match = body.match(regex);

if (!match) {
    console.log("Aucune donnée JSON trouvée dans l'issue. Opération ignorée.");
    process.exit(0);
}

let patches;
try {
    patches = JSON.parse(match[1]);
} catch (e) {
    console.error("Erreur de parsing JSON du patch :", e);
    process.exit(1);
}

for (const patch of patches) {
    const { path, upserts } = patch;

    if (!fs.existsSync(path)) {
        console.error(`Erreur fatale : Fichier introuvable : ${path}`);
        process.exit(1);
    }

    let rawContent = fs.readFileSync(path, 'utf8');
    let updatedContent = rawContent;

    for (const [slug, newItem] of Object.entries(upserts)) {
        const edits = modify(updatedContent, [slug], newItem, {
            formattingOptions: {
                insertSpaces: true,
                tabSize: 2,
                eol: '\n'
            }
        });

        updatedContent = applyEdits(updatedContent, edits);
    }

    fs.writeFileSync(path, updatedContent, 'utf8');
    console.log(`Fichier mis à jour avec succès (commentaires préservés) : ${path}`);
}