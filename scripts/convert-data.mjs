/**
 * Script de conversion des anciens JSON bruts vers JSONC structurés.
 * Usage: node scripts/convert-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const OLD_DIR = join(DATA_DIR);

function readOld(n) {
  return JSON.parse(readFileSync(join(OLD_DIR, `${n}.json`), 'utf8'));
}

function writeJsonc(name, obj, comment = '') {
  const header = comment ? `// ${comment}\n` : '';
  writeFileSync(join(DATA_DIR, name), header + JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`  ✔ ${name}`);
}

// ========== WEAPON TYPE DETECTION ==========
function detectWeaponType(attr, hs) {
  const a = (attr || '').toLowerCase();
  const h = (hs || '').toLowerCase();
  if (a.includes('sant') || a.includes('santé')) return 'fusil_assaut';
  if (a.includes('cible non abrit') || a.includes('cible non abritée')) return 'fusil_mitrailleur';
  if (a.includes('aucun') && h.includes('100')) return 'pistolet';
  if (a.includes('protection') && (h.includes('45') || h.includes('25'))) return 'calibre_12';
  if (a.includes('headshot') || h.includes('111') || h.includes('137')) return 'fusil_precision';
  if (a.includes('chance') && a.includes('critique')) return 'pistolet_mitrailleur';
  if (a.includes('critique') && !a.includes('chance')) return 'fusil';
  if (a === 'x') return 'arme_specifique';
  if (a.includes('protection') && h.includes('55')) return 'fusil_assaut'; // CAPACITOR edge case
  return 'autre';
}

// ========== ARMES ==========
console.log('\n=== Armes ===');
const f12 = readOld(12);
const weaponStats = f12.data;

let curManuf = '';
const armes = [];
for (let i = 2; i < weaponStats.length; i++) {
  const r = weaponStats[i];
  const col2 = (r['Colonne_2'] || '').trim();
  const col4 = (r['Colonne_4'] || '').trim();
  if (col2) curManuf = col2;
  if (!col4) continue;

  const col11 = (r['Colonne_11'] || '').trim();
  const col12 = (r['Colonne_12'] || '').trim();
  const type = detectWeaponType(col12, col11);

  // Check if exotic (no Colonne_7 = no base range means exotic-like)
  const col7 = (r['Colonne_7'] || '').trim();
  const isExotic = !col7 && col4 === col4.toUpperCase() && col4.length > 3;

  armes.push({
    nom: col4,
    type,
    fabricant: curManuf,
    portee: parseFloat((r['Colonne_5'] || '0').replace(',', '.')) || 0,
    rpm: parseInt(r['Colonne_8'] || '0') || 0,
    chargeur: parseInt(r['Colonne_9'] || '0') || 0,
    rechargement: parseFloat((r['Colonne_10'] || '0').replace(',', '.')) || 0,
    headshot: col11,
    attributEssentiel: col12,
    degatsBase: parseInt(r['Colonne_13'] || '0') || 0
  });
}

writeJsonc('armes.jsonc', armes, 'Statistiques de toutes les armes — The Division 2');

// ========== ARMES EXOTIQUES ==========
console.log('\n=== Armes Exotiques ===');
const f7 = readOld(7);
const armesExotiques = [];
const equipExotiques = [];

const gearSlotKws = {
  masque: ['masque'],
  torse: ['torse', 'plastron', 'gilet'],
  holster: ['holster'],
  sac_a_dos: ['sac', 'dos'],
  gants: ['gant'],
  genouilleres: ['genou', 'genouillère']
};

f7.data.forEach(r => {
  const typeCol = (r['Exotiques'] || '').trim().toLowerCase();
  const nom = (r['Colonne_3'] || '').trim();
  if (!nom || nom === '-' || nom === 'Nom') return;

  // Is it gear or weapon?
  let isGear = false;
  let emplacement = '';
  for (const [slot, kws] of Object.entries(gearSlotKws)) {
    if (kws.some(kw => typeCol.includes(kw))) {
      isGear = true;
      emplacement = slot;
      break;
    }
  }

  if (isGear) {
    equipExotiques.push({
      nom,
      emplacement,
      talent1: (r['Colonne_4'] || '').trim(),
      talent2: (r['Colonne_5'] || '').trim(),
      obtention: { description: (r['Colonne_6'] || '').trim(), butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false }
    });
  } else {
    armesExotiques.push({
      nom,
      typeArme: typeCol,
      talent1: (r['Colonne_4'] || '').trim(),
      talent2: (r['Colonne_5'] || '').trim(),
      obtention: { description: (r['Colonne_6'] || '').trim(), butinCible: false, cachesExotiques: false, mission: false, raid: false, incursion: false }
    });
  }
});

writeJsonc('armes-exotiques.jsonc', armesExotiques, 'Armes exotiques — talents et obtention');
writeJsonc('equipements-exotiques.jsonc', equipExotiques, 'Équipements exotiques — talents et obtention');

// ========== TALENTS D'ARMES ==========
console.log('\n=== Talents d\'armes ===');
const f10 = readOld(10);
const talentsArmes = [];
const typeColMap = {
  'Colonne_5': 'fusil',
  'Colonne_6': 'calibre_12',
  'Colonne_7': 'fusil_assaut',
  'Colonne_8': 'fusil_mitrailleur',
  'Colonne_9': 'fusil_precision',
  'Colonne_10': 'pistolet',
  'Colonne_11': 'pistolet_mitrailleur'
};

for (let i = 2; i < f10.data.length; i++) {
  const r = f10.data[i];
  const nom = (r['Talents des Armes'] || '').trim();
  const desc = (r['Colonne_3'] || '').trim();
  const prereq = (r['Colonne_4'] || '').trim();
  if (!nom || nom === '-') continue;

  const compat = {};
  for (const [col, type] of Object.entries(typeColMap)) {
    compat[type] = (r[col] || '').trim() === '✔';
  }

  talentsArmes.push({ nom, description: desc !== nom ? desc : '', prerequis: prereq, compatibilite: compat });
}

writeJsonc('talents-armes.jsonc', talentsArmes, 'Talents d\'armes et matrice de compatibilité');

// ========== ENSEMBLES GEAR (GEAR SETS) ==========
console.log('\n=== Ensembles Gear ===');
const f2 = readOld(2);
const gearSets = [];
f2.data.forEach(r => {
  const nom = (r['Ensemble de marque'] || '').trim();
  if (!nom) return;
  gearSets.push({
    nom,
    bonus2pieces: (r['Bonus 2 pièces'] || '').trim(),
    bonus3pieces: (r['Bonus 3 pièces'] || '').trim(),
    bonus4pieces: (r['Bonus 4 pièces'] || '').trim(),
    talentTorse: (r['Talent de Torse'] || '').trim(),
    talentSac: (r['Talent de Sac à dos'] || '').trim()
  });
});

writeJsonc('ensembles-gear.jsonc', gearSets, 'Gear Sets — bonus 2/3/4 pièces et talents');

// ========== ENSEMBLES DE MARQUE ==========
console.log('\n=== Ensembles de marque ===');
const f4 = readOld(4);
const brandSets = [];
for (let i = 2; i < f4.data.length; i++) {
  const r = f4.data[i];
  const nom = (r['Colonne_2'] || '').trim();
  if (!nom) continue;
  brandSets.push({
    nom,
    bonus1piece: (r['Ensemble de Marque'] || '').trim(),
    bonus2pieces: (r['Colonne_4'] || '').trim(),
    bonus3pieces: (r['Colonne_5'] || '').trim()
  });
}

writeJsonc('ensembles-marque.jsonc', brandSets, 'Ensembles de marque — bonus 1/2/3 pièces');

// ========== ÉQUIPEMENTS (Gear sets models) ==========
console.log('\n=== Modèles d\'équipements (Gear Sets) ===');
const f3 = readOld(3);
const equipGearSets = [];
const brandTracker = {};
const gearSlotOrder = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres'];

f3.data.forEach(r => {
  const nom = (r['Nom'] || '').trim();
  const marque = (r['Ensemble de marque'] || '').trim();
  if (!nom || !marque) return;

  if (!brandTracker[marque]) brandTracker[marque] = 0;
  const slotIdx = brandTracker[marque];
  brandTracker[marque]++;

  equipGearSets.push({
    nom,
    marque,
    emplacement: gearSlotOrder[slotIdx] || 'inconnu',
    attributEssentiel: (r['Attribut essentiel'] || '').trim(),
    attribut1: (r['Attribut 1'] || '').trim(),
    mod: (r['Mod 1'] || '').trim()
  });
});

// ========== ÉQUIPEMENTS (Brand models, file 5) ==========
console.log('\n=== Modèles d\'équipements (Marques) ===');
const f5 = readOld(5);
const equipBrands = [];
const brandTracker5 = {};
const file5SlotOrder = ['genouilleres', 'holster', 'gants', 'torse', 'sac_a_dos', 'masque'];

function normalizeBrand(b) {
  const n = b.toLowerCase().trim();
  if (n.includes('alps summit')) return 'Alps Summit Armament';
  if (n.includes('belstone')) return 'Belstone Armory';
  if (n.includes('empress') || n.includes('impress')) return 'Empress International';
  return b;
}

for (let i = 3; i < f5.data.length; i++) {
  const r = f5.data[i];
  const nom = (r['Colonne_3'] || '').trim();
  const marque = normalizeBrand((r['Colonne_2'] || '').trim());
  if (!nom || !marque) continue;

  if (!brandTracker5[marque]) brandTracker5[marque] = 0;
  const slotIdx = brandTracker5[marque];
  brandTracker5[marque]++;

  const talent = (r['Colonne_7'] || '').trim();
  const estNomme = talent && talent !== 'FALSE' && talent !== '-';

  equipBrands.push({
    nom,
    marque,
    emplacement: file5SlotOrder[slotIdx] || 'inconnu',
    attributEssentiel: (r['Colonne_4'] || '').trim(),
    attribut1: (r['Colonne_5'] || '').trim(),
    attributUnique: (r['Colonne_6'] || '').trim(),
    talent: estNomme ? talent : '',
    mod: (r['Colonne_8'] || '').trim(),
    estNomme
  });
}

// Merge both into one file
const allEquipements = [
  ...equipGearSets.map(e => ({ ...e, source: 'gear_set' })),
  ...equipBrands.map(e => ({ ...e, source: 'marque' }))
];

writeJsonc('equipements.jsonc', allEquipements, 'Tous les équipements — gear sets et marques');

// ========== TALENTS D'ÉQUIPEMENTS ==========
console.log('\n=== Talents d\'équipements ===');
const f8 = readOld(8);
const talentsEquip = [];
let currentSlot = '';

for (let i = 1; i < f8.data.length; i++) {
  const r = f8.data[i];
  const typeCol = (r['CTRL + F pour une recherche rapide avec mot clef'] || '').trim().toLowerCase();
  const nom = (r['Colonne_3'] || '').trim();
  const desc = (r["Talents d'Équipements"] || '').trim();
  const prereq = (r['Colonne_5'] || '').trim();

  if (typeCol.includes('torse') || typeCol.includes('chest')) { currentSlot = 'torse'; continue; }
  if (typeCol.includes('sac') || typeCol.includes('dos')) { currentSlot = 'sac_a_dos'; continue; }

  if (!nom || nom === '-') continue;

  talentsEquip.push({
    nom,
    description: desc || '',
    prerequis: prereq,
    emplacement: currentSlot || 'inconnu'
  });
}

writeJsonc('talents-equipements.jsonc', talentsEquip, 'Talents d\'équipements pour torse et sac à dos');

// ========== COMPÉTENCES ==========
console.log('\n=== Compétences ===');
const f13 = readOld(13);
const competences = [];
let currentSkill = '';

for (let i = 1; i < f13.data.length; i++) {
  const r = f13.data[i];
  const skillName = (r['TIER DE COMPÉTENCE'] || '').trim();
  const variant = (r['Colonne_2'] || '').trim();
  if (skillName) currentSkill = skillName;
  if (!variant || variant === '-') continue;

  competences.push({
    competence: currentSkill,
    variante: variant,
    expertise: (r['Colonne_3'] || '').trim(),
    statistiques: (r['Colonne_4'] || '').trim(),
    effetEtat: (r['Colonne_5'] || '').trim(),
    tier1: (r['Colonne_6'] || '').trim(),
    tier2: (r['Colonne_7'] || '').trim(),
    tier3: (r['Colonne_8'] || '').trim(),
    tier4: (r['Colonne_9'] || '').trim(),
    tier5: (r['Colonne_10'] || '').trim(),
    tier6: (r['Colonne_11'] || '').trim(),
    surcharge: (r['Colonne_12'] || '').trim()
  });
}

writeJsonc('competences.jsonc', competences, 'Compétences et variantes');

// ========== MODS D'ARMES ==========
console.log('\n=== Mods d\'armes ===');
try {
  const f14 = readOld(14);
  const modsArmes = [];
  let curModType = '';
  for (let i = 1; i < f14.data.length; i++) {
    const r = f14.data[i];
    const typeCol = (r['Mods armes'] || r['element_name'] || '').trim();
    const nom = (r['Colonne_3'] || r['Colonne_2'] || '').trim();
    if (!nom) {
      if (typeCol) curModType = typeCol;
      continue;
    }

    modsArmes.push({
      nom,
      type: curModType,
      bonus: (r['Colonne_4'] || '').trim(),
      malus: (r['Colonne_5'] || '').trim()
    });
  }
  writeJsonc('mods-armes.jsonc', modsArmes, 'Modifications d\'armes');
} catch (e) { console.log('  ⚠ Pas de fichier 14.json'); }

// ========== MODS D'ÉQUIPEMENT ==========
console.log('\n=== Mods d\'équipement ===');
try {
  const f15 = readOld(15);
  const modsEquip = [];
  for (let i = 1; i < f15.data.length; i++) {
    const r = f15.data[i];
    const nom = (r['Colonne_2'] || r['element_name'] || '').trim();
    if (!nom || nom === '-') continue;
    modsEquip.push({
      type: (r['Mods équipements'] || '').trim(),
      statistique: nom,
      valeurMax: (r['Colonne_3'] || '').trim()
    });
  }
  writeJsonc('mods-equipements.jsonc', modsEquip, 'Modifications d\'équipements');
} catch (e) { console.log('  ⚠ Pas de fichier 15.json'); }

// ========== MODS DE COMPÉTENCES ==========
console.log('\n=== Mods de compétences ===');
try {
  const f17 = readOld(17);
  const modsComp = [];
  let curComp = '';
  for (let i = 1; i < f17.data.length; i++) {
    const r = f17.data[i];
    const comp = (r['Mods de compétences'] || '').trim();
    const nom = (r['Colonne_2'] || '').trim();
    if (comp) curComp = comp;
    if (!nom || nom === '-') continue;
    modsComp.push({
      competence: curComp,
      mod: nom,
      effet: (r['Colonne_3'] || '').trim()
    });
  }
  writeJsonc('mods-competences.jsonc', modsComp, 'Modifications de compétences');
} catch (e) { console.log('  ⚠ Pas de fichier 17.json'); }

// ========== METADATA ==========
console.log('\n=== Metadata ===');
writeJsonc('metadata.jsonc', {
  titre: 'Base de données française — The Division 2',
  version: 'TU22 : Warlords Of New York',
  derniereMiseAJour: '2024-11-20',
  credits: ['Rav', 'Major45-FR', 'Marco888', 'Squal_fr', 'Franck-FR', 'Saiyanns', 'V0ldeen', 'Ben3and', 'Titi-FT-70', 'PP.1974-fr', 'Captain77']
}, 'Métadonnées du projet');

console.log('\n✅ Conversion terminée !');

