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

const getWpnType = (t) => weaponTypes[t] || { nom: t?.replace('_', ' ') };
const getGearType = (e) => gearTypes[e] || { nom: e };

function slugify(name) {
    if (!name) return '';
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

function parseJsonc(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const stripped = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
        return JSON.parse(stripped);
    } catch (e) {
        return null;
    }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
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
        const rarete = item.estExotique ? '🔴' : (item.estNomme ? '🟡' : '⚪');

        return {
            title: `${rarete} ${item.nom} (${typeInfo.nom}) — BDDFr`,
            description: item.description ||
                `Portée : ${item.portee || 0}m\n` +
                `Coups par minute : ${item.rpm || 0}\n` +
                `Taille du chargeur : ${item.chargeur || 0}\n` +
                `Temps de recharge : ${item.rechargement || 0}s\n` +
                `Dégâts de base : ${item.degatsBase || 0}\n` +
                `Dégâts headshot : +${item.headshot}%`
        };
    },
    'equipements': (item) => {
        const typeInfo = getGearType(item.emplacement);
        const rarete = item.estExotique ? '🔴' : (item.estNomme ? '🟡' : '⚪');

        return {
            title: `${rarete} ${item.nom} (${item.marque || 'Équipement'}) — BDDFr`,
            description: item.description || `Emplacement : ${typeInfo.nom}.`
        };
    },
    'ensembles': (item) => {
        const bonusList = Array.isArray(item.bonus)
            ? item.bonus.map((b, i) => `${i + 2}p : ${b}`).join('\n')
            : '';
        return {
            title: `🔗 Ensemble : ${item.nom} — BDDFr`,
            description: `${item.description || ''}\n\n**Bonus d'ensemble :**\n${bonusList}`
        };
    },
    'talentsArmes': (item) => ({
        title: `🎯 Talent d'arme : ${item.nom} — BDDFr`,
        description: item.description || item.perfectDescription || item.notes || "Effets et statistiques de ce talent d'arme."
    }),
    'talentsEquipements': (item) => ({
        title: `🏅 Talent d'équipement : ${item.nom} — BDDFr`,
        description: item.description || item.perfectDescription || item.notes || "Effets et statistiques de ce talent d'équipement."
    }),
    'competences': (item) => ({
        title: `⚡ Compétence : ${item.nom || item.competence} — BDDFr`,
        description: item.description || `Variante de la compétence ${item.competence}.`
    }),
    'attributs': (item) => ({
        title: `📊 Attribut : ${item.nom || item.categorie} — BDDFr`,
        description: item.description || `Détails et valeurs de l'attribut ${item.nom}.`
    }),
    'default': (item) => ({
        title: `${item.nom || item.competence || item.categorie || 'Élément'} — BDDFr`,
        description: item.description || item.notes || `Détails et statistiques.`
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
    const safeDesc = (description || '').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');

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
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${mainImageUrl}">
    <script>window.location.replace("${BASE_URL}/${pagePath}");</script>
</head>
<body>
    <p>Redirection vers <a href="${BASE_URL}/${pagePath}">${title}</a>...</p>
</body>
</html>`;
};

const error404Template = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png">
    <link rel="shortcut icon" href="${BASE_URL}/favicon.ico">
    <title>JTFr — BDDFr</title>
    <meta name="theme-color" content="${DIVISION_ORANGE}">
    <script type="text/javascript">
      var path = window.location.pathname;
      var search = window.location.search;
      var hash = window.location.hash;
      window.location.replace("${BASE_PATH}/?redirect=" + encodeURIComponent(path + search + hash));
    </script>
</head>
<body><p>Redirection en cours...</p></body></html>`;

async function generate() {
    const sitemapEntries = [];
    const today = new Date().toISOString().split('T')[0];
    sitemapEntries.push(`${BASE_URL}/`);

    for (const page of pages_fixes) {
        const targetDir = path.join(DIST_DIR, page.path);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(page.title, page.description, 'favicon.ico', page.path));
        sitemapEntries.push(`${BASE_URL}/${page.path}`);
    }

    const exportIconsDir = path.join(DIST_DIR, 'og-icons');
    if (!fs.existsSync(exportIconsDir)) fs.mkdirSync(exportIconsDir, { recursive: true });

    for (const [categoryKey, fileName] of Object.entries(categoryMap)) {
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) continue;

        const rawData = parseJsonc(filePath);
        if (!rawData) continue;

        const items = Array.isArray(rawData) ? rawData : Object.values(rawData);

        for (const item of items) {
            const itemName = item.nom || item.competence || item.categorie || 'Element';
            const itemSlug = item.slug || slugify(itemName);
            if (!itemSlug) continue;

            let iconPath = null;
            let resolvedFileName = null;

            const possibleIconKeys = [
                item.icone,
                itemSlug,
                item.marque,
                item.ensemble,
                item.type,
                item.emplacement
            ].filter(Boolean).map(key => slugify(key));

            for (const key of possibleIconKeys) {
                if (iconIndex[key]) {
                    iconPath = iconIndex[key];
                    resolvedFileName = `${key}.png`;
                    break;
                }
            }

            let publicImageUrl = 'favicon.ico';
            if (iconPath && resolvedFileName) {
                const destFilePath = path.join(exportIconsDir, resolvedFileName);
                if (!fs.existsSync(destFilePath)) {
                    fs.copyFileSync(iconPath, destFilePath);
                }
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

    fs.writeFileSync(path.join(DIST_DIR, '404.html'), error404Template());
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.includes('/db/') ? '0.6' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent);
    console.log(`\n  ✅ sitemap.xml généré avec ${sitemapEntries.length} entrées.`);

    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsContent);
    console.log(`  ✅ robots.txt généré.`);
}

generate().catch(console.error);