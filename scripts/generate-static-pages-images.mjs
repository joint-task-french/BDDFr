import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_DIR = './dist';
const DATA_DIR = './src/data';
const ASSETS_DIR = './src/img/game_assets';

const DEV_SERVER_URL = 'http://localhost:5173/BDDFr';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const BASE_URL = process.env.PUBLIC_URL || (process.env.GITHUB_ACTIONS ? `https://${owner}.github.io/${repo}` : 'http://localhost:5173/BDDFr');
const BASE_PATH = process.env.PUBLIC_PATH || (process.env.GITHUB_ACTIONS ? `/${repo}` : '/BDDFr');
const DIVISION_ORANGE = "#ff8000";

const weaponTypes = parseJsonc(path.join(DATA_DIR, 'armes-type.jsonc')) || {};
const gearTypes = parseJsonc(path.join(DATA_DIR, 'equipements-type.jsonc')) || {};
const ensembles = parseJsonc(path.join(DATA_DIR, 'ensembles.jsonc')) || {};
const classSpe = parseJsonc(path.join(DATA_DIR, 'class-spe.jsonc')) || {};

const getWpnType = (t) => weaponTypes[t] || { nom: t?.replace('_', ' ') };
const getGearType = (e) => gearTypes[e] || { nom: e };
const getBrandName = (slug) => ensembles[slug]?.nom || slug;

function slugify(name) {
    if (!name) return '';
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseJsonc(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const stripped = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
        return JSON.parse(stripped);
    } catch (e) { return null; }
}

