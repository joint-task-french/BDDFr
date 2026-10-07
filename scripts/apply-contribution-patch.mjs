/**
 * Applique un patch JSONC decrit dans le corps d'une issue GitHub.
 *
 * SECURITE : le corps de l'issue est une donnee NON FIABLE (n'importe quel
 * utilisateur GitHub peut ouvrir une issue). Tout ce qui en provient est
 * valide avant d'etre utilise :
 *   - `path` doit designer un JSONC existant de src/data/ (allowlist derivee
 *     du disque, donc toujours synchro avec FILE_MAP) ;
 *   - les cles de `upserts` doivent etre des slugs ;
 *   - les valeurs upsertees doivent etre des objets JSON simples.
 *
 * Usage: node scripts/apply-contribution-patch.mjs
 */
import fs from 'fs';
import path from 'path';
import { applyEdits, modify } from 'jsonc-parser';

const DATA_ROOT = 'src/data';
const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/;

/** Liste blanche des fichiers patchables : tous les .jsonc sous src/data/. */
function buildAllowlist() {
  const allowed = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.jsonc')) {
        allowed.add(full.split(path.sep).join('/'));
      }
    }
  };
  walk(DATA_ROOT);
  return allowed;
}

function fail(message) {
  console.error(`Erreur fatale : ${message}`);
  process.exit(1);
}

/** Refuse tout ce qui n'est pas une valeur JSON serialisable simple. */
function assertPlainJson(value, where) {
  if (value === null) return;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertPlainJson(v, `${where}[${i}]`));
    return;
  }
  if (type !== 'object') fail(`Valeur de type ${type} interdite dans ${where}.`);
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    fail(`Objet non litteral interdit dans ${where}.`);
  }
  for (const key of Object.keys(value)) {
    // Neutralise les tentatives de prototype pollution.
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      fail(`Cle interdite "${key}" dans ${where}.`);
    }
    assertPlainJson(value[key], `${where}.${key}`);
  }
}

const body = process.env.ISSUE_BODY;
const regex = /[\s\S]*?```json\n([\s\S]*?)\n```[\s\S]*?/;
const match = body?.match(regex);

if (!match) {
  console.log("Aucune donnee de contribution trouvee dans le corps de l'issue.");
  process.exit(0);
}

let patches;
try {
  patches = JSON.parse(match[1]);
} catch (e) {
  fail('Le bloc JSON de contribution est invalide.');
}

if (!Array.isArray(patches)) fail('Le patch doit etre un tableau.');
if (patches.length > 50) fail(`Trop de patches (${patches.length}, max 50).`);

const ALLOWED_PATHS = buildAllowlist();

const modifyOptions = {
  formattingOptions: {
    insertSpaces: true,
    tabSize: 2,
    eol: '\n'
  }
};

for (const patch of patches) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    fail('Chaque patch doit etre un objet.');
  }

  const { path: rawPath, upserts } = patch;

  if (typeof rawPath !== 'string') fail('Le champ "path" doit etre une chaine.');

  // Normalisation POSIX puis verification stricte contre la liste blanche :
  // neutralise "../", les chemins absolus et les variantes de separateurs.
  const target = path.posix.normalize(rawPath.split(path.sep).join('/'));
  if (!ALLOWED_PATHS.has(target)) {
    fail(`Chemin non autorise : ${rawPath}. Seuls les fichiers .jsonc de ${DATA_ROOT}/ sont modifiables.`);
  }

  if (!upserts || typeof upserts !== 'object' || Array.isArray(upserts)) {
    fail(`Le champ "upserts" de ${target} doit etre un objet.`);
  }

  let content = fs.readFileSync(target, 'utf8');

  for (const [slug, newItem] of Object.entries(upserts)) {
    if (!SLUG_RE.test(slug)) {
      fail(`Slug invalide "${slug}" dans ${target} (attendu : ${SLUG_RE}).`);
    }
    if (!newItem || typeof newItem !== 'object' || Array.isArray(newItem)) {
      fail(`La valeur de "${slug}" dans ${target} doit etre un objet.`);
    }
    assertPlainJson(newItem, `${target}#${slug}`);

    const edits = modify(content, [slug], newItem, modifyOptions);
    content = applyEdits(content, edits);
    console.log(`+ Mise a jour de la cle : ${slug} dans ${target}`);
  }

  fs.writeFileSync(target, content, 'utf8');
  console.log(`OK Fichier ${target} mis a jour (commentaires preserves).`);
}
