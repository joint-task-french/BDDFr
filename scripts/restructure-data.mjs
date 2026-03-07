/**
 * Script de restructuration des données : fusionne les exotiques dans les fichiers principaux
 * et restructure les mods.
 * Usage: node scripts/restructure-data.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

function readJsonc(name) {
  const raw = readFileSync(join(DATA_DIR, name), 'utf8');
  return JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
}

function writeJsonc(name, obj, comment = '') {
  const header = comment ? `// ${comment}\n` : '';
  const content = header + JSON.stringify(obj, null, 2) + '\n';
  writeFileSync(join(DATA_DIR, name), content, 'utf8');
  console.log(`  ✔ ${name} (${Array.isArray(obj) ? obj.length + ' entrées' : 'objet'})`);
}

// ========== ARMES : fusionner classiques + exotiques ==========
console.log('\n=== Fusion armes + armes exotiques ===');
const armes = readJsonc('armes.jsonc').map(a => ({ ...a, estExotique: false, talent1: '', talent2: '', obtention: { description: '', butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false } }));
const armesExo = readJsonc('armes-exotiques.jsonc');

// Mapping typeArme texte libre → enum normalisé
function normalizeWeaponType(typeArme) {
  const t = (typeArme || '').toLowerCase();
  if (t.includes('calibre 12') || t.includes('shotgun') || t.includes('fusil calibre')) return 'calibre_12';
  if (t.includes('fusil d\'assaut') || t.includes("fusil d'assaut") || t.includes('assault')) return 'fusil_assaut';
  if (t.includes('fusil mitrailleur') || t.includes('lmg') || t.includes('light machine')) return 'fusil_mitrailleur';
  if (t.includes('précision') || t.includes('precision') || t.includes('sniper') || t.includes('marksman')) return 'fusil_precision';
  if (t.includes('pistolet mitrailleur') || t.includes('smg') || t.includes('submachine')) return 'pistolet_mitrailleur';
  if (t.includes('pistolet') || t.includes('pistol') || t.includes('sidearm')) return 'pistolet';
  if (t.includes('fusil') || t.includes('rifle')) return 'fusil';
  return 'autre';
}

const armesExoFormatted = armesExo
  .filter(e => e.nom && e.nom !== '-')
  .map(e => ({
    nom: e.nom,
    type: normalizeWeaponType(e.typeArme),
    fabricant: 'Exotique',
    // Stats à compléter manuellement — valeurs par défaut
    portee: 0,
    rpm: 0,
    chargeur: 0,
    rechargement: 0,
    headshot: '',
    attributEssentiel: '',
    degatsBase: 0,
    estExotique: true,
    talent1: e.talent1 || '',
    talent2: e.talent2 || '',
    obtention: e.obtention ? { description: e.obtention, butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false } : { description: '', butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false },
  }));

const allArmes = [...armes, ...armesExoFormatted];
writeJsonc('armes.jsonc', allArmes, 'Toutes les armes (classiques + exotiques) — The Division 2');

// ========== ÉQUIPEMENTS : fusionner classiques + exotiques ==========
console.log('\n=== Fusion équipements + équipements exotiques ===');
const equips = readJsonc('equipements.jsonc').map(e => ({
  ...e,
  estExotique: false,
  talent1: '',
  talent2: '',
  obtention: { description: '', butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false },
}));
const equipsExo = readJsonc('equipements-exotiques.jsonc');

const equipsExoFormatted = equipsExo
  .filter(e => e.nom && e.nom !== '-')
  .map(e => ({
    nom: e.nom,
    marque: 'Exotique',
    emplacement: e.emplacement || 'inconnu',
    attributEssentiel: '',
    attribut1: '',
    attributUnique: '',
    talent: '',
    mod: '',
    estNomme: false,
    source: 'exotic',
    estExotique: true,
    talent1: e.talent1 || '',
    talent2: e.talent2 || '',
    obtention: e.obtention ? { description: e.obtention, butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false } : { description: '', butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false },
  }));

const allEquips = [...equips, ...equipsExoFormatted];
writeJsonc('equipements.jsonc', allEquips, 'Tous les équipements (gear sets + marques + exotiques) — The Division 2');

// ========== MODS D'ÉQUIPEMENT : restructurer ==========
console.log('\n=== Restructuration mods équipements ===');
const modsEquipRaw = readJsonc('mods-equipements.jsonc');

const modsEquip = [];
let currentProtocol = '';
let currentCategory = '';
let pendingStat = null;

for (const row of modsEquipRaw) {
  const stat = (row.statistique || '').trim();
  const val = (row.valeurMax || '').trim();

  // Detect category headers
  if (stat.startsWith('Mod ') || stat === 'Mod défensif' || stat === 'Mod offensif') {
    currentCategory = stat.replace('Mod ', '');
    continue;
  }
  if (stat.startsWith('PROTOCOLE') || stat.startsWith('SYSTÈME')) {
    currentProtocol = stat;
    continue;
  }
  if (val === 'Stat. Max :' || val === '') {
    // This is a stat name line, next line will have the value
    if (stat && !stat.startsWith('Stat.')) pendingStat = stat;
    continue;
  }
  if (pendingStat) {
    modsEquip.push({
      categorie: currentCategory,
      protocole: currentProtocol,
      statistique: pendingStat,
      valeurMax: stat || val,
    });
    pendingStat = null;
    continue;
  }
}

writeJsonc('mods-equipements.jsonc', modsEquip, 'Modifications d\'équipements — The Division 2');

// ========== MODS DE COMPÉTENCES : restructurer ==========
console.log('\n=== Restructuration mods compétences ===');
const modsCompRaw = readJsonc('mods-competences.jsonc');

// Le fichier contient en fait la liste des emplacements de mods par compétence, pas des stats
// Restructurons en gardant la structure claire
const modsComp = modsCompRaw
  .filter(m => {
    const mod = (m.mod || '').trim();
    return mod && mod !== 'NOM DE LA COMPÉTENCE' && !mod.startsWith('NOM');
  })
  .map(m => ({
    competence: (m.mod || '').trim(),
    emplacement: (m.effet || '').trim(),
    // Stats à compléter manuellement
    statistiques: [],
  }));

writeJsonc('mods-competences.jsonc', modsComp, 'Emplacements de mods de compétences — The Division 2');

// ========== MODS D'ARMES : nettoyer la première ligne d'en-tête ==========
console.log('\n=== Nettoyage mods armes ===');
const modsArmesRaw = readJsonc('mods-armes.jsonc');
const modsArmes = modsArmesRaw.filter(m => {
  const nom = (m.nom || '').trim();
  return nom && nom !== 'Nom' && nom !== '-';
});

// Detect type from name patterns
function detectModType(nom) {
  const n = nom.toLowerCase();
  if (n.includes('charg.') || n.includes('chargeur') || n.includes('tambour')) return 'chargeur';
  if (n.includes('canon') || n.includes('compensat') || n.includes('silenc') || n.includes('frein') || n.includes('flash') || n.includes('prolongé')) return 'canon';
  if (n.includes('viseur') || n.includes('lunette') || n.includes('optique') || n.includes('holographique') || n.includes('scope') || n.includes('reflex') || n.includes('acog') || n.includes('cqbss') || n.includes('mire') || n.includes('numériqu') || n.includes('t2 micro') || n.includes('vx1') || n.includes('c79') || n.includes('PRO Red Dot') || n.includes('russian') || n.includes('exps3') || n.includes('552 holo')) return 'viseur';
  if (n.includes('laser') || n.includes('poignée') || n.includes('rail') || n.includes('grip') || n.includes('bipied') || n.includes('petit pointeur')) return 'bouche';
  return 'autre';
}

let currentModType = '';
const modsArmesClean = modsArmes.map(m => {
  const detected = detectModType(m.nom);
  if (detected !== 'autre') currentModType = detected;
  return {
    nom: m.nom,
    type: m.type || currentModType || 'autre',
    bonus: m.bonus || '',
    malus: m.malus || '',
  };
});

writeJsonc('mods-armes.jsonc', modsArmesClean, 'Modifications d\'armes — The Division 2');

// ========== Nettoyage : supprimer les fichiers séparés exotiques ==========
console.log('\n=== Suppression fichiers exotiques séparés ===');
import { unlinkSync, existsSync } from 'fs';
for (const f of ['armes-exotiques.jsonc', 'equipements-exotiques.jsonc']) {
  const p = join(DATA_DIR, f);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`  ✔ Supprimé ${f}`);
  }
}

console.log('\n✅ Restructuration terminée !');