const categoryFormatters = {
    'armes': (item) => {
        const typeInfo = getWpnType(item.type);
        const raretePrefix = item.estExotique ? '🔴 ' : (item.estNomme ? '🟡 ' : (item.isSignature ? '🟠 ' : ''));
        const speSuffix = item.speNom ? ` (${item.speNom})` : '';
        return {
            title: `${raretePrefix}${item.nom}${speSuffix} — BDDFr`,
            description: typeInfo.nom || 'Arme'
        };
    },
    'equipements': (item) => {
        const typeInfo = getGearType(item.emplacement);
        const raretePrefix = item.estExotique ? '🔴 ' : (item.estNomme ? '🟡 ' : '');
        const cleanName = (item.nom || '').replace(/\\"/g, '"').replace(/"/g, '');
        return {
            title: `${raretePrefix}${cleanName} — BDDFr`,
            description: `${getBrandName(item.marque)} (${typeInfo.nom})`
        };
    },
    'ensembles': (item) => ({
        title: `🔗 ${item.nom} — BDDFr`,
        description: "Ensemble d'équipement"
    }),
    'competences': (item) => ({
        title: `⚡ ${item.competence} (${item.variante}) — BDDFr`,
        description: "Compétence"
    }),
    'attributs': (item) => ({
        title: `📊 ${item.nom} — BDDFr`,
        description: "Attribut"
    }),
    'default': (item) => ({
        title: `${item.nom || item.competence || 'Élément'} — BDDFr`,
        description: "Élément de la base de données"
    })
};

const pages_fixes = [
    { path: 'build', title: 'Build Planner — BDDFr', description: 'Créez et partagez vos configurations d\'équipement.' },
    { path: 'changelog', title: 'Mises à jour — BDDFr', description: 'Historique des changements.' },
    { path: 'generator', title: 'Générateur — BDDFr', description: 'Outil de contribution.' }
];

const categoryMap = {
    'armes': 'armes.jsonc',
    'equipements': 'equipements.jsonc',
    'ensembles': 'ensembles.jsonc',
    'competences': 'competences.jsonc',
    'attributs': 'attributs.jsonc',
    'talentsArmes': 'talents-armes.jsonc',
    'talentsEquipements': 'talents-equipements.jsonc',
    'modsArmes': 'mods-armes.jsonc',
    'modsEquipements': 'mods-equipements.jsonc',
    'modsCompetences': 'mods-competences.jsonc'
};

const stubTemplate = (title, description, imagePath, pagePath) => {
    const fullUrl = `${BASE_URL}/${pagePath}`;
    const mainImageUrl = `${BASE_URL}/${imagePath}`;
    const safeDesc = (description || '').replace(/"/g, '&quot;');
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="${fullUrl}" />
    <meta name="theme-color" content="${DIVISION_ORANGE}">
    <meta name="description" content="${safeDesc}">
    <meta property="og:site_name" content="JTFr — BDDFr">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${mainImageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <script>
        var origin = window.location.origin;
        var target = origin + "${BASE_PATH}/#/${pagePath}" + window.location.search + window.location.hash;
        window.location.replace(target);
    </script>
</head>
<body><p>Redirection vers <a href="${BASE_URL}/${pagePath}">${title}</a>...</p></body>
</html>`;
};

function startDevServer() {
    console.log("🔄 Démarrage du serveur de développement local...");
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('npx', ['vite', '--port', '5173'], { shell: true });

        const onData = (data) => {
            const output = data.toString();
            if (output.includes('http://localhost:5173') || output.includes('ready in')) {
                resolve(serverProcess);
            }
        };

        serverProcess.stdout.on('data', onData);
        serverProcess.stderr.on('data', onData);

        serverProcess.on('error', (err) => {
            console.error("❌ Erreur au lancement de Vite", err);
            reject(err);
        });
    });
}

async function generate() {
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    let devServerProcess = null;
    let browser = null;

    try {
        devServerProcess = await startDevServer();
        console.log("✅ Serveur démarré et prêt !");

        console.log("🚀 Lancement de Puppeteer...");
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const sitemapEntries = [`${BASE_URL}/`];
        const today = new Date().toISOString().split('T')[0];

        for (const p of pages_fixes) {
            const targetDir = path.join(DIST_DIR, p.path);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(p.title, p.description, 'favicon.png', p.path));
            sitemapEntries.push(`${BASE_URL}/${p.path}`);
        }

        const exportOgImagesDir = path.join(DIST_DIR, 'og-images');
        if (!fs.existsSync(exportOgImagesDir)) fs.mkdirSync(exportOgImagesDir, { recursive: true });

        const hashFilePath = path.join(exportOgImagesDir, 'hashes.json');
        let imageHashes = {};
        if (fs.existsSync(hashFilePath)) {
            try {
                imageHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf-8'));
                console.log(`🗄️ Cache d'empreintes chargé (${Object.keys(imageHashes).length} éléments connus).`);
            } catch (e) {
                console.error("⚠️ Fichier hashes.json corrompu, on repart de zéro.");
            }
        }

        console.log("📸 Lancement des captures d'écran en parallèle...");

        const capturePromises = Object.entries(categoryMap).map(async ([categoryKey, fileName]) => {
            const filePath = path.join(DATA_DIR, fileName);
            if (!fs.existsSync(filePath)) return;

            const categoryOgDir = path.join(exportOgImagesDir, categoryKey);
            if (!fs.existsSync(categoryOgDir)) fs.mkdirSync(categoryOgDir, { recursive: true });

            const categoryUrl = `${DEV_SERVER_URL}/#/db/${categoryKey}`;

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            try {
                console.log(`⏳ [${categoryKey}] Chargement de l'onglet...`);
                await page.goto(categoryUrl, { waitUntil: 'networkidle0', timeout: 30000 });

                await new Promise(resolve => setTimeout(resolve, 5000));

                const cards = await page.$$('.og-target-card');
                console.log(`✅ [${categoryKey}] Prêt ! ${cards.length} cartes trouvées.`);

                for (const card of cards) {
                    const slug = await page.evaluate(el => el.getAttribute('data-slug'), card);
                    if (!slug) continue;

                    const cardHtml = await page.evaluate(el => el.innerHTML, card);
                    const currentHash = crypto.createHash('md5').update(cardHtml).digest('hex');

                    const hashKey = `${categoryKey}_${slug}`;
                    const imageName = `${slug}.jpg`;
                    const imageOutputPath = path.join(categoryOgDir, imageName);

                    if (fs.existsSync(imageOutputPath) && imageHashes[hashKey] === currentHash) {
                        console.log(`⏩ [${categoryKey}] Ignoré (aucun changement) : ${imageName}`);
                        continue;
                    }

                    try {
                        await page.evaluate(el => el.scrollIntoView(), card);
                        await new Promise(resolve => setTimeout(resolve, 100));

                        await card.screenshot({
                            path: imageOutputPath,
                            type: 'jpeg',
                            quality: 85
                        });
                        console.log(`📸 [${categoryKey}] Image générée : ${imageName}`);
                        imageHashes[hashKey] = currentHash;
                    } catch (err) {
                        console.error(`❌ [${categoryKey}] Échec capture pour ${imageName}:`, err.message);
                    }
                }
            } catch (err) {
                console.error(`❌ [${categoryKey}] Erreur sur la page de catégorie:`, err.message);
            } finally {
                await page.close();
            }
        });

        await Promise.all(capturePromises);
        console.log("📸 Toutes les captures d'écran sont terminées !");

        fs.writeFileSync(hashFilePath, JSON.stringify(imageHashes, null, 2));
        console.log("💾 Fichier des empreintes (hashes.json) sauvegardé.");

        console.log("\nGénération des fichiers HTML...");
        for (const [categoryKey, fileName] of Object.entries(categoryMap)) {
            const filePath = path.join(DATA_DIR, fileName);
            if (!fs.existsSync(filePath)) continue;
            const rawData = parseJsonc(filePath);
            if (!rawData) continue;

            const categoryOgDir = path.join(exportOgImagesDir, categoryKey);

            let items = [];
            if (categoryKey === 'competences') {
                Object.entries(rawData).forEach(([skillKey, skill]) => {
                    skill.variantes.forEach(v => items.push({ ...v, competence: skill.competence, skillSlug: skillKey }));
                });
            } else if (categoryKey === 'armes') {
                items = Array.isArray(rawData) ? [...rawData] : Object.entries(rawData).map(([slug, val]) => ({ ...val, slug }));
                if (classSpe) {
                    Object.values(classSpe).forEach(spe => {
                        if (spe.arme && spe.arme.nom) {
                            items.push({
                                ...spe.arme,
                                slug: slugify(spe.arme.nom),
                                isSignature: true,
                                speNom: spe.nom,
                                type: 'Arme de spécialisation'
                            });
                        }
                    });
                }
            } else if (!Array.isArray(rawData)) {
                items = Object.entries(rawData).map(([slug, val]) => ({ ...val, slug }));
            } else {
                items = rawData;
            }

            for (const item of items) {
                const itemSlug = item.slug || slugify(item.nom || item.variante || 'Element');
                if (!itemSlug) continue;

                const pagePath = `db/${categoryKey}/${itemSlug}`;
                const formatter = categoryFormatters[categoryKey] || categoryFormatters['default'];
                const formatterRes = formatter(item);

                let publicImageUrl = 'favicon.png';
                const imageName = `${itemSlug}.jpg`;
                const imageOutputPath = path.join(categoryOgDir, imageName);

                if (fs.existsSync(imageOutputPath)) {
                    publicImageUrl = `og-images/${categoryKey}/${imageName}`;
                }

                const targetDir = path.join(DIST_DIR, pagePath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(formatterRes.title, formatterRes.description, publicImageUrl, pagePath));
                sitemapEntries.push(`${BASE_URL}/${pagePath}`);
            }
        }

        fs.writeFileSync(path.join(DIST_DIR, '404.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><script>var path=window.location.pathname;window.location.replace(window.location.origin + "${BASE_PATH}/?redirect="+encodeURIComponent(path+window.location.search+window.location.hash));</script></head><body><p>Redirection...</p></body></html>`);
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${url.includes('/db/') ? '0.6' : '0.8'}</priority></url>`).join('\n')}</urlset>`;
        fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent);
        fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml`);
        console.log(`✅ Terminé : ${sitemapEntries.length} pages traitées au total.`);

    } catch (error) {
        console.error("❌ Une erreur globale est survenue durant la génération :", error);
    } finally {
        if (browser) {
            await browser.close();
            console.log("✅ Puppeteer fermé.");
        }
        if (devServerProcess) {
            devServerProcess.kill('SIGINT');
            console.log("🛑 Serveur de développement arrêté.");
        }

        process.exit(0);
    }
}

generate().catch((err) => {
    console.error(err);
    process.exit(1);
});