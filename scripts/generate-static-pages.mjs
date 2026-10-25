/**
 * Pages statiques (sans captures d'ecran) : une page indexable par fiche, avec
 * balises Open Graph et embed Discord. Voir scripts/lib/site-pages.mjs.
 */
import { loadEmbedData, buildIconIndex } from './lib/discord-embed.mjs';
import { writeSitePages } from './lib/site-pages.mjs';

const DIST_DIR = './dist';
const DATA_DIR = './src/data';
const ASSETS_DIR = './src/img/game_assets';
const PAGES_DIR = './src/content/pages';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');
const DOMAIN = process.env.DOMAIN;
const VITE_BASE_PATH = process.env.VITE_BASE_PATH ? process.env.VITE_BASE_PATH.replace(/\/$/, '') : null;
const BASE_URL = VITE_BASE_PATH ? (DOMAIN ? (DOMAIN.startsWith('http') ? DOMAIN : `https://${DOMAIN}`) + VITE_BASE_PATH : VITE_BASE_PATH) : (DOMAIN ? (DOMAIN.startsWith('http') ? DOMAIN : `https://${DOMAIN}`) : (process.env.GITHUB_ACTIONS ? `https://${owner}.github.io/${repo}` : 'http://localhost:5173/BDDFr'));

const { pages } = writeSitePages({
    distDir: DIST_DIR,
    baseUrl: BASE_URL,
    data: loadEmbedData(DATA_DIR),
    iconIndex: buildIconIndex(ASSETS_DIR),
    pagesDir: PAGES_DIR,
});
console.log(`✅ Terminé : ${pages} pages indexables.`);
