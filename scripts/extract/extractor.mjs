import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function downloadAndProcess() {
    const htmlFileName = 'extract.html';
    const outputDir = './downloaded_images';

    try {
        const data = await fs.readFile(htmlFileName, 'utf8');
        await fs.mkdir(outputDir, { recursive: true });

        console.log("🔍 Recherche des liens Imgur dans le code source...");

        const imgurRegex = /imgur\.com\/([a-zA-Z0-9]{5,10})/g;
        const uniqueIds = new Set();
        let match;

        while ((match = imgurRegex.exec(data)) !== null) {
            uniqueIds.add(match[1]);
        }

        const idsArray = Array.from(uniqueIds);
        console.log(`✨ ${idsArray.length} images uniques trouvées.`);

        if (idsArray.length === 0) {
            console.log("⚠️ Aucune image trouvée. Vérifie le contenu de extract.html.");
            return;
        }

        console.log("📥 Début du traitement (Téléchargement -> Rognage + Marge 2px -> Normalisation 150x150)...\n");
        let successCount = 0;

        for (let i = 0; i < idsArray.length; i++) {
            const id = idsArray[i];
            const url = `https://i.imgur.com/${id}.png`;
            const filename = `image_${id}.png`;
            const outputPath = path.join(outputDir, filename);

            process.stdout.write(`[${i + 1}/${idsArray.length}] ⚙️ ${filename} ... `);

            try {
                // 1. Télécharger l'image brute
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const writer = createWriteStream(outputPath);
                await pipeline(response.body, writer);

                // 2. Traitement ImageMagick complexe
                // -trim : enlève le vide
                // +repage : réinitialise les coordonnées après rognage
                // -border... : ajoute la marge de 2px
                // -resize/-extent : normalise en 150x150 centré sur fond transparent
                const imArgs = `-trim +repage -bordercolor none -border 2 -resize 150x150 -background none -gravity center -extent 150x150`;

                const magickCmd = `magick "${outputPath}" ${imArgs} "${outputPath}"`;
                const convertCmd = `convert "${outputPath}" ${imArgs} "${outputPath}"`;

                try {
                    await execAsync(magickCmd); // Pour ImageMagick v7+
                } catch (e) {
                    await execAsync(convertCmd); // Fallback pour v6
                }

                process.stdout.write("✅ OK\n");
                successCount++;
            } catch (err) {
                process.stdout.write(`❌ ERREUR (${err.message})\n`);
                // En cas d'erreur de traitement, on essaie de supprimer le fichier corrompu
                try { await fs.unlink(outputPath); } catch (e) {}
            }
        }

        console.log(`\n🎉 Terminé ! ${successCount}/${idsArray.length} images traitées avec succès dans : ${outputDir}`);

    } catch (error) {
        console.error('❌ Erreur fatale :', error.message);
    }
}

downloadAndProcess();