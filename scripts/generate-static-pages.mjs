import fs from 'fs';
import path from 'path';

const DIST_DIR = './dist';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const BASE_URL = process.env.GITHUB_ACTIONS
    ? `https://${owner}.github.io/${repo}`
    : 'http://localhost:5173/BDDFr';

const BASE_PATH = process.env.GITHUB_ACTIONS ? `/${repo}` : '/BDDFr';

const pages = [
    { path: 'build-planner', title: 'Build Planner — BDDFr', description: 'Créez vos configurations d\'équipement.', icon:'favicon.png' },
    { path: 'changelog', title: 'Mises à jour — BDDFr', description: 'Historique des changements.', icon:'favicon.png' },
    { path: 'generator', title: 'Générateur — BDDFr', description: 'Outil de contribution.', icon:'favicon.png' }
];

const stubTemplate = (title, description, icon, pagePath) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${BASE_URL}/${icon}">
    <script>window.location.href = "${BASE_URL}/#/${pagePath}";</script>
</head>
<body>Redirection...</body>
</html>`;

const error404Template = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JTFr — BDDFr</title>
    <script type="text/javascript">
      var basePath = "${BASE_PATH}";
      var l = window.location;
      var segmentToRemove = basePath.replace(/^\\/+|\\/+$/g, '');
      var path = l.pathname.split('/').filter(function(s) { return s !== segmentToRemove && s !== ''; }).join('/');
      l.replace(l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + basePath + (basePath.endsWith('/') ? '' : '/') + '#/' + path + l.search + l.hash);
    </script>
</head>
<body>Redirection...</body>
</html>`;

async function generate() {
    console.log(`🚀 Configuration détectée : BASE_PATH=${BASE_PATH}`);
    for (const page of pages) {
        const targetDir = path.join(DIST_DIR, page.path);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'index.html'), stubTemplate(page.title, page.description, page.icon, page.path));
        console.log(`  ✅ Stub généré : ${page.path}`);
    }

    fs.writeFileSync(path.join(DIST_DIR, '404.html'), error404Template());
    console.log(`  ✅ 404.html généré avec redirection vers ${BASE_PATH}`);
}

generate().catch(console.error);