/**
 * Ecriture de toutes les pages publiques dans dist/ (commune aux deux
 * generateurs : `generate-static-pages.mjs` et `generate-static-pages-images.mjs`,
 * ce dernier fournissant en plus les captures des cartes via `imageFor`).
 *
 * Produit : une page par fiche (et variante parfait / prototype / niveau),
 * les pages de categorie (listes de liens, utiles a l'exploration par Google),
 * les pages fixes, les documents, l'accueil, le 404 et le sitemap.
 */
import fs from 'fs';
import path from 'path';
import {
    loadCategoryItems, descenteLevels, exportItemIcon, itemEmbed, staticPageEmbed, documentEmbed,
    describeItem, latestChangelog, pageUrl, slugify, CATEGORY_LABELS, CATEGORY_FILES,
} from './discord-embed.mjs';
import { renderAppPage, itemPageContent, listPageContent, markdownToText, sitemapXml } from './static-page.mjs';

export const ITEM_CATEGORIES = [...Object.keys(CATEGORY_FILES), 'descente'];
const FALLBACK_IMAGE = 'favicon_150x150.png';

export function parseFrontmatter(rawContent) {
    const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { metadata: {}, content: rawContent };
    const metadata = {};
    match[1].split(/\r?\n/).forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key || !rest.length) return;
        let value = rest.join(':').trim();
        value = value.startsWith('[') && value.endsWith(']')
            ? value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
            : value.replace(/^['"]|['"]$/g, '');
        metadata[key.trim()] = value;
    });
    return { metadata, content: match[2] };
}

/** Variantes publiees d'une fiche : null = page principale. */
export function itemVariants(categoryKey, item) {
    if (categoryKey === 'descente') return descenteLevels(item);
    const variants = [null];
    if ((categoryKey === 'talentsArmes' || categoryKey === 'talentsEquipements') && !item.estExotique && item.perfectDescription) variants.push('parfait');
    if (categoryKey === 'armes' || categoryKey === 'equipements') variants.push('prototype');
    return variants;
}

/** Titre Open Graph / Discord de repli d'une fiche. */
export function itemTitle(data, categoryKey, item, variant) {
    const d = describeItem(data, categoryKey, item, variant);
    const rarity = item.estExotique || item.type === 'exotique' ? '🔴 ' : item.estNomme ? '🟡 ' : item.isSignature ? '🟠 ' : '';
    const suffix = variant === 'parfait' ? ' (Parfait)' : variant === 'prototype' ? ' (Prototype)' : '';
    return `${rarity}${d.name}${suffix} — BDDFr`;
}

function staticPages(data) {
    const latest = latestChangelog(data.metadata);
    return [
        { path: 'db', title: 'Base de données — BDDFr', description: 'Base de données française de The Division 2 : armes, équipements, ensembles, talents, compétences, attributs et mods.' },
        { path: 'build', title: 'Build Planner — BDDFr', description: "Créez et partagez vos configurations d'équipement pour The Division 2." },
        { path: 'library', title: 'Bibliothèque de builds — BDDFr', description: 'Builds The Division 2 partagés par la communauté francophone.' },
        { path: 'changelog', title: 'Mises à jour — BDDFr', description: latest ? `${latest.title} : ${markdownToText(latest.body)}`.slice(0, 160) : 'Historique des changements.' },
        { path: 'generator', title: 'Générateur — BDDFr', description: 'Outil de contribution à la base de données.' },
        { path: 'pages', title: 'Bibliothèque de Documents — BDDFr', description: 'Guides et documents du réseau SHD pour The Division 2.' },
    ];
}

/**
 * @param {object} opts
 * @param {string} opts.distDir
 * @param {string} opts.baseUrl     URL publique absolue (sans slash final)
 * @param {object} opts.data        loadEmbedData(...)
 * @param {object} opts.iconIndex   buildIconIndex(...)
 * @param {string} [opts.pagesDir]  dossier des documents markdown
 * @param {(categoryKey, slug, variant) => string|null} [opts.imageFor] chemin (relatif a la base) d'une capture
 * @returns {{ pages: number }}
 */
