import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_DIR = './dist';
const DATA_DIR = './src/data';

const DEV_SERVER_URL = 'http://localhost:5173/BDDFr';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const BASE_URL = process.env.PUBLIC_URL || (process.env.GITHUB_ACTIONS ? `https://${owner}.github.io/${repo}` : 'http://localhost:5173/BDDFr');
const BASE_PATH = process.env.PUBLIC_PATH || (process.env.GITHUB_ACTIONS ? `/${repo}` : '/BDDFr');
const DIVISION_ORANGE = "#ff8000";

const WATERMARK_URL = `${BASE_PATH}/favicon.png`;
const WATERMARK_OPACITY = 0.15;
const WATERMARK_SIZE = '60px';

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
            if (output.includes('http://localhost:5173') || output.includes('ready in')) resolve(serverProcess);
        };
        serverProcess.stdout.on('data', onData);
        serverProcess.stderr.on('data', onData);
        serverProcess.on('error', (err) => reject(err));
    });
}

async function generate() {
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    let devServerProcess = null;
    let browser = null;

    try {
        devServerProcess = await startDevServer();
        browser = await puppeteer.launch({
            headless: "new",
            protocolTimeout: 240000, // Augmenté à 4 minutes
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const sitemapEntries = [`${BASE_URL}/`];
        const today = new Date().toISOString().split('T')[0];
        const exportOgImagesDir = path.join(DIST_DIR, 'og-images');
        if (!fs.existsSync(exportOgImagesDir)) fs.mkdirSync(exportOgImagesDir, { recursive: true });

        const hashFilePath = path.join(exportOgImagesDir, 'hashes.json');
        let imageHashes = {};
        if (fs.existsSync(hashFilePath)) {
            try { imageHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf-8')); } catch (e) {}
        }

        console.log("📸 Début des captures d'écran...");
        const capturePromises = Object.entries(categoryMap).map(async ([categoryKey, fileName]) => {
            const filePath = path.join(DATA_DIR, fileName);
            if (!fs.existsSync(filePath)) return;

            const categoryOgDir = path.join(exportOgImagesDir, categoryKey);
            if (!fs.existsSync(categoryOgDir)) fs.mkdirSync(categoryOgDir, { recursive: true });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            try {
                await page.goto(`${DEV_SERVER_URL}/#/db/${categoryKey}`, { waitUntil: 'networkidle0', timeout: 60000 });
                await page.addStyleTag({
                    content: `
                        header, nav, footer, .navbar { display: none !important; }
                        .puppeteer-teleport { 
                            position: fixed !important; top: 50px !important; left: 50px !important; z-index: 999999 !important;
                            margin: 0 !important; transform: none !important; transition: none !important;
                            height: auto !important; background-color: #0d0d0d !important;
                        }
                        .watermark-overlay {
                            position: absolute !important; bottom: 15px !important; right: 15px !important;
                            width: ${WATERMARK_SIZE} !important; opacity: ${WATERMARK_OPACITY} !important;
                            z-index: 1000000 !important; pointer-events: none !important;
                        }
                    `
                });
                await new Promise(r => setTimeout(r, 5000));

                const cards = await page.$$('.og-target-card');
                for (const card of cards) {
                    const slug = await page.evaluate(el => el.getAttribute('data-slug'), card);
                    if (!slug) continue;

                    const cardHtml = await page.evaluate(el => el.innerHTML, card);
                    const currentHash = crypto.createHash('md5').update(cardHtml).digest('hex');
                    const hashKey = `${categoryKey}_${slug}`;
                    const imageOutputPath = path.join(categoryOgDir, `${slug}.jpg`);

                    if (fs.existsSync(imageOutputPath) && imageHashes[hashKey] === currentHash) continue;

                    // --- PROTECTION & RETRY LOOP ---
                    let attempts = 3;
                    let success = false;

                    while (attempts > 0 && !success) {
                        try {
                            await page.evaluate((el, logo) => {
                                const rect = el.getBoundingClientRect();
                                el.style.setProperty('width', rect.width + 'px', 'important');
                                el.classList.add('puppeteer-teleport');
                                if (!el.querySelector('.watermark-overlay')) {
                                    const img = document.createElement('img');
                                    img.src = logo; img.className = 'watermark-overlay';
                                    el.appendChild(img);
                                }
                            }, card, WATERMARK_URL);

                            await new Promise(r => setTimeout(r, 300));
                            await card.screenshot({ path: imageOutputPath, type: 'jpeg', quality: 85 });

                            // Nettoyage après succès
                            await page.evaluate(el => {
                                el.style.removeProperty('width');
                                el.classList.remove('puppeteer-teleport');
                                const wm = el.querySelector('.watermark-overlay');
                                if (wm) wm.remove();
                            }, card);

                            console.log(`📸 [${categoryKey}] Généré : ${slug}.jpg`);
                            imageHashes[hashKey] = currentHash;
                            success = true;
                        } catch (e) {
                            attempts--;
                            // Nettoyage impératif avant le prochain essai
                            await page.evaluate(el => {
                                el.style.removeProperty('width');
                                el.classList.remove('puppeteer-teleport');
                                const wm = el.querySelector('.watermark-overlay');
                                if (wm) wm.remove();
                            }, card).catch(() => {});

                            if (attempts > 0) {
                                console.warn(`⚠️ [${categoryKey}] Timeout pour ${slug}, tentative restante: ${attempts}...`);
                                await new Promise(r => setTimeout(r, 2000));
                            } else {
                                console.error(`❌ [${categoryKey}] Échec définitif pour ${slug}:`, e.message);
                            }
                        }
                    }
                }
            } finally { await page.close(); }
        });

        await Promise.all(capturePromises);
        fs.writeFileSync(hashFilePath, JSON.stringify(imageHashes, null, 2));

        console.log("\n🔗 Génération des fichiers HTML et du Sitemap...");
        for (const [categoryKey, fileName] of Object.entries(categoryMap)) {
            const filePath = path.join(DATA_DIR, fileName);
            if (!fs.existsSync(filePath)) continue;
            const rawData = parseJsonc(filePath);
            if (!rawData) continue;

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
                            items.push({ ...spe.arme, slug: slugify(spe.arme.nom), isSignature: true, speNom: spe.nom, type: 'Arme de spécialisation' });
                        }
                    });
                }
            } else if (!Array.isArray(rawData)) {
                items = Object.entries(rawData).map(([slug, val]) => ({ ...val, slug }));
            } else { items = rawData; }

            for (const item of items) {
                const itemSlug = item.slug || slugify(item.nom || item.variante || 'Element');
                const pagePath = `db/${categoryKey}/${itemSlug}`;
                const formatter = categoryFormatters[categoryKey] || categoryFormatters['default'];
                const res = formatter(item);
                const imagePath = fs.existsSync(path.join(exportOgImagesDir, categoryKey, `${itemSlug}.jpg`)) ? `og-images/${categoryKey}/${itemSlug}.jpg` : 'favicon.png';

                const targetDir = path.join(DIST_DIR, pagePath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(res.title, res.description, imagePath, pagePath));
                sitemapEntries.push(`${BASE_URL}/${pagePath}`);
            }
        }

        fs.writeFileSync(path.join(DIST_DIR, '404.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><script>window.location.replace(window.location.origin + "${BASE_PATH}/?redirect="+encodeURIComponent(window.location.pathname+window.location.search+window.location.hash));</script></head><body>Redirection...</body></html>`);
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}</urlset>`;
        fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
        fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml`);
        console.log(`✅ Terminé ! ${sitemapEntries.length} pages traitées.`);

    } finally {
        if (browser) await browser.close();
        if (devServerProcess) devServerProcess.kill('SIGINT');
        process.exit(0);
    }
}

generate().catch(err => { console.error(err); process.exit(1); });