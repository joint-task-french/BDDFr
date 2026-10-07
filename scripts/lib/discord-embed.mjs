/**
 * Embeds Discord "component embeds" pour les pages statiques (GitHub Pages).
 *
 * Doc : https://docs.discord.com/developers/link-previews/component-embeds
 *
 * Le crawler de Discord n'execute pas de JS : la charge utile doit etre dans le
 * HTML servi. On l'inline dans chaque page stub via
 * `<script id="discord:component-embed" type="application/json">`, a cote des
 * balises Open Graph qui restent le repli si le payload est refuse.
 *
 * Contraintes Discord a respecter (toute violation = pas d'embed du tout) :
 * - un seul Container (type 17) a la racine, sans Container imbrique ;
 * - 40 composants max (Container inclus), 10 items de Media Gallery max ;
 * - boutons en style lien (5) uniquement, cles autorisees seulement ;
 * - payload <= 3000 octets (sequences d'echappement comprises) ;
 * - URLs de media http(s) absolues, <= 2048 caracteres.
 *
 * Ce module est la seule source du format : les deux generateurs
 * (`generate-static-pages*.mjs`) l'appellent, et `discord-embed.test.js`
 * verifie ces contraintes sur l'ensemble des donnees reelles.
 */
import fs from 'fs';
import path from 'path';
import { parse as parseJsoncText } from 'jsonc-parser';
import { encodeBuild } from '../../src/utils/buildShare.js';

export const MAX_PAYLOAD_BYTES = 3000;
export const MAX_COMPONENTS = 40;
export const MAX_GALLERY_ITEMS = 10;
export const MAX_URL_LENGTH = 2048;

export const COMPONENT = {
    ACTION_ROW: 1,
    BUTTON: 2,
    SECTION: 9,
    TEXT_DISPLAY: 10,
    THUMBNAIL: 11,
    MEDIA_GALLERY: 12,
    SEPARATOR: 14,
    CONTAINER: 17,
};

const BUTTON_STYLE_LINK = 5;

export const ACCENT = {
    default: 0xff8000, // orange Division
    exotique: 0xe0442c,
    nomme: 0xe6b422,
    signature: 0xff8000,
    gearSet: 0x34b36a,
    marque: 0xa0a0a0,
    offensif: 0xd64545,
    defensif: 0x3c82e6,
    utilitaire: 0xe6c229,
    descente: 0x8e5bd9,
};

/* ------------------------------------------------------------------------ */
/* Lecture des donnees                                                      */
/* ------------------------------------------------------------------------ */

/** Meme parseur que le runtime et la validation (cf. AGENTS.md). */
export function readJsonc(filePath) {
    try {
        const errors = [];
        const data = parseJsoncText(fs.readFileSync(filePath, 'utf-8'), errors, { allowTrailingComma: true });
        return errors.length ? null : data;
    } catch {
        return null;
    }
}

export function slugify(name) {
    if (!name) return '';
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Fichier source de chaque categorie de la DB (chemins relatifs a src/data). */
export const CATEGORY_FILES = {
    armes: 'armes/armes.jsonc',
    equipements: 'equipements/equipements.jsonc',
    ensembles: 'equipements/ensembles.jsonc',
    competences: 'competences.jsonc',
    attributs: 'attributs/attributs.jsonc',
    talentsArmes: 'armes/talents-armes.jsonc',
    talentsEquipements: 'equipements/talents-equipements.jsonc',
    talentsPrototypes: 'talents-prototypes.jsonc',
    modsArmes: 'armes/mods-armes.jsonc',
    modsEquipements: 'equipements/mods-equipements.jsonc',
    modsCompetences: 'mods-competences.jsonc',
};

export const CATEGORY_LABELS = {
    armes: 'Armes',
    equipements: 'Équipements',
    ensembles: 'Ensembles',
    competences: 'Compétences',
    attributs: 'Attributs',
    talentsArmes: "Talents d'armes",
    talentsEquipements: "Talents d'équipements",
    talentsPrototypes: 'Talents Prototypes',
    modsArmes: "Mods d'armes",
    modsEquipements: "Mods d'équipements",
    modsCompetences: 'Mods de compétences',
    descente: 'Descente',
};

/** Charge toutes les tables utiles aux embeds (une seule fois par build). */
export function loadEmbedData(dataDir) {
    const read = (rel) => readJsonc(path.join(dataDir, rel)) || {};
    const competencesRaw = read('competences.jsonc');
    return {
        dataDir,
        metadata: read('metadata.jsonc'),
        weaponTypes: read('armes/armes-type.jsonc'),
        gearTypes: read('equipements/equipements-type.jsonc'),
        modWeaponTypes: read('armes/mods-armes-type.jsonc'),
        attributeTypes: read('attributs/attributs-type.jsonc'),
        attributs: read('attributs/attributs.jsonc'),
        ensembles: read('equipements/ensembles.jsonc'),
        talentsArmes: read('armes/talents-armes.jsonc'),
        talentsEquipements: read('equipements/talents-equipements.jsonc'),
        armes: read('armes/armes.jsonc'),
        equipements: read('equipements/equipements.jsonc'),
        classSpe: read('class-spe.jsonc'),
        competences: competencesRaw,
    };
}

/**
 * Items d'une categorie, a plat et avec leur slug (meme enumeration que les
 * pages statiques : variantes de competences a plat, armes de specialisation
 * ajoutees aux armes, descente reconstituee depuis les deux talents).
 */
export function loadCategoryItems(data, categoryKey) {
    const withSlugs = (obj) => Array.isArray(obj) ? obj : Object.entries(obj || {}).map(([slug, v]) => ({ ...v, slug }));

    if (categoryKey === 'descente') {
        return [...withSlugs(data.talentsArmes), ...withSlugs(data.talentsEquipements)].filter(i => i.descente?.levels);
    }
    if (categoryKey === 'competences') {
        const items = [];
        Object.entries(data.competences || {}).forEach(([skillSlug, skill]) => {
            (skill.variantes || []).forEach(v => items.push({ ...v, competence: skill.competence, skillSlug }));
        });
        return items;
    }
    const raw = readJsonc(path.join(data.dataDir, CATEGORY_FILES[categoryKey]));
    if (!raw) return [];
    const items = withSlugs(raw);
    if (categoryKey === 'armes') {
        Object.entries(data.classSpe || {}).forEach(([speKey, spe]) => {
            if (spe?.arme?.nom) items.push({ ...spe.arme, slug: slugify(spe.arme.nom), isSignature: true, speNom: spe.nom, speKey });
        });
    }
    return items;
}

/** Niveaux de descente tries (hors gabarit `base`). */
export function descenteLevels(item) {
    return Object.keys(item.descente?.levels || {}).filter(k => k !== 'base').sort((a, b) => parseInt(a) - parseInt(b));
}

/* ------------------------------------------------------------------------ */
/* Mise en forme du texte                                                   */
/* ------------------------------------------------------------------------ */

const nf = new Intl.NumberFormat('fr-FR');
const num = (v) => (typeof v === 'number' ? nf.format(v).replace(/\u202f|\u00a0/g, ' ') : String(v ?? ''));

/** Neutralise le markdown Discord dans un nom (pas dans les descriptions, qui en contiennent deja). */
export function escapeMd(text) {
    return String(text ?? '').replace(/([\\*_~`|>#[\]])/g, '\\$1').replace(/"/g, '');
}

export function truncate(text, max) {
    const s = String(text ?? '').trim();
    if (s.length <= max) return s;
    if (max <= 1) return '';
    const cut = s.slice(0, max - 1);
    const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf(' '));
    let out = (lastBreak > max * 0.6 ? cut.slice(0, lastBreak) : cut).trimEnd();
    // Ne pas laisser un `**` ouvert : Discord afficherait les asterisques.
    if ((out.match(/\*\*/g) || []).length % 2) out = out.replace(/\*\*(?!.*\*\*)/s, '');
    return `${out}…`;
}

/** Description de jeu -> markdown Discord (supprime le HTML eventuel). */
const cleanDesc = (text) => String(text ?? '').replace(/<[^>]+>/g, '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();

const fillTemplate = (template, values) => String(template ?? '').replace(/\{(\w+)\}/g, (m, k) => (values[k] ?? m));

const quote = (text) => text.split('\n').map(l => `> ${l}`).join('\n');

function attributeLine(data, entry) {
    if (!entry || typeof entry !== 'object') return null;
    const slug = entry.slug || entry.attribut || entry.nom;
    if (!slug) return null;
    const def = data.attributs?.[slug];
    const name = def?.nom || slug.replace(/_/g, ' ');
    const value = entry.valeur ?? entry.value;
    const unit = def?.unite ?? '';
    if (value === undefined) {
        return def && def.max !== undefined ? `${escapeMd(name)} *(jusqu'à ${num(def.max)}${unit})*` : escapeMd(name);
    }
    const sign = typeof value === 'number' && value > 0 ? '+' : '';
    return `**${sign}${num(value)}${unit}** ${escapeMd(name)}`;
}

const talentName = (data, slug) => data.talentsArmes?.[slug]?.nom || data.talentsEquipements?.[slug]?.nom || slug;
const categoryName = (data, key) => data.attributeTypes?.[key]?.nom || key;

/* ------------------------------------------------------------------------ */
/* Contenu par categorie                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Decrit un item pour l'embed.
 * @returns {{ name, subtitle, accent, stats: string[], body: string, extra: string[] }}
 *   - stats : lignes courtes affichees a cote de la miniature ;
 *   - body : texte principal (description / bonus), tronque si besoin ;
 *   - extra : informations secondaires, sacrifiees en premier.
 */
export function describeItem(data, categoryKey, item, variant = null) {
    const d = {
        name: item.nom || item.competence || item.variante || item.slug,
        subtitle: CATEGORY_LABELS[categoryKey] || '',
        accent: ACCENT.default,
        stats: [],
        body: '',
        extra: [],
    };

    switch (categoryKey) {
        case 'armes': {
            const type = data.weaponTypes?.[item.type];
            const rarity = item.estExotique ? 'Exotique' : item.estNomme ? 'Nommée' : item.isSignature ? `Arme de spécialisation · ${item.speNom}` : null;
            d.accent = item.estExotique ? ACCENT.exotique : item.estNomme ? ACCENT.nomme : item.isSignature ? ACCENT.signature : ACCENT.default;
            d.subtitle = [`${type?.emoji ? type.emoji + ' ' : ''}${type?.nom || 'Arme'}`, item.fabricant, rarity, variant === 'prototype' && 'Prototype'].filter(Boolean).join(' · ');
            d.stats = [
                item.degatsBase !== undefined && `💥 Dégâts : **${num(item.degatsBase)}**`,
                item.rpm !== undefined && `🔁 Cadence : **${num(item.rpm)}** CPM`,
                item.chargeur !== undefined && `📦 Chargeur : **${num(item.chargeur)}**`,
                item.rechargement !== undefined && `⏱️ Rechargement : **${num(item.rechargement)} s**`,
                item.portee !== undefined && `📏 Portée optimale : **${num(item.portee)} m**`,
                item.headshot !== undefined && `🎯 Headshot : **+${num(item.headshot)} %**`,
            ].filter(Boolean);
            const talents = (item.talents || []).map(t => {
                const tal = data.talentsArmes?.[t];
                return `**Talent : ${escapeMd(tal?.nom || t)}**${tal?.description ? `\n${truncate(cleanDesc(tal.description), 260)}` : ''}`;
            });
            d.body = talents.join('\n\n');
            if (item.description) d.extra.push(quote(`*${truncate(cleanDesc(item.description).replace(/\*/g, ''), 220)}*`));
            if (item.notes) d.extra.push(`-# ${escapeMd(item.notes)}`);
            break;
        }
        case 'equipements': {
            const slot = data.gearTypes?.[item.emplacement];
            const brand = data.ensembles?.[item.marque]?.nom || item.marque;
            const kind = item.type === 'exotique' ? 'Exotique' : item.type === 'gear_set' ? "Pièce d'ensemble" : item.type === 'improvise' ? 'Improvisé' : item.estNomme ? 'Nommé' : null;
            d.accent = item.type === 'exotique' ? ACCENT.exotique : item.estNomme ? ACCENT.nomme : item.type === 'gear_set' ? ACCENT.gearSet : ACCENT.default;
            d.subtitle = [`${slot?.emoji ? slot.emoji + ' ' : ''}${slot?.nom || item.emplacement || 'Équipement'}`, brand, kind, variant === 'prototype' && 'Prototype'].filter(Boolean).join(' · ');
            const core = (item.attributEssentiel || []).map(k => categoryName(data, k));
            if (core.length) d.stats.push(`⭐ Attribut essentiel : **${core.join(', ')}**`);
            (item.attributs || []).map(a => attributeLine(data, a)).filter(Boolean).forEach(l => d.stats.push(`• ${l}`));
            if (item.mod !== undefined) d.stats.push(`🔧 Emplacement de mod : **${item.mod ? 'oui' : 'non'}**`);
            const talents = (item.talents || []).map(t => {
                const tal = data.talentsEquipements?.[t] || data.talentsArmes?.[t];
                return `**Talent : ${escapeMd(tal?.nom || t)}**${tal?.description ? `\n${truncate(cleanDesc(tal.description), 260)}` : ''}`;
            });
            d.body = talents.join('\n\n');
            if (item.description) d.extra.push(quote(`*${truncate(cleanDesc(item.description).replace(/\*/g, ''), 220)}*`));
            break;
        }
        case 'ensembles': {
            const isSet = item.type === 'gear_set';
            d.accent = isSet ? ACCENT.gearSet : ACCENT.marque;
            const core = (item.attributsEssentiels || []).map(k => categoryName(data, k));
            d.subtitle = [isSet ? "🧩 Ensemble d'équipement" : '🏷️ Marque', core.length && `Essentiel : ${core.join(', ')}`].filter(Boolean).join(' · ');
            const lines = [];
            for (let i = 1; i <= 4; i++) {
                const bonus = item[`bonus${i}piece`] || item[`bonus${i}pieces`];
                if (!bonus) continue;
                const parts = (bonus.attributs || []).map(a => attributeLine(data, a)).filter(Boolean);
                if (bonus.talent) parts.push(`Talent **${escapeMd(talentName(data, bonus.talent))}**`);
                if (typeof bonus === 'string') parts.push(bonus);
                if (parts.length) lines.push(`**${i} pièce${i > 1 ? 's' : ''}** : ${parts.join(', ')}`);
            }
            d.body = lines.length ? `__Bonus__\n${lines.join('\n')}` : '';
            if (item.talentTorse) d.stats.push(`🦺 Torse : **${escapeMd(talentName(data, item.talentTorse))}**`);
            if (item.talentSac) d.stats.push(`🎒 Sac : **${escapeMd(talentName(data, item.talentSac))}**`);
            if (item.description) d.extra.push(truncate(cleanDesc(item.description), 300));
            break;
        }
        case 'competences': {
            d.name = `${item.competence} — ${item.variante}`;
            d.subtitle = '⚡ Compétence';
            if (item.expertise) d.stats.push(`🎓 Expertise : **${escapeMd(item.expertise)}**`);
            d.body = item.statistiques ? `__Statistiques__\n${cleanDesc(item.statistiques)}` : '';
            if (item.surcharge) d.extra.push(`__Surcharge__\n${cleanDesc(item.surcharge)}`);
            break;
        }
        case 'attributs': {
            const cat = data.attributeTypes?.[item.categorie];
            d.accent = ACCENT[item.categorie] || ACCENT.default;
            d.subtitle = [`📊 Attribut ${cat?.nom ? cat.nom.toLowerCase() : ''}`.trim(), item.estEssentiel && 'Essentiel', (item.cible || []).length && `Cible : ${item.cible.join(', ')}`].filter(Boolean).join(' · ');
            if (item.min !== undefined || item.max !== undefined) d.stats.push(`📈 Valeurs : **${num(item.min)} – ${num(item.max)}${item.unite || ''}**`);
            if (item.prototypeMax !== undefined) d.stats.push(`🧪 Max prototype : **${num(item.prototypeMax)}${item.unite || ''}**`);
            d.body = cleanDesc(item.description);
            break;
        }
        case 'talentsArmes':
        case 'talentsEquipements': {
            const parfait = variant === 'parfait' && item.perfectDescription;
            d.accent = item.estExotique ? ACCENT.exotique : parfait ? ACCENT.nomme : ACCENT.default;
            if (categoryKey === 'talentsArmes') {
                const compat = Object.entries(item.compatibilite || {}).filter(([, ok]) => ok).map(([k]) => data.weaponTypes?.[k]?.nom || k);
                d.subtitle = ['🔫 Talent d\'arme', item.estExotique && 'Exotique', parfait && 'Parfait'].filter(Boolean).join(' · ');
                if (compat.length) d.extra.push(`-# Compatible : ${compat.join(', ')}`);
            } else {
                const slot = data.gearTypes?.[item.emplacement];
                d.subtitle = ['🛡️ Talent d\'équipement', slot?.nom, item.estExotique && 'Exotique', parfait && 'Parfait'].filter(Boolean).join(' · ');
            }
            d.body = cleanDesc(parfait ? item.perfectDescription : item.description);
            const holders = parfait
                ? (item.armesParfaites || []).map(s => data.armes?.[s]?.nom || s).concat((item.equipementsParfaits || []).map(s => data.equipements?.[s]?.nom || s))
                : [];
            if (holders.length) d.stats.push(`🟡 Porté par : **${holders.map(escapeMd).join(', ')}**`);
            if (item.notes) d.extra.push(`-# ${escapeMd(item.notes)}`);
            break;
        }
        case 'talentsPrototypes': {
            d.subtitle = '🧪 Talent prototype';
            d.accent = ACCENT.descente;
            const range = `${num(item.statMin)}–${num(item.statMax)}`;
            d.stats.push(`📈 Valeur : **${range}**${item.pas ? ` (pas de ${num(item.pas)})` : ''}`);
            d.body = cleanDesc(fillTemplate(item.description, { value: range }));
            break;
        }
        case 'modsArmes': {
            const slot = data.modWeaponTypes?.[item.type]?.nom || item.type;
            d.subtitle = ['🔩 Mod d\'arme', slot].filter(Boolean).join(' · ');
            (item.attributs || []).map(a => attributeLine(data, a)).filter(Boolean).forEach(l => d.stats.push(`• ${l}`));
            break;
        }
        case 'modsEquipements': {
            const cat = data.attributeTypes?.[item.categorie];
            d.accent = ACCENT[item.categorie] || ACCENT.default;
            d.subtitle = ['🔧 Mod d\'équipement', cat?.nom].filter(Boolean).join(' · ');
            (item.attributs || []).map(a => attributeLine(data, a)).filter(Boolean).forEach(l => d.stats.push(`• ${l}`));
            break;
        }
        case 'modsCompetences': {
            const skill = data.competences?.[item.competence]?.competence || item.competence;
            d.name = `${item.nom} (${skill})`;
            d.subtitle = ['⚙️ Mod de compétence', skill, item.emplacement].filter(Boolean).join(' · ');
            (item.attributs || []).map(a => attributeLine(data, a)).filter(Boolean).forEach(l => d.stats.push(`• ${l}`));
            if (item.prerequis) d.stats.push(`🔒 Prérequis : **${escapeMd(item.prerequis)}**`);
            break;
        }
        case 'descente': {
            const level = variant || descenteLevels(item)[0];
            const desc = item.descente;
            d.accent = ACCENT[desc.categorie] || ACCENT.descente;
            d.name = `${item.nom} — Niv. ${level}`;
            d.subtitle = ['🧬 Talent Descente', desc.categorie && (categoryName(data, desc.categorie) || desc.categorie)].filter(Boolean).join(' · ');
            if ((desc.boucles || []).length) d.stats.push(`🔁 Boucles : **${desc.boucles.join(', ')}**`);
            const values = desc.levels?.[level];
            const template = desc.levels?.base || item.description;
            d.body = cleanDesc(values && typeof values === 'object' ? fillTemplate(template, values) : template);
            break;
        }
        default:
            d.body = cleanDesc(item.description);
    }
    return d;
}

/* ------------------------------------------------------------------------ */
/* Construction du payload                                                  */
/* ------------------------------------------------------------------------ */

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u) && u.length <= MAX_URL_LENGTH;

const button = ({ label, url, emoji }) => {
    const b = { type: COMPONENT.BUTTON, style: BUTTON_STYLE_LINK, label: truncate(label, 80), url };
    if (emoji) b.emoji = { name: emoji };
    return b;
};

/**
 * Assemble le Container. Les sections vides sont omises.
 * @param {object} spec
 * @param {string} spec.title         nom affiche en titre
 * @param {string} [spec.subtitle]    ligne sous le titre
 * @param {string[]} [spec.stats]     lignes a cote de la miniature
 * @param {string} [spec.body]        texte principal
 * @param {string[]} [spec.extra]     texte secondaire (sacrifie en premier)
 * @param {string} [spec.thumbnailUrl]
 * @param {string[]} [spec.imageUrls] images grand format (Media Gallery)
 * @param {Array<Array<{label,url,emoji?}>>} [spec.buttonRows] 5 boutons max par rangee
 * @param {string} [spec.footer]
 * @param {number} [spec.accent]
 */
function assemble(spec, limits) {
    const components = [];
    const heading = [`## ${escapeMd(spec.title)}`, spec.subtitle && `-# ${spec.subtitle}`].filter(Boolean).join('\n');
    const stats = (spec.stats || []).slice(0, limits.stats).join('\n');
    const headTexts = [heading, stats].filter(Boolean).map(content => ({ type: COMPONENT.TEXT_DISPLAY, content }));

    if (isHttpUrl(spec.thumbnailUrl)) {
        components.push({
            type: COMPONENT.SECTION,
            components: headTexts,
            accessory: { type: COMPONENT.THUMBNAIL, media: { url: spec.thumbnailUrl }, description: truncate(spec.title, 256) },
        });
    } else {
        components.push(...headTexts);
    }

    const body = truncate(spec.body, limits.body);
    const extra = limits.extra ? (spec.extra || []).map(e => truncate(e, limits.extra)).filter(Boolean).join('\n') : '';
    if (body || extra) {
        components.push({ type: COMPONENT.SEPARATOR, spacing: 1 });
        if (body) components.push({ type: COMPONENT.TEXT_DISPLAY, content: body });
        if (extra) components.push({ type: COMPONENT.TEXT_DISPLAY, content: extra });
    }

    const images = (spec.imageUrls || []).filter(isHttpUrl).slice(0, Math.min(limits.images, MAX_GALLERY_ITEMS));
    if (images.length) components.push({ type: COMPONENT.MEDIA_GALLERY, items: images.map(url => ({ media: { url } })) });

    if (spec.footer) {
        components.push({ type: COMPONENT.SEPARATOR, spacing: 1 });
        components.push({ type: COMPONENT.TEXT_DISPLAY, content: `-# ${spec.footer}` });
    }

    let budget = limits.buttons;
    (spec.buttonRows || []).forEach(row => {
        const buttons = row.filter(b => b && b.label && isHttpUrl(b.url)).slice(0, Math.min(5, budget));
        budget -= buttons.length;
        if (buttons.length) components.push({ type: COMPONENT.ACTION_ROW, components: buttons.map(button) });
    });

    const container = { type: COMPONENT.CONTAINER, components };
    if (Number.isInteger(spec.accent)) container.accent_color = spec.accent;
    return { component: container };
}

export const serializePayload = (payload) => JSON.stringify(payload)
    // `</script>` ou `<!--` dans une description casserait le HTML hote.
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export const payloadBytes = (payload) => Buffer.byteLength(serializePayload(payload), 'utf-8');

export function countComponents(node) {
    if (!node || typeof node !== 'object') return 0;
    let n = node.type ? 1 : 0;
    (node.components || []).forEach(c => { n += countComponents(c); });
    if (node.accessory) n += countComponents(node.accessory);
    return n;
}

/**
 * Construit un payload garanti conforme : on degrade progressivement
 * (texte secondaire, description, stats, boutons, images) jusqu'a passer sous
 * les 3000 octets et 40 composants. Retourne null si l'URL de base n'est pas
 * absolue (Discord refuserait les liens et medias).
 */
export function buildComponentEmbed(spec) {
    const steps = [
        { body: 900, extra: 300, stats: 12, buttons: 10, images: 4 },
        { body: 700, extra: 200, stats: 10, buttons: 10, images: 4 },
        { body: 500, extra: 120, stats: 8, buttons: 8, images: 2 },
        { body: 380, extra: 0, stats: 8, buttons: 6, images: 1 },
        { body: 260, extra: 0, stats: 6, buttons: 5, images: 1 },
        { body: 160, extra: 0, stats: 4, buttons: 4, images: 1 },
        { body: 80, extra: 0, stats: 3, buttons: 3, images: 1 },
        { body: 0, extra: 0, stats: 0, buttons: 2, images: 0 },
    ];
    for (const limits of steps) {
        const payload = assemble(spec, limits);
        if (payloadBytes(payload) <= MAX_PAYLOAD_BYTES && countComponents(payload.component) <= MAX_COMPONENTS) return payload;
    }
    return null;
}

export function renderEmbedTag(payload) {
    if (!payload) return '';
    return `<script id="discord:component-embed" type="application/json">${serializePayload(payload)}</script>`;
}

/* ------------------------------------------------------------------------ */
/* Fabriques haut niveau utilisees par les generateurs                      */
/* ------------------------------------------------------------------------ */

const isAbsoluteBase = (baseUrl) => /^https?:\/\//i.test(baseUrl || '');

/**
 * URL publique d'une page. GitHub Pages sert chaque page depuis
 * `<chemin>/index.html` et redirige (301) `<chemin>` vers `<chemin>/` : on vise
 * directement la forme avec slash final (liens, canonical, sitemap).
 * Les fichiers (images...) gardent leur chemin tel quel.
 */
export function pageUrl(baseUrl, pagePath = '') {
    const [p, query = ''] = String(pagePath).split(/(?=\?)/);
    if (!p) return `${baseUrl}/${query}`;
    if (/\.[a-z0-9]+$/i.test(p)) return `${baseUrl}/${pagePath}`;
    return `${baseUrl}/${p.replace(/\/+$/, '')}/${query}`;
}

const FOOTER = 'JTFr — BDDFr';

const GEAR_ORDER = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres'];

/**
 * Lien vers le Build Planner avec l'item pre-selectionne, encode au format de
 * partage de l'app (`build?b=`, cf. src/utils/buildShare.js). Seuls les items
 * qui occupent un emplacement de build en ont un : armes, equipements,
 * competences. Retourne null sinon.
 */
export function buildPlannerPath(data, categoryKey, item, variant = null) {
    const state = {};
    if (categoryKey === 'armes') {
        if (item.isSignature) {
            state.specialWeapon = { slug: item.slug };
        } else if (data.weaponTypes?.[item.type]?.type === 'secondaire') {
            state.sidearm = { slug: item.slug };
            if (variant === 'prototype') state.prototypes = { sidearm: true };
        } else {
            state.weapons = [{ slug: item.slug }, null];
            if (variant === 'prototype') state.prototypes = { weapon0: true };
        }
    } else if (categoryKey === 'equipements') {
        if (!GEAR_ORDER.includes(item.emplacement)) return null;
        state.gear = { [item.emplacement]: { slug: item.slug } };
        if (variant === 'prototype') state.prototypes = { [item.emplacement]: true };
    } else if (categoryKey === 'competences') {
        if (!item.skillSlug) return null;
        state.skills = [{ competenceSlug: item.skillSlug, slug: item.slug }, null];
    } else {
        return null;
    }
    const encoded = encodeBuild(state);
    return encoded ? `build?b=${encoded}` : null;
}

/** Pages d'un item de la DB (y compris variantes parfait / prototype / niveau de descente). */
export function itemEmbed({ data, baseUrl, categoryKey, item, slug, variant = null, thumbnailPath = null, imagePath = null }) {
    if (!isAbsoluteBase(baseUrl)) return null;
    const d = describeItem(data, categoryKey, item, variant);
    const url = (p) => pageUrl(baseUrl, p);
    const pagePath = `db/${categoryKey}/${slug}${variant ? `/${variant}` : ''}`;

    const main = [{ label: 'Ouvrir dans la BDD', url: url(pagePath), emoji: '🔎' }];
    const buildPath = buildPlannerPath(data, categoryKey, item, variant);
    if (buildPath) main.push({ label: 'Utiliser dans un build', url: url(buildPath), emoji: '🛠️' });

    const rows = [main];
    if (categoryKey === 'descente') {
        const current = variant || descenteLevels(item)[0];
        rows.push(descenteLevels(item).filter(l => l !== current).slice(0, 5)
            .map(l => ({ label: `Niv. ${l}`, url: url(`db/descente/${slug}/${l}`) })));
    }

    return buildComponentEmbed({
        title: d.name,
        subtitle: d.subtitle,
        stats: d.stats,
        body: d.body,
        extra: d.extra,
        accent: d.accent,
        thumbnailUrl: thumbnailPath ? url(thumbnailPath) : url('favicon_150x150.png'),
        imageUrls: imagePath ? [url(imagePath)] : [],
        buttonRows: rows,
        footer: FOOTER,
    });
}

/** Pages hors DB (build, changelog, documents, accueil...). */
export function pageEmbed({ baseUrl, pagePath, title, subtitle, body, stats, buttons = [], imagePath = null, openButton = true }) {
    if (!isAbsoluteBase(baseUrl)) return null;
    const url = (p) => pageUrl(baseUrl, p);
    return buildComponentEmbed({
        title,
        subtitle,
        stats,
        body,
        accent: ACCENT.default,
        thumbnailUrl: url('favicon_150x150.png'),
        imageUrls: imagePath ? [url(imagePath)] : [],
        buttonRows: [[
            openButton && { label: 'Ouvrir', url: url(pagePath), emoji: '🔎' },
            ...buttons.map(b => ({ ...b, url: url(b.path) })),
        ].filter(Boolean)],
        footer: FOOTER,
    });
}

/** Resume markdown de la derniere entree du changelog. */
export function latestChangelog(metadata) {
    const entries = metadata?.changelog || [];
    if (!entries.length) return null;
    const dateOf = (e) => (typeof e.date === 'string' ? e.date : (e.date?.to || e.date?.from || ''));
    const latest = entries.reduce((a, b) => (dateOf(b) > dateOf(a) ? b : a));
    const lines = (latest.changements || []).map(ch => {
        if (typeof ch === 'string') return `• ${ch}`;
        const desc = Array.isArray(ch?.description) ? ch.description.join(' ') : (ch?.description || '');
        return `• ${ch?.titre ? `**${escapeMd(ch.titre)}** ` : ''}${desc}`.trim();
    }).filter(l => l.length > 2);
    return { title: latest.patch || latest.titre || 'Dernière mise à jour', date: dateOf(latest), body: cleanDesc(lines.join('\n')) };
}

/** Pages statiques communes aux deux generateurs. */
export function staticPageEmbed({ data, baseUrl, pagePath, title }) {
    const plain = title.replace(/\s+—\s+BDDFr$/, '');
    switch (pagePath) {
        case '':
            return pageEmbed({
                // Pas de bouton "Ouvrir" : il ferait doublon avec "Base de donnees".
                data, baseUrl, pagePath, title: 'JTFr — BDDFr', openButton: false,
                subtitle: data.metadata?.titre || 'Base de données française — The Division 2',
                stats: [data.metadata?.version && `📌 Version du jeu : **${data.metadata.version}**`].filter(Boolean),
                body: 'Armes, équipements, ensembles, talents, compétences et mods — en français, avec un Build Planner et une bibliothèque de builds communautaires.',
                buttons: [
                    { label: 'Base de données', path: 'db', emoji: '📚' },
                    { label: 'Build Planner', path: 'build', emoji: '🛠️' },
                    { label: 'Builds', path: 'library', emoji: '📂' },
                    { label: 'Mises à jour', path: 'changelog', emoji: '📰' },
                    { label: 'Documents', path: 'pages', emoji: '📄' },
                ],
            });
        case 'db':
            return pageEmbed({
                data, baseUrl, pagePath, title: plain, subtitle: 'Base de données française — The Division 2',
                body: Object.entries(CATEGORY_LABELS).map(([k, label]) => `[${label}](${pageUrl(baseUrl, `db/${k}`)})`).join(' · '),
                buttons: [{ label: 'Armes', path: 'db/armes', emoji: '🔫' }, { label: 'Équipements', path: 'db/equipements', emoji: '🦺' }, { label: 'Build Planner', path: 'build', emoji: '🛠️' }],
            });
        case 'changelog': {
            const latest = latestChangelog(data.metadata);
            return pageEmbed({
                data, baseUrl, pagePath, title: plain,
                subtitle: latest ? `📰 ${latest.title}${latest.date ? ` · ${latest.date}` : ''}` : 'Historique des changements',
                body: latest?.body || '',
                buttons: [{ label: 'Base de données', path: 'db', emoji: '📚' }],
            });
        }
        case 'build':
            return pageEmbed({
                data, baseUrl, pagePath, title: plain, subtitle: '🛠️ Créez et partagez vos configurations',
                body: 'Assemblez armes, équipements, talents, compétences et spécialisation, puis partagez votre build par simple lien.',
                buttons: [{ label: 'Bibliothèque de builds', path: 'library', emoji: '📂' }, { label: 'Base de données', path: 'db', emoji: '📚' }],
            });
        case 'library':
            return pageEmbed({
                data, baseUrl, pagePath, title: plain, subtitle: '📂 Builds partagés par la communauté',
                body: 'Parcourez, aimez et importez les builds publiés par les agents.',
                buttons: [{ label: 'Build Planner', path: 'build', emoji: '🛠️' }],
            });
        case 'generator':
            return pageEmbed({
                data, baseUrl, pagePath, title: plain, subtitle: '✍️ Outil de contribution',
                body: 'Proposez des ajouts ou corrections à la base de données.',
                buttons: [{ label: 'Base de données', path: 'db', emoji: '📚' }],
            });
        case 'pages':
            return pageEmbed({
                data, baseUrl, pagePath, title: plain, subtitle: '📄 Guides et documents du réseau SHD',
                buttons: [{ label: 'Base de données', path: 'db', emoji: '📚' }],
            });
        default:
            if (pagePath.startsWith('db/')) {
                const cat = pagePath.slice(3);
                return pageEmbed({
                    data, baseUrl, pagePath, title: plain, subtitle: `📚 Catégorie de la base de données`,
                    body: `Parcourez, filtrez et comparez : ${CATEGORY_LABELS[cat] || cat}.`,
                    buttons: [{ label: 'Toute la BDD', path: 'db', emoji: '🗂️' }, { label: 'Build Planner', path: 'build', emoji: '🛠️' }],
                });
            }
            return null;
    }
}

/** Page document markdown (`src/content/pages/*.md`). */
export function documentEmbed({ data, baseUrl, pageId, meta }) {
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    return pageEmbed({
        data, baseUrl, pagePath: `pages/${pageId}`,
        title: meta.title || pageId,
        subtitle: ['📄 Document', meta.author && `par ${meta.author}`, meta.date].filter(Boolean).join(' · '),
        body: meta.description || '',
        stats: tags.length ? [`🏷️ ${tags.join(', ')}`] : [],
        buttons: [{ label: 'Tous les documents', path: 'pages', emoji: '📚' }],
    });
}

/**
 * Injecte l'embed de l'accueil dans dist/index.html (genere par Vite).
 * Idempotent : remplace un embed deja present.
 */
export function injectIntoHtml(html, payload) {
    const tag = renderEmbedTag(payload);
    const cleaned = html.replace(/[ \t]*<script id="discord:component-embed"[^>]*>[\s\S]*?<\/script>\r?\n?/g, '');
    if (!tag) return cleaned;
    return cleaned.replace('</head>', `  ${tag}\n</head>`);
}

/* ------------------------------------------------------------------------ */
/* Icones                                                                    */
/* ------------------------------------------------------------------------ */

/** Index slug -> fichier des icones du jeu (WebP depuis la conversion, PNG toleres). */
export function buildIconIndex(assetsDir) {
    const index = {};
    const walk = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) walk(full);
            else if (/\.(webp|png)$/i.test(f)) {
                const key = slugify(path.basename(f, path.extname(f)));
                if (!index[key] || full.endsWith('.webp')) index[key] = full;
            }
        }
    };
    walk(assetsDir);
    return index;
}

/**
 * Copie l'icone de l'item dans dist/og-icons et retourne son chemin public
 * (relatif a la base), ou null.
 */
export function exportItemIcon(iconIndex, item, slug, distDir) {
    const keys = [item.icon, slug, item.skillSlug, item.speKey, item.marque, item.ensemble, item.type, item.emplacement].filter(Boolean).map(slugify);
    for (const key of keys) {
        const src = iconIndex[key];
        if (!src) continue;
        const fileName = `${key}${path.extname(src)}`;
        const dir = path.join(distDir, 'og-icons');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const dest = path.join(dir, fileName);
        if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
        return `og-icons/${fileName}`;
    }
    return null;
}