export function writeSitePages({ distDir, baseUrl, data, iconIndex, pagesDir, imageFor = () => null }) {
    const templatePath = path.join(distDir, 'index.html');
    if (!fs.existsSync(templatePath)) throw new Error(`${templatePath} introuvable : lancer \`vite build\` avant de generer les pages.`);
    // Gabarit lu une seule fois : l'accueil est reecrit plus bas a partir de lui.
    const template = fs.readFileSync(templatePath, 'utf-8');
    const sitemap = [];

    const write = (pagePath, { title, description, image, embed, contentHtml, indexable = true }) => {
        const url = pageUrl(baseUrl, pagePath);
        let html = renderAppPage(template, {
            title, description, url, embed, contentHtml,
            imageUrl: `${baseUrl}/${image || FALLBACK_IMAGE}`,
            cardType: image && image.startsWith('og-images/') ? 'summary_large_image' : 'summary',
        });
        if (!indexable) html = html.replace('</head>', '  <meta name="robots" content="noindex">\n</head>');
        const target = path.join(distDir, pagePath, 'index.html');
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html);
        if (indexable) sitemap.push(url);
    };

    // Fiches
    const itemsByCategory = {};
    for (const categoryKey of ITEM_CATEGORIES) {
        const items = loadCategoryItems(data, categoryKey);
        itemsByCategory[categoryKey] = [];
        for (const item of items) {
            const slug = item.slug || slugify(item.nom || item.variante || 'Element');
            if (!slug) continue;
            const icon = exportItemIcon(iconIndex, item, slug, distDir);
            const variants = itemVariants(categoryKey, item);
            itemsByCategory[categoryKey].push({ slug, label: describeItem(data, categoryKey, item, variants[0]).name.replace(/ — Niv\. .*$/, ''), path: `db/${categoryKey}/${slug}` });

            for (const variant of variants) {
                const capture = imageFor(categoryKey, slug, variant);
                const { html, description } = itemPageContent({ data, baseUrl, categoryKey, item, slug, variant });
                const page = {
                    title: itemTitle(data, categoryKey, item, variant),
                    description,
                    image: capture || icon,
                    embed: itemEmbed({ data, baseUrl, categoryKey, item, slug, variant, thumbnailPath: icon, imagePath: capture }),
                    contentHtml: html,
                };
                write(`db/${categoryKey}/${slug}${variant ? `/${variant}` : ''}`, page);
                // Descente : la fiche sans niveau affiche le premier niveau.
                if (categoryKey === 'descente' && variant === variants[0]) write(`db/descente/${slug}`, page);
            }
        }
    }

    // Categories : liste de liens vers chaque fiche
    for (const categoryKey of ITEM_CATEGORIES) {
        const label = CATEGORY_LABELS[categoryKey];
        const title = `${label} — BDDFr`;
        const links = [...itemsByCategory[categoryKey]].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
        write(`db/${categoryKey}`, {
            title,
            description: `${label} de The Division 2 : ${links.length} fiches détaillées en français (statistiques, talents, obtention).`,
            embed: staticPageEmbed({ data, baseUrl, pagePath: `db/${categoryKey}`, title }),
            contentHtml: listPageContent({ baseUrl, title: label, trail: [{ label: 'Base de données', path: 'db' }], links }),
        });
    }

    // Documents
    const documents = [];
    if (pagesDir && fs.existsSync(pagesDir)) {
        for (const file of fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'))) {
            const pageId = file.replace(/\.md$/, '');
            const { metadata: meta, content } = parseFrontmatter(fs.readFileSync(path.join(pagesDir, file), 'utf-8'));
            const label = meta.title || pageId;
            const wip = pageId.endsWith('.wip');
            if (!wip) documents.push({ label, path: `pages/${pageId}` });
            write(`pages/${pageId}`, {
                title: `${label} — BDDFr`,
                description: meta.description || `Document : ${label}`,
                embed: documentEmbed({ data, baseUrl, pageId, meta }),
                contentHtml: listPageContent({ baseUrl, title: label, trail: [{ label: 'Documents', path: 'pages' }], intro: [meta.description, content.slice(0, 1500)].filter(Boolean).join('\n\n') }),
                indexable: !wip,
            });
        }
    }

    // Pages fixes
    const sections = [
        { label: 'Base de données', path: 'db' },
        ...ITEM_CATEGORIES.map(k => ({ label: CATEGORY_LABELS[k], path: `db/${k}` })),
        { label: 'Build Planner', path: 'build' },
        { label: 'Bibliothèque de builds', path: 'library' },
        { label: 'Documents', path: 'pages' },
        { label: 'Mises à jour', path: 'changelog' },
    ];
    for (const p of staticPages(data)) {
        const label = p.title.replace(/\s+—\s+BDDFr$/, '');
        const links = p.path === 'db' ? sections.slice(1, ITEM_CATEGORIES.length + 1) : p.path === 'pages' ? documents : sections;
        write(p.path, {
            title: p.title,
            description: p.description,
            embed: staticPageEmbed({ data, baseUrl, pagePath: p.path, title: p.title }),
            contentHtml: listPageContent({ baseUrl, title: label, intro: p.description, links }),
            indexable: p.path !== 'generator',
        });
    }

    // Accueil (reecrit en place a partir du gabarit)
    write('', {
        title: 'JTFr — BDDFr',
        description: `${data.metadata?.titre || 'Base de données française — The Division 2'} : armes, équipements, ensembles, talents, compétences et mods, avec Build Planner et builds communautaires.`,
        embed: staticPageEmbed({ data, baseUrl, pagePath: '', title: 'JTFr — BDDFr' }),
        contentHtml: listPageContent({ baseUrl, title: data.metadata?.titre || 'Base de données française — The Division 2', links: sections }),
    });

    // 404 : l'app elle-meme (URLCleaner route le chemin demande) ; GitHub Pages
    // renvoie le statut 404, et noindex evite toute indexation.
    const notFound = renderAppPage(template, {
        title: 'Page introuvable — BDDFr', description: 'Page introuvable.', url: `${baseUrl}/`, imageUrl: `${baseUrl}/${FALLBACK_IMAGE}`,
    }).replace('</head>', '  <meta name="robots" content="noindex">\n</head>');
    fs.writeFileSync(path.join(distDir, '404.html'), notFound);

    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml(sitemap));
    // N'est lu par aucun moteur sur un site de projet (robots.txt n'est consulte
    // qu'a la racine du domaine) : le sitemap doit etre soumis dans la Search Console.
    fs.writeFileSync(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);

    return { pages: sitemap.length };
}
