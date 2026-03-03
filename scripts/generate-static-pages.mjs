import fs from 'fs';
import path from 'path';

const DIST_DIR = './dist';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const BASE_URL = process.env.GITHUB_ACTIONS
    ? `https://${owner}.github.io/${repo}`
    : 'http://localhost:5173/BDDFr';

const BASE_PATH = process.env.GITHUB_ACTIONS ? `/${repo}` : '/BDDFr';

const DIVISION_ORANGE = "#ff8000";

const pages = [
    {
        path: 'build',
        title: 'Build Planner — BDDFr',
        description: 'Créez et partagez vos configurations d\'équipement pour The Division 2.',
        icon: 'favicon.png',
    },
    {
        path: 'changelog',
        title: 'Mises à jour — BDDFr',
        description: 'Historique des changements et nouveautés de la base de données.',
        icon: 'favicon.png'
    },
    {
        path: 'generator',
        title: 'Générateur — BDDFr',
        description: 'Outil de contribution pour ajouter des données à la BDDFr.',
        icon: 'favicon.png'
    }
];

const stubTemplate = (title, description, icon, largeImage, pagePath) => {
    const fullUrl = `${BASE_URL}/${pagePath}`;
    const iconUrl = `${BASE_URL}/${icon}`;

    const twitterCardType = largeImage ? 'summary_large_image' : 'summary';
    const mainImageUrl = largeImage ? `${BASE_URL}/${largeImage}` : iconUrl;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="${fullUrl}" />
    
    <meta name="theme-color" content="${DIVISION_ORANGE}">
    <meta name="description" content="${description}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${iconUrl}">

    <meta name="twitter:card" content="${twitterCardType}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    ${largeImage ? `<meta name="twitter:image" content="${mainImageUrl}">` : ''}

    <script>window.location.href = "${BASE_URL}/#/${pagePath}";</script>
</head>
<body>
    <p>Redirection vers <a href="${BASE_URL}/#/${pagePath}">${title}</a>...</p>
</body>
</html>`;
};

const error404Template = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JTFr — BDDFr</title>
    <meta name="theme-color" content="${DIVISION_ORANGE}">
    <meta http-equiv="refresh" content="0; URL='${BASE_URL}/'">
    <script type="text/javascript">
      window.location.replace("${BASE_URL}/");
    </script>
</head>
<body>
    <p>Redirection vers l'accueil...</p>
</body>
</html>`;

async function generate() {
    console.log(`🚀 Configuration détectée : BASE_PATH=${BASE_PATH}`);
    for (const page of pages) {
        const targetDir = path.join(DIST_DIR, page.path);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        fs.writeFileSync(
            path.join(targetDir, 'index.html'),
            stubTemplate(page.title, page.description, page.icon, page.largeImage, page.path)
        );
        console.log(`  ✅ Stub généré : ${page.path} (${page.largeImage ? 'Format Large' : 'Format Icône'})`);
    }

    fs.writeFileSync(path.join(DIST_DIR, '404.html'), error404Template());
    console.log(`  ✅ 404.html généré.`);
}

generate().catch(console.error);