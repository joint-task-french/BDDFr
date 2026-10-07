/**
 * Configuration du comparateur.
 *
 * Deux notions par categorie :
 *
 *  - le GROUPE de comparaison : ce qui a du sens d'etre mis cote a cote. Toutes
 *    les armes sont comparables entre elles (un fusil a pompe face a un fusil de
 *    precision reste une comparaison utile), mais un torse ne se compare qu'a un
 *    torse. `groupBy` renvoie la cle du groupe, `null` signifiant « toute la
 *    categorie forme un seul groupe ».
 *
 *  - les LIGNES du tableau : les champs reellement comparables, avec le sens de
 *    lecture (`better`) pour mettre en evidence la meilleure valeur.
 *
 * Comme le reste du projet, rien n'est code en dur cote composant : ajouter une
 * categorie comparable se fait uniquement ici.
 */

export const COMPARISON_MAX = 4

// --- Fabriques de cellules -------------------------------------------------

const num = (v, u = '') => (typeof v === 'number' && !Number.isNaN(v) ? { t: 'num', v, u } : null)
const txt = (v) => (v ? { t: 'txt', v: String(v) } : null)
const bool = (v) => ({ t: 'bool', v: Boolean(v) })
const list = (v) => (Array.isArray(v) && v.length > 0 ? { t: 'list', v } : null)
/** Talents detailles : nom + description, version parfaite si applicable. */
const talents = (v) => (Array.isArray(v) && v.length > 0 ? { t: 'talents', v } : null)

/** Resout un slug vers un nom lisible dans une source indexee par slug. */
function nameOf(source, slug) {
  if (!slug) return ''
  const entry = source?.[slug]
  return entry?.nom || prettify(slug)
}

/** "fusil_assaut" -> "Fusil assaut" (dernier recours quand aucun nom n'existe). */
function prettify(slug) {
  return String(slug).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

/** Liste de slugs -> liste de noms. */
function namesOf(slugs, source) {
  if (!Array.isArray(slugs)) return []
  return slugs.map(s => nameOf(source, s)).filter(Boolean)
}

/**
 * Liste d'attributs appliques -> "Nom +12 %".
 * Accepte les deux formes rencontrees dans les JSONC : `{nom, valeur}` (armes,
 * equipements) et `{attribut}` / `{slug, value}` (mods, bonus d'ensemble).
 */
function attributesOf(attrs, attributsSource) {
  if (!Array.isArray(attrs)) return []
  return attrs.map(a => {
    const slug = a?.nom || a?.attribut || a?.slug
    if (!slug) return null
    const ref = attributsSource?.[slug]
    const label = ref?.nom || prettify(slug)
    const valeur = a?.valeur ?? a?.value
    if (valeur === undefined || valeur === null || valeur === '') return label
    const unite = ref?.unite || '%'
    return `${label} +${valeur}${unite ? ` ${unite}` : ''}`
  }).filter(Boolean)
}

/**
 * Detaille les talents d'un item : nom, description, et version parfaite quand
 * l'item figure dans la liste des porteurs parfaits du talent.
 *
 * `champParfaits` designe le champ du TALENT listant les items qui en obtiennent
 * la version parfaite (`armesParfaites` pour les armes, `equipementsParfaits`
 * pour les equipements).
 */
function talentDetails(item, source, champParfaits) {
  if (!Array.isArray(item?.talents) || !source) return []

  return item.talents.map(slug => {
    const talent = source[slug]
    if (!talent) return { nom: prettify(slug), description: '', parfait: false }

    const parfait = Boolean(
      talent.perfectDescription &&
      Array.isArray(talent[champParfaits]) &&
      talent[champParfaits].includes(item.slug)
    )

    return {
      nom: talent.nom || prettify(slug),
      // Certains talents n'existent qu'en version parfaite.
      description: (parfait ? talent.perfectDescription : talent.description) || talent.description || '',
      parfait,
    }
  })
}

/**
 * Emplacements de mods rencontres dans les donnees, dans l'ordre d'usage.
 * Derive des donnees : un nouvel emplacement dans les JSONC apparait tout seul
 * dans le comparateur.
 */
const ORDRE_EMPLACEMENTS = ['chargeur', 'bouche', 'viseur', 'canon']

function weaponModSlots(data) {
  const trouves = new Set()
  for (const arme of Object.values(data?.armes || {})) {
    for (const slot of Object.keys(arme?.emplacementsMods || {})) trouves.add(slot)
  }
  const connus = ORDRE_EMPLACEMENTS.filter(s => trouves.has(s))
  const inconnus = [...trouves].filter(s => !ORDRE_EMPLACEMENTS.includes(s)).sort()
  return [...connus, ...inconnus]
}

/**
 * Emplacements de mods d'une competence.
 * Le JSONC les stocke sous forme d'objets `{ emplacement: "BOBINE" }` (et non
 * de chaines comme pour les armes) : les traiter comme des chaines produisait
 * « [object Object] ».
 */
function skillSlotsOf(item) {
  if (!Array.isArray(item?.emplacementsMods)) return []
  return item.emplacementsMods
    .map(e => (typeof e === 'string' ? e : e?.emplacement))
    .filter(Boolean)
}

/** Union des emplacements de mods rencontres sur les competences. */
function skillModSlots(data) {
  const trouves = new Set()
  for (const variante of data?.competences || []) {
    for (const slot of skillSlotsOf(variante)) trouves.add(slot)
  }
  return [...trouves].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Rarete lisible a partir des drapeaux presents sur l'item. */
function rarity(item) {
  if (item?.estExotique) return 'Exotique'
  if (item?.estNomme) return 'Nommé'
  if (item?.type === 'exotique') return 'Exotique'
  if (item?.type === 'nomme') return 'Nommé'
  if (item?.type === 'gear_set') return 'Set d\'équipement'
  return 'Standard'
}

const SLOT_LABELS = {
  masque: 'Masque',
  sac_a_dos: 'Sac à dos',
  torse: 'Torse',
  gants: 'Gants',
  holster: 'Holster',
  genouilleres: 'Genouillères',
}

const slotLabel = (slot) => SLOT_LABELS[slot] || prettify(slot)

// --- Configuration par categorie -------------------------------------------

export const COMPARISON_CONFIG = {
  armes: {
    // Toutes les armes sont comparables entre elles, quel que soit le type.
    groupBy: () => null,
    groupLabel: () => 'Armes',
    rows: (data) => [
      { key: 'type', label: "Type d'arme", get: (i, d) => txt(nameOf(d?.armes_type, i.type)) },
      { key: 'rarete', label: 'Rareté', get: (i) => txt(rarity(i)) },
      { key: 'fabricant', label: 'Fabricant', get: (i) => txt(i.fabricant) },
      { key: 'degatsBase', label: 'Dégâts de base', better: 'high', get: (i) => num(i.degatsBase) },
      { key: 'rpm', label: 'Cadence (CPM)', better: 'high', get: (i) => num(i.rpm) },
      { key: 'chargeur', label: 'Chargeur', better: 'high', get: (i) => num(i.chargeur) },
      { key: 'rechargement', label: 'Rechargement', better: 'low', get: (i) => num(i.rechargement, 's') },
      { key: 'portee', label: 'Portée optimale', better: 'high', get: (i) => num(i.portee, 'm') },
      { key: 'headshot', label: 'Bonus headshot', better: 'high', get: (i) => num(i.headshot, '%') },
      { key: 'talents', label: 'Talents', get: (i, d) => talents(talentDetails(i, d?.talentsArmes, 'armesParfaites')) },
      {
        key: 'attributs',
        label: 'Attributs',
        get: (i, d) => list([
          ...attributesOf(i.attributs_essentiels, d?.attributs),
          ...attributesOf(i.attributs, d?.attributs),
        ]),
      },
      // Une ligne par emplacement de mod possible : la cellule indique la
      // sous-categorie acceptee, ou reste vide si l'arme n'a pas cet
      // emplacement. Comparer « accepte / n'accepte pas » exige que tous les
      // emplacements soient representes, pas seulement ceux de l'arme.
      ...weaponModSlots(data).map(slot => ({
        key: `mod_${slot}`,
        label: `Mod — ${prettify(slot)}`,
        get: (i, d) => txt(
          i.emplacementsMods?.[slot]
            ? nameOf(d?.modsArmesType, i.emplacementsMods[slot])
            : null
        ),
      })),
    ],
  },

  equipements: {
    // Un torse ne se compare qu'a un torse.
    groupBy: (i) => i.emplacement || null,
    groupLabel: (key) => slotLabel(key),
    rows: [
      { key: 'rarete', label: 'Rareté', get: (i) => txt(rarity(i)) },
      { key: 'marque', label: 'Marque / Ensemble', get: (i, d) => txt(i.marque && i.marque !== '*' ? nameOf(d?.ensembles, i.marque) : null) },
      { key: 'attributEssentiel', label: 'Attribut essentiel', get: (i, d) => txt(i.attributEssentiel ? nameOf(d?.attributs, i.attributEssentiel) : null) },
      { key: 'attributs', label: 'Attributs', get: (i, d) => list(attributesOf(i.attributs, d?.attributs)) },
      { key: 'talents', label: 'Talents', get: (i, d) => talents(talentDetails(i, d?.talentsEquipements, 'equipementsParfaits')) },
      { key: 'mod', label: 'Emplacement de mod', get: (i) => bool(i.mod) },
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
    ],
  },

  ensembles: {
    groupBy: () => null,
    groupLabel: () => 'Ensembles',
    rows: [
      { key: 'type', label: 'Type', get: (i) => txt(rarity(i)) },
      { key: 'essentiels', label: 'Attributs essentiels', get: (i) => list((i.attributsEssentiels || []).map(prettify)) },
      { key: 'b1', label: 'Bonus 1 pièce', get: (i, d) => list(attributesOf(i.bonus1piece?.attributs, d?.attributs)) },
      { key: 'b2', label: 'Bonus 2 pièces', get: (i, d) => list(attributesOf(i.bonus2pieces?.attributs, d?.attributs)) },
      { key: 'b3', label: 'Bonus 3 pièces', get: (i, d) => list(attributesOf(i.bonus3pieces?.attributs, d?.attributs)) },
      {
        key: 'b4',
        label: 'Bonus 4 pièces',
        get: (i, d) => list([
          ...attributesOf(i.bonus4pieces?.attributs, d?.attributs),
          ...(i.bonus4pieces?.talent ? [nameOf(d?.talentsEquipements, i.bonus4pieces.talent)] : []),
        ]),
      },
      { key: 'talentTorse', label: 'Talent de torse', get: (i, d) => txt(i.talentTorse ? nameOf(d?.talentsEquipements, i.talentTorse) : null) },
      { key: 'talentSac', label: 'Talent de sac', get: (i, d) => txt(i.talentSac ? nameOf(d?.talentsEquipements, i.talentSac) : null) },
    ],
  },

  competences: {
    // Comparer deux variantes, y compris de competences differentes.
    groupBy: () => null,
    groupLabel: () => 'Compétences',
    rows: (data) => [
      { key: 'competence', label: 'Compétence', get: (i) => txt(i.competence) },
      { key: 'variante', label: 'Variante', get: (i) => txt(i.variante) },
      { key: 'prerequis', label: 'Prérequis', get: (i) => txt(i.prerequis) },
      { key: 'statistiques', label: 'Statistiques', get: (i) => txt(i.statistiques) },
      { key: 'expertise', label: 'Expertise', get: (i) => txt(i.expertise) },
      { key: 'tier1', label: 'Palier 1', get: (i) => txt(i.tier1) },
      // Une ligne par emplacement de mod : la cellule indique si la competence
      // accepte cet emplacement. Les lignes qu'aucune des competences comparees
      // ne renseigne sont retirees automatiquement.
      ...skillModSlots(data).map(slot => ({
        key: `mod_${slot}`,
        label: `Mod — ${slot}`,
        get: (i) => (skillSlotsOf(i).includes(slot) ? bool(true) : null),
      })),
    ],
  },

  talentsArmes: {
    groupBy: () => null,
    groupLabel: () => "Talents d'armes",
    rows: [
      { key: 'rarete', label: 'Rareté', get: (i) => txt(rarity(i)) },
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
      { key: 'perfectDescription', label: 'Version parfaite', get: (i) => txt(i.perfectDescription) },
      { key: 'compatibilite', label: 'Compatibilité', get: (i, d) => list(namesOf(i.compatibilite, d?.armes_type)) },
      { key: 'armesParfaites', label: 'Armes parfaites', get: (i, d) => list(namesOf(i.armesParfaites, d?.armes)) },
      { key: 'prerequis', label: 'Prérequis', get: (i) => txt(i.prerequis) },
      { key: 'descente', label: 'Disponible en Descente', get: (i) => bool(i.descente) },
    ],
  },

  talentsEquipements: {
    // Un talent de torse ne se compare qu'a un autre talent de torse.
    groupBy: (i) => i.emplacement || null,
    groupLabel: (key) => slotLabel(key),
    rows: [
      { key: 'rarete', label: 'Rareté', get: (i) => txt(rarity(i)) },
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
      { key: 'perfectDescription', label: 'Version parfaite', get: (i) => txt(i.perfectDescription) },
      { key: 'gearSet', label: 'Ensemble', get: (i, d) => txt(i.gearSet ? nameOf(d?.ensembles, i.gearSet) : null) },
      { key: 'equipementsParfaits', label: 'Équipements parfaits', get: (i, d) => list(namesOf(i.equipementsParfaits, d?.equipements)) },
      { key: 'prerequis', label: 'Prérequis', get: (i) => txt(i.prerequis) },
      { key: 'descente', label: 'Disponible en Descente', get: (i) => bool(i.descente) },
    ],
  },

  talentsPrototypes: {
    groupBy: () => null,
    groupLabel: () => 'Talents prototypes',
    rows: [
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
      { key: 'statMin', label: 'Valeur minimale', better: 'high', get: (i) => num(i.statMin) },
      { key: 'statMax', label: 'Valeur maximale', better: 'high', get: (i) => num(i.statMax) },
      { key: 'pas', label: 'Pas', get: (i) => num(i.pas) },
    ],
  },

  modsArmes: {
    // Un chargeur ne se compare qu'a un chargeur.
    groupBy: (i) => i.type || null,
    groupLabel: (key, d) => nameOf(d?.modsArmesType, key),
    rows: [
      { key: 'rarete', label: 'Rareté', get: (i) => txt(rarity(i)) },
      { key: 'attributs', label: 'Attributs', get: (i, d) => list(attributesOf(i.attributs, d?.attributs)) },
      { key: 'compatible', label: 'Compatible avec', get: (i, d) => list(namesOf(i.compatible, d?.armes_type)) },
      { key: 'prerequis', label: 'Prérequis', get: (i) => txt(i.prerequis) },
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
    ],
  },

  modsEquipements: {
    groupBy: (i) => i.categorie || null,
    groupLabel: (key) => prettify(key),
    rows: [
      { key: 'categorie', label: 'Catégorie', get: (i) => txt(prettify(i.categorie)) },
      { key: 'attributs', label: 'Attributs', get: (i, d) => list(attributesOf(i.attributs, d?.attributs)) },
    ],
  },

  modsCompetences: {
    // Les mods d'une meme competence se comparent entre eux.
    groupBy: (i) => i.competence || null,
    groupLabel: (key, d) => nameOf(d?.competencesGrouped, key),
    rows: [
      { key: 'emplacement', label: 'Emplacement', get: (i) => txt(prettify(i.emplacement)) },
      { key: 'attributs', label: 'Attributs', get: (i, d) => list(attributesOf(i.attributs, d?.attributs)) },
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
    ],
  },

  descente: {
    // La Descente melange talents d'armes et d'equipements : on ne compare pas
    // les deux familles entre elles.
    groupBy: (i) => (i.isWeaponTalent ? 'arme' : 'equipement'),
    groupLabel: (key) => (key === 'arme' ? "Talents d'armes (Descente)" : "Talents d'équipements (Descente)"),
    rows: [
      { key: 'description', label: 'Description', get: (i) => txt(i.description) },
      { key: 'perfectDescription', label: 'Version parfaite', get: (i) => txt(i.perfectDescription) },
      { key: 'prerequis', label: 'Prérequis', get: (i) => txt(i.prerequis) },
    ],
  },
}

/** La categorie propose-t-elle une comparaison ? */
export function isComparable(category) {
  return Boolean(COMPARISON_CONFIG[category])
}

/**
 * Cle de compatibilite d'un item : deux items ne sont comparables que si elle
 * est identique. Prefixee par la categorie pour ne jamais melanger un torse
 * d'equipement avec un talent de torse.
 */
export function comparisonGroupKey(category, item) {
  const config = COMPARISON_CONFIG[category]
  if (!config || !item) return null
  return `${category}::${config.groupBy(item) ?? '*'}`
}

/** Libelle lisible du groupe, pour expliquer un refus d'ajout. */
export function comparisonGroupLabel(category, item, data) {
  const config = COMPARISON_CONFIG[category]
  if (!config || !item) return ''
  return config.groupLabel(config.groupBy(item), data)
}

/**
 * Construit le tableau de comparaison.
 * Les lignes entierement vides sont retirees : comparer quatre items sur un
 * champ qu'aucun ne renseigne n'apporte rien.
 */
export function buildComparison(category, items, data) {
  const config = COMPARISON_CONFIG[category]
  if (!config || !items?.length) return []

  // `rows` peut dependre des donnees (ex : une ligne par emplacement de mod
  // reellement present dans les JSONC).
  const rows = typeof config.rows === 'function' ? config.rows(data) : config.rows

  return rows
    .map(row => {
      const cells = items.map(item => {
        try {
          return row.get(item, data) ?? null
        } catch {
          return null
        }
      })
      return { key: row.key, label: row.label, better: row.better || null, cells }
    })
    .filter(row => row.cells.some(c => c !== null && !(c.t === 'bool' && c.v === false)))
    .map(row => ({ ...row, best: bestIndexes(row) }))
}

/** Indices des meilleures valeurs d'une ligne numerique (ex aequo inclus). */
function bestIndexes(row) {
  if (!row.better) return []
  const values = row.cells.map(c => (c && c.t === 'num' ? c.v : null))
  const present = values.filter(v => v !== null)
  if (present.length < 2) return []

  const target = row.better === 'high' ? Math.max(...present) : Math.min(...present)
  // Toutes identiques : aucune n'est « meilleure ».
  if (present.every(v => v === target)) return []

  return values.reduce((acc, v, i) => (v === target ? [...acc, i] : acc), [])
}
