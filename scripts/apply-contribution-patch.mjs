import fs from 'fs';

const body = process.env.ISSUE_BODY;

if (!body) {
    console.error("Erreur : La variable d'environnement ISSUE_BODY est manquante.");
    process.exit(1);
}

const regex = /[\s\S]*?```json\n([\s\S]*?)\n```[\s\S]*?/;
const match = body.match(regex);

if (!match) {
    console.log("Aucune donnée JSON trouvée dans l'issue. Opération ignorée (non fatale).");
    process.exit(0);
}

let patches;
try {
    patches = JSON.parse(match[1]);
} catch (e) {
    console.error("Erreur de parsing JSON du patch :", e);
    process.exit(1);
}

let hasChanges = false;

for (const patch of patches) {
    const { path, upserts } = patch;

    if (!fs.existsSync(path)) {
        console.error(`Erreur fatale : Fichier introuvable : ${path}`);
        process.exit(1);
    }

    const rawContent = fs.readFileSync(path, 'utf8');
    const jsonContent = rawContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

    let fileData = {};
    try {
        fileData = JSON.parse(jsonContent);
    } catch (e) {
        console.error(`Erreur fatale de parsing JSON pour le fichier ${path} :`, e);
        process.exit(1);
    }

    for (const [slug, newItem] of Object.entries(upserts)) {
        if (fileData[slug]) {
            fileData[slug] = { ...fileData[slug], ...newItem };
        } else {
            fileData[slug] = newItem;
        }
        hasChanges = true;
    }

    fs.writeFileSync(path, JSON.stringify(fileData, null, 2) + '\n', 'utf8');
    console.log(`Fichier mis à jour avec succès : ${path}`);
}

if (!hasChanges) {
    console.log("Aucune modification à appliquer.");
}