/**
 * Pages statiques indexables pour GitHub Pages.
 *
 * Chaque URL publique (`/BDDFr/db/armes/acr/`) est servie par un vrai
 * `index.html` : une copie de l'app construite par Vite dont le <head> porte les
 * balises de la page (title, description, canonical, Open Graph, embed Discord)
 * et dont le #root contient deja le contenu de la page en HTML.
 *
 * Pourquoi : les anciennes pages faisaient `location.replace("/#/route")`.
 * Google suit cette redirection JS, ignore le fragment `#/route` et ne voit donc
 * qu'une redirection vers l'accueil : aucune page de la base n'etait indexee.
 * Ici il n'y a plus de redirection — l'app demarre directement sur le chemin
 * (URLCleaner traduit le chemin en route du HashRouter) et React remplace le
 * contenu pre-rendu au montage.
 */
import { describeItem, buildPlannerPath, pageUrl, CATEGORY_LABELS, renderEmbedTag } from './discord-embed.mjs';

const escapeHtml = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Markdown Discord (sous-ensemble utilise par les descriptions) -> HTML. */
export function markdownToHtml(md) {
    const inline = (line) => escapeHtml(line)
        .replace(/\\([\\*_~`|>#[\]])/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
    return String(md ?? '').split(/\n{2,}/).map(block => {
        const lines = block.split('\n');
        if (lines.every(l => l.startsWith('> '))) return `<blockquote>${lines.map(l => inline(l.slice(2))).join('<br>')}</blockquote>`;
        const line = (l) => {
            if (l.startsWith('-# ')) return `<small>${inline(l.slice(3))}</small>`;
            if (/^#{1,6}\s/.test(l)) return `<strong>${inline(l.replace(/^#+\s*/, ''))}</strong>`;
            return inline(l);
        };
        return `<p>${lines.map(line).join('<br>')}</p>`;
    }).join('');
}

/** Texte brut d'un markdown, pour les meta descriptions. */
export function markdownToText(md) {
    return String(md ?? '')
        .replace(/^(-#|>|#+)\s*/gm, '')
        .replace(/\*\*|__|\*|`|\\/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Pas d'emoji dans les extraits Google.
        .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const clip = (s, max) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[\s—·,:;-]+$/, '')}…`);

/** Titre de l'onglet / de Google : sans emoji de rarete, avec le nom du jeu. */
export function documentTitle(title) {
    const clean = String(title).replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+—\s+BDDFr$/, '');
    return clean === 'JTFr' || !clean ? 'JTFr — BDDFr · Base de données The Division 2' : `${clean} — The Division 2 | BDDFr`;
}

function breadcrumb(baseUrl, trail) {
    const links = [{ label: 'BDDFr', path: '' }, ...trail]
        .map(t => (t.path === undefined ? escapeHtml(t.label) : `<a href="${escapeHtml(pageUrl(baseUrl, t.path))}">${escapeHtml(t.label)}</a>`));
    return `<nav aria-label="Fil d'Ariane">${links.join(' › ')}</nav>`;
}

/**
 * Contenu et meta description d'une fiche de la base. Reutilise exactement le
 * contenu de l'embed Discord (`describeItem`) pour que les deux restent alignes.
 */
export function itemPageContent({ data, baseUrl, categoryKey, item, slug, variant = null }) {
    const d = describeItem(data, categoryKey, item, variant);
    const buildPath = buildPlannerPath(data, categoryKey, item, variant);
    const category = CATEGORY_LABELS[categoryKey] || categoryKey;
    const sections = [d.stats.length && markdownToHtml(d.stats.join('\n')), d.body && markdownToHtml(d.body), ...d.extra.map(markdownToHtml)]
        .filter(Boolean).join('');
    const html = `<main class="prerender">${breadcrumb(baseUrl, [{ label: 'Base de données', path: 'db' }, { label: category, path: `db/${categoryKey}` }, { label: d.name }])}`
        + `<h1>${escapeHtml(d.name)}</h1><p>${escapeHtml(markdownToText(d.subtitle))}</p>${sections}`
        + `<p><a href="${escapeHtml(pageUrl(baseUrl, `db/${categoryKey}/${slug}${variant ? `/${variant}` : ''}`))}">Ouvrir dans la base de données</a>`
        + `${buildPath ? ` · <a href="${escapeHtml(pageUrl(baseUrl, buildPath))}">Utiliser dans un build</a>` : ''}</p></main>`;
    const description = clip(markdownToText([d.subtitle, d.stats.join(' · '), d.body].filter(Boolean).join(' — ')), 160);
    return { html, description };
}

/** Page de liste (categorie, documents...) : liens vers toutes les fiches, pour l'exploration. */
export function listPageContent({ baseUrl, title, intro, trail = [], links = [] }) {
    const items = links.map(l => `<li><a href="${escapeHtml(pageUrl(baseUrl, l.path))}">${escapeHtml(l.label)}</a></li>`).join('');
    return `<main class="prerender">${breadcrumb(baseUrl, [...trail, { label: title }])}<h1>${escapeHtml(title)}</h1>`
        + `${intro ? markdownToHtml(intro) : ''}${items ? `<ul>${items}</ul>` : ''}</main>`;
}

const HEAD_TAGS_TO_REPLACE = [
    /[ \t]*<title>[\s\S]*?<\/title>\r?\n?/g,
    /[ \t]*<meta (?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>\r?\n?/g,
    /[ \t]*<link rel="canonical"[^>]*>\r?\n?/g,
    /[ \t]*<script id="discord:component-embed"[^>]*>[\s\S]*?<\/script>\r?\n?/g,
];

/**
 * Derive la page d'une URL depuis le index.html de Vite.
 * @param {string} template contenu de dist/index.html
 */
export function renderAppPage(template, { title, description, url, imageUrl, cardType = 'summary', embed = null, contentHtml = '' }) {
    let html = HEAD_TAGS_TO_REPLACE.reduce((acc, re) => acc.replace(re, ''), template);
    const desc = escapeHtml(description);
    const head = [
        `<title>${escapeHtml(documentTitle(title))}</title>`,
        `<meta name="description" content="${desc}">`,
        `<link rel="canonical" href="${escapeHtml(url)}">`,
        `<meta property="og:site_name" content="JTFr — BDDFr">`,
        `<meta property="og:locale" content="fr_FR">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:url" content="${escapeHtml(url)}">`,
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        `<meta property="og:description" content="${desc}">`,
        `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
        `<meta name="twitter:card" content="${cardType}">`,
        renderEmbedTag(embed),
    ].filter(Boolean).map(t => `  ${t}`).join('\n');
    if (!/<meta name="viewport"[^>]*>/.test(html)) throw new Error('index.html sans meta viewport : gabarit inattendu');
    html = html.replace(/(<meta name="viewport"[^>]*>)/, (m) => `${m}\n${head}`);
    // Marqueurs : le gabarit peut deja contenir un pre-rendu (les deux generateurs s'enchainent en CI).
    const root = /<div id="root">(?:<!--prerender-->[\s\S]*?<!--\/prerender-->)?<\/div>/;
    if (!root.test(html)) throw new Error('index.html sans <div id="root"></div> : gabarit inattendu');
    return html.replace(root, () => `<div id="root">${contentHtml ? `<!--prerender-->${contentHtml}<!--/prerender-->` : ''}</div>`);
}

export function sitemapXml(urls) {
    const entries = [...new Set(urls)].map(u => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
