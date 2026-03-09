import fs from 'fs';
import path from 'path';

const DIST_DIR = './dist';
const DATA_DIR = './src/data';
const ASSETS_DIR = './src/img/game_assets';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const BASE_URL = process.env.GITHUB_ACTIONS ? `https://${owner}.github.io/${repo}` : 'http://localhost:5173/BDDFr';
const BASE_PATH = process.env.GITHUB_ACTIONS ? `/${repo}` : '/BDDFr';
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

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        else arrayOfFiles.push(fullPath);
    });
    return arrayOfFiles;
}

const iconIndex = {};
getAllFiles(ASSETS_DIR).filter(f => f.endsWith('.png')).forEach(file => {
    const rawName = path.basename(file, '.png');
    iconIndex[slugify(rawName)] = file;
});

const categoryFormatters = {
    'armes': (item) => {
        const typeInfo = getWpnType(item.type);
        const rarete = item.estExotique ? '🔴 ' : (item.estNomme ? '🟡 ' : (item.isSignature ? '🟠 ' : ''));
        return {
            title: `${rarete}${item.nom} (${typeInfo.nom}) — BDDFr`,
            description: item.description ||
                `Dégâts : ${item.degatsBase || 0}\nPortée : ${item.portee || 0}m\nCPM : ${item.rpm || 0}\n` +
                `Chargeur : ${item.chargeur || 0}\nRechargement : ${item.rechargement || 0}s\nHeadshot : +${item.headshot}%`
        };
    },
    'equipements': (item) => {
        const typeInfo = getGearType(item.emplacement);
        const rarete = item.estExotique ? '🔴 ' : (item.estNomme ? '🟡 ' : '');
        const brandName = getBrandName(item.marque);
        const cleanName = (item.nom || '').replace(/\\"/g, '"').replace(/"/g, '');
        return {
            title: `${rarete}${cleanName} (${brandName}) — BDDFr`,
            description: item.description || `Emplacement : ${typeInfo.nom}.`
        };
    },
    'ensembles': (item) => {
        const bonuses = [];
        for (let i = 1; i <= 4; i++) {
            const val = item[`bonus${i}piece`] || item[`bonus${i}pieces`];
            if (val) bonuses.push(`${i}p : ${val}`);
        }
        return {
            title: `Ensemble : ${item.nom} — BDDFr`,
            description: (item.description || '') + "\n\nBonus d'ensemble :\n" + bonuses.join('\n')
        };
    },
    'competences': (item) => {
        let desc = `Statistiques de base :\n${item.statistiques || 'N/A'}\n\n`;
        const tiers = [];
        for (let i = 1; i <= 6; i++) {
            if (item[`tier${i}`]) tiers.push(`Tier ${i} :\n${item[`tier${i}`]}`);
        }
        if (tiers.length > 0) desc += `Progression par Tier :\n${tiers.join('\n\n')}\n\n`;
        if (item.surcharge) desc += `Surcharge :\n${item.surcharge}`;
        return {
            title: `Compétence : ${item.competence} (${item.variante}) — BDDFr`,
            description: desc
        };
    },
    'attributs': (item) => ({
        title: `Attribut : ${item.nom} — BDDFr`,
        description: item.description || `Valeurs : ${item.min}-${item.max}${item.unite}.`
    }),
    'default': (item) => ({
        title: `${item.nom || item.competence || 'Élément'} — BDDFr`,
        description: item.description || "Détails et statistiques."
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
    <link rel="shortcut icon" href="${BASE_URL}/favicon.ico">
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
    <meta name="twitter:card" content="summary">
    <script>window.location.replace("${BASE_URL}/#/${pagePath}" + window.location.search + window.location.hash);</script>
</head>
<body><p>Redirection vers <a href="${BASE_URL}/${pagePath}">${title}</a>...</p></body>
</html>`;
};

async function generate() {
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    const sitemapEntries = [`${BASE_URL}/`];
    const today = new Date().toISOString().split('T')[0];

    for (const page of pages_fixes) {
        const targetDir = path.join(DIST_DIR, page.path);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(page.title, page.description, 'favicon.png', page.path));
        sitemapEntries.push(`${BASE_URL}/${page.path}`);
    }

    const exportIconsDir = path.join(DIST_DIR, 'og-icons');
    if (!fs.existsSync(exportIconsDir)) fs.mkdirSync(exportIconsDir, { recursive: true });

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
                        items.push({
                            ...spe.arme,
                            slug: slugify(spe.arme.nom),
                            isSignature: true,
                            type: spe.nom
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

            const possibleIconKeys = [item.icone, itemSlug, item.skillSlug, item.marque, item.ensemble, item.type, item.emplacement].filter(Boolean).map(k => slugify(k));
            let iconPath = null, resolvedFileName = null;
            for (const key of possibleIconKeys) {
                if (iconIndex[key]) {
                    iconPath = iconIndex[key];
                    resolvedFileName = `${key}.png`;
                    break;
                }
            }

            let publicImageUrl = 'favicon.png';
            if (iconPath && resolvedFileName) {
                const dest = path.join(exportIconsDir, resolvedFileName);
                if (!fs.existsSync(dest)) fs.copyFileSync(iconPath, dest);
                publicImageUrl = `og-icons/${resolvedFileName}`;
            }

            const pagePath = `db/${categoryKey}/${itemSlug}`;
            const formatter = categoryFormatters[categoryKey] || categoryFormatters['default'];
            const { title, description } = formatter(item);
            const targetDir = path.join(DIST_DIR, pagePath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(title, description, publicImageUrl, pagePath));
            sitemapEntries.push(`${BASE_URL}/${pagePath}`);
        }
    }

    fs.writeFileSync(path.join(DIST_DIR, '404.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><script>var path=window.location.pathname;window.location.replace("${BASE_PATH}/?redirect="+encodeURIComponent(path+window.location.search+window.location.hash));</script></head><body><p>Redirection...</p></body></html>`);
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${url.includes('/db/') ? '0.6' : '0.8'}</priority></url>`).join('\n')}</urlset>`;
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent);
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml`);
    console.log(`✅ Terminé : ${sitemapEntries.length} pages.`);
}

generate().catch(console.error);