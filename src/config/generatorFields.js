/**
 * Configuration des champs pour le générateur JSONC.
 * Types supportés :
 *   text, textarea, number, boolean, enum, array, objectArray,
 *   checkboxMap, radioGroup, tagSelect, autocomplete, autocomplete_array
 */
import { slugify } from '../utils/slugify'

export const GENERATOR_CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'attributs', label: 'Attributs', icon: '📊' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
]

/**
 * Clé unique pour détecter les éléments existants par catégorie.
 * String = champ unique, Array = clé composite.
 */
export const IDENTITY_KEY = {
  armes: 'slug',
  equipements: 'slug',
  talentsArmes: 'slug',
  talentsEquipements: 'slug',
  ensembles: 'slug',
  competences: ['competence', 'variante'],
  attributs: 'slug',
  modsArmes: 'slug',
  modsEquipements: 'slug',
  modsCompetences: 'slug',
}

/**
 * Clé de données dans loadedData correspondant à chaque catégorie.
 */
export const DATA_KEY = {
  armes: 'armes',
  equipements: 'equipements',
  talentsArmes: 'talentsArmes',
  talentsEquipements: 'talentsEquipements',
  ensembles: 'ensembles',
  competences: 'competences',
  attributs: 'attributs',
  modsArmes: 'modsArmes',
  modsEquipements: 'modsEquipements',
  modsCompetences: 'modsCompetences',
}

/**
 * Fichiers JSONC correspondants pour l'export.
 */
export const FILE_MAP = {
  armes: 'armes.jsonc',
  equipements: 'equipements.jsonc',
  talentsArmes: 'talents-armes.jsonc',
  talentsEquipements: 'talents-equipements.jsonc',
  ensembles: 'ensembles.jsonc',
  competences: 'competences.jsonc',
  attributs: 'attributs.jsonc',
  modsArmes: 'mods-armes.jsonc',
  modsEquipements: 'mods-equipements.jsonc',
  modsCompetences: 'mods-competences.jsonc',
}

export const FIELDS = {
  armes: {
    comment: '// Arme — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsArmes', isIdentity: true },
      { key: 'type', label: 'Type', type: 'tagSelect', required: true, options: [
        { value: 'fusil_assaut', label: "Fusil d'assaut", color: 'red' },
        { value: 'fusil', label: 'Fusil', color: 'yellow' },
        { value: 'fusil_precision', label: 'Fusil précision', color: 'blue' },
        { value: 'pistolet_mitrailleur', label: 'PMG', color: 'red' },
        { value: 'fusil_mitrailleur', label: 'Fusil-mitrailleur', color: 'red' },
        { value: 'calibre_12', label: 'Calibre 12', color: 'yellow' },
        { value: 'pistolet', label: 'Pistolet', color: 'blue' },
      ], singleSelect: true },
      { key: 'fabricant', label: 'Fabricant', type: 'autocomplete', suggestionsKey: 'fabricants' },
      { key: 'portee', label: 'Portée (m)', type: 'number' },
      { key: 'rpm', label: 'CPM', type: 'number', step: 1 },
      { key: 'chargeur', label: 'Chargeur', type: 'number', step: 1 },
      { key: 'rechargement', label: 'Rechargement (s)', type: 'number', step: 0.1 },
      { key: 'headshot', label: 'Headshot (%)', type: 'text' },
      { key: 'degatsBase', label: 'Dégâts base', type: 'number', step: 1 },
      { key: 'degatsMax', label: 'Dégâts max', type: 'number', step: 1 },
      { key: '_rarity', label: 'Rareté', type: 'radioGroup', target: { exo: 'estExotique', nom: 'estNomme' }, options: [
        { value: '', label: 'Standard' },
        { value: 'exo', label: 'Exotique' },
        { value: 'nom', label: 'Nommé' },
      ]},
      { key: 'talents', label: 'Talents', type: 'autocomplete_array', suggestionsKey: 'talentsArmes', placeholder: 'Rechercher un talent...' },
      { key: 'attributs', label: 'Attributs fixés', type: 'objectArray', fields: [
        { key: 'nom', label: 'Nom', type: 'autocomplete', suggestionsKey: 'attributs' },
        { key: 'valeur', label: 'Valeur', type: 'number' },
      ]},
      { key: 'emplacementsMods', label: 'Emplacements Mods', type: 'tagSelect', options: [
        { value: 'chargeur', label: 'Chargeur', color: 'yellow' },
        { value: 'canon', label: 'Canon', color: 'red' },
        { value: 'viseur', label: 'Viseur', color: 'blue' },
        { value: 'accessoire', label: 'Accessoire', color: 'yellow' },
      ]},
      { key: 'modsPredefinis', label: 'Mods prédéfinis (exotiques)', type: 'autocomplete_array', suggestionsKey: 'modsArmes', placeholder: 'Rechercher un mod...', visibleWhen: { key: '_rarity', value: 'exo' } },
      { key: 'obtention', label: 'Obtention', type: 'text' },
      { key: 'icone', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },
    ],
  },

  equipements: {
    comment: '// Équipement — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsEquipements', isIdentity: true },
      { key: 'marque', label: 'Marque / Gear Set', type: 'autocomplete', suggestionsKey: 'marques' },
      { key: 'emplacement', label: 'Emplacement', type: 'tagSelect', required: true, singleSelect: true, options: [
        { value: 'masque', label: 'Masque', color: 'blue' },
        { value: 'torse', label: 'Torse', color: 'red' },
        { value: 'holster', label: 'Holster', color: 'yellow' },
        { value: 'sac_a_dos', label: 'Sac à dos', color: 'red' },
        { value: 'gants', label: 'Gants', color: 'blue' },
        { value: 'genouilleres', label: 'Genouillères', color: 'yellow' },
      ]},
      { key: 'attributEssentiel', label: 'Attribut(s) essentiel(s)', type: 'tagSelect', options: [
        { value: 'offensif', label: 'Offensif', color: 'red' },
        { value: 'défensif', label: 'Défensif', color: 'blue' },
        { value: 'utilitaire', label: 'Utilitaire', color: 'yellow' },
      ]},
      { key: 'attributs', label: 'Attributs fixés', type: 'objectArray', fields: [
        { key: 'nom', label: 'Nom', type: 'autocomplete', suggestionsKey: 'attributs' },
        { key: 'valeur', label: 'Valeur', type: 'number' },
      ]},
      { key: 'talents', label: 'Talents', type: 'autocomplete_array', suggestionsKey: 'talentsEquipements', placeholder: 'Rechercher un talent...' },
      { key: 'mod', label: 'Emplacement de mod', type: 'boolean' },
      { key: 'type', label: 'Type', type: 'tagSelect', singleSelect: true, options: [
        { value: 'standard', label: 'Standard', color: 'blue' },
        { value: 'exotique', label: 'Exotique', color: 'red' },
        { value: 'gear_set', label: 'Gear Set', color: 'green' },
      ]},
      { key: 'estNomme', label: 'Nommé', type: 'boolean', hiddenWhen: { key: 'type', value: 'exotique' } },
      { key: 'obtention', label: 'Obtention', type: 'text' },
      { key: 'attributUnique', label: 'Attribut unique', type: 'text' },
    ],
  },

  talentsArmes: {
    comment: "// Talent d'arme — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsTalentsArmes', isIdentity: true },
      { key: 'icone', label: 'Icône (slug)', type: 'text', required: true, placeholder: 'nom_fichier_sans_extension' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'prerequis', label: 'Prérequis', type: 'text' },
      { key: 'estExotique', label: 'Talent exotique', type: 'boolean' },
      { key: 'compatibilite', label: 'Compatibilité', type: 'tagSelect', hiddenWhen: { key: 'estExotique', value: true }, options: [
        { value: 'fusil', label: 'Fusil', color: 'yellow' },
        { value: 'calibre_12', label: 'Calibre 12', color: 'yellow' },
        { value: 'fusil_assaut', label: "Fusil d'assaut", color: 'red' },
        { value: 'fusil_mitrailleur', label: 'Fusil-mitrailleur', color: 'red' },
        { value: 'fusil_precision', label: 'Fusil précision', color: 'blue' },
        { value: 'pistolet', label: 'Pistolet', color: 'blue' },
        { value: 'pistolet_mitrailleur', label: 'PMG', color: 'red' },
      ], outputAsObject: true },
      { key: 'perfectDescription', label: 'Description parfaite', type: 'textarea', hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'armesParfaites', label: 'Armes parfaites', type: 'autocomplete_array', suggestionsKey: 'armesNommees', placeholder: "Rechercher une arme nommée...", hiddenWhen: { key: 'estExotique', value: true } },
    ],
  },

  talentsEquipements: {
    comment: "// Talent d'équipement — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsTalentsEquipements', isIdentity: true },
      { key: 'icone', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'prerequis', label: 'Prérequis', type: 'text' },
      { key: 'estExotique', label: 'Talent exotique', type: 'boolean' },
      { key: 'emplacement', label: 'Emplacement', type: 'tagSelect', required: true, singleSelect: true, options: [
        { value: 'torse', label: 'Torse', color: 'red' },
        { value: 'sac_a_dos', label: 'Sac à dos', color: 'blue' },
        { value: 'tous', label: 'Tous', color: 'yellow' },
      ]},
      { key: 'perfectDescription', label: 'Description parfaite', type: 'textarea', hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'equipementsParfaits', label: 'Équipements parfaits', type: 'autocomplete_array', suggestionsKey: 'equipementsNommes', placeholder: "Rechercher un équipement nommé...", hiddenWhen: { key: 'estExotique', value: true } },
    ],
  },

  ensembles: {
    comment: '// Ensemble — The Division 2',
    generateEquipment: true,
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsEnsembles', isIdentity: true },
      { key: 'type', label: 'Type', type: 'tagSelect', required: true, singleSelect: true, options: [
        { value: 'gear_set', label: 'Gear Set', color: 'green' },
        { value: 'marque', label: 'Marque', color: 'blue' },
      ]},
      { key: 'logo', label: 'Logo (fichier)', type: 'text', placeholder: 'nom-du-logo.png' },
      { key: 'attributsEssentiels', label: 'Attributs essentiels', type: 'tagSelect', options: [
        { value: 'Offensif', label: 'Offensif', color: 'red' },
        { value: 'Défensif', label: 'Défensif', color: 'blue' },
        { value: 'Utilitaire', label: 'Utilitaire', color: 'yellow' },
      ]},
      { key: 'bonus1piece', label: 'Bonus 1 pièce', type: 'text', hiddenWhen: { key: 'type', value: 'gear_set' } },
      { key: 'bonus2pieces', label: 'Bonus 2 pièces', type: 'text' },
      { key: 'bonus3pieces', label: 'Bonus 3 pièces', type: 'text' },
      { key: 'bonus4pieces', label: 'Bonus 4 pièces (gear set)', type: 'textarea', hiddenWhen: { key: 'type', value: 'marque' } },
      { key: 'talentTorse', label: 'Talent Torse (gear set)', type: 'autocomplete', suggestionsKey: 'talentsEquipements', hiddenWhen: { key: 'type', value: 'marque' } },
      { key: 'talentSac', label: 'Talent Sac (gear set)', type: 'autocomplete', suggestionsKey: 'talentsEquipements', hiddenWhen: { key: 'type', value: 'marque' } },
    ],
  },

  competences: {
    comment: '// Compétence — The Division 2',
    fields: [
      { key: 'competence', label: 'Compétence', type: 'autocomplete', suggestionsKey: 'competences', required: true, placeholder: 'TOURELLE, DRONE...', isIdentity: true },
      { key: 'variante', label: 'Variante', type: 'autocomplete', required: true, suggestionsKey: 'variantes', isIdentity: true },
      { key: 'prerequis', label: 'Spécialisation requise', type: 'tagSelect', singleSelect: true, dynamicOptions: 'specialisations' },
      { key: 'icone', label: 'Icône (slug)', type: 'text' },
      { key: 'expertise', label: 'Expertise', type: 'text' },
      { key: 'statistiques', label: 'Statistiques', type: 'textarea' },
      { key: 'effetEtat', label: "Effet d'état", type: 'text' },
      { key: 'tier1', label: 'Tier 1', type: 'text', required: true },
      { key: 'tier2', label: 'Tier 2', type: 'text', required: true },
      { key: 'tier3', label: 'Tier 3', type: 'text', required: true },
      { key: 'tier4', label: 'Tier 4', type: 'text', required: true },
      { key: 'tier5', label: 'Tier 5', type: 'text', required: true },
      { key: 'tier6', label: 'Tier 6', type: 'text', required: true },
      { key: 'surcharge', label: 'Surcharge', type: 'text', required: true },
    ],
  },

  attributs: {
    comment: '// Attribut — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsAttributs', isIdentity: true },
      { key: 'categorie', label: 'Catégorie', type: 'tagSelect', required: true, singleSelect: true, options: [
        { value: 'offensif', label: 'Offensif', color: 'red' },
        { value: 'défensif', label: 'Défensif', color: 'blue' },
        { value: 'utilitaire', label: 'Utilitaire', color: 'yellow' },
      ]},
      { key: 'cible', label: 'Cible', type: 'tagSelect', options: [
        { value: 'arme', label: 'Arme', color: 'red' },
        { value: 'equipement', label: 'Équipement', color: 'blue' },
      ]},
      { key: 'unite', label: 'Unité', type: 'text', placeholder: '%, pts, pts/s...' },
      { key: 'min', label: 'Minimum', type: 'number', step: 0.1 },
      { key: 'max', label: 'Maximum', type: 'number', step: 0.1 },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },

  modsArmes: {
    comment: "// Mod d'arme — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsModsArmes', isIdentity: true },
      { key: 'type', label: 'Type', type: 'tagSelect', singleSelect: true, options: [
        { value: 'chargeur', label: 'Chargeur', color: 'yellow' },
        { value: 'canon', label: 'Canon', color: 'red' },
        { value: 'viseur', label: 'Viseur', color: 'blue' },
        { value: 'accessoire', label: 'Accessoire', color: 'yellow' },
        { value: 'autre', label: 'Autre', color: 'green' },
      ]},
      { key: 'bonus', label: 'Bonus', type: 'text' },
      { key: 'malus', label: 'Malus', type: 'text' },
      { key: 'estExotique', label: 'Mod exotique', type: 'boolean' },
    ],
  },

  modsEquipements: {
    comment: "// Mod d'équipement — The Division 2",
    fields: [
      { key: 'categorie', label: 'Catégorie', type: 'tagSelect', singleSelect: true, options: [
        { value: 'offensif', label: 'Offensif', color: 'red' },
        { value: 'défensif', label: 'Défensif', color: 'blue' },
        { value: 'utilitaire', label: 'Utilitaire', color: 'yellow' },
      ]},
      { key: 'protocole', label: 'Protocole', type: 'text' },
      { key: 'statistique', label: 'Statistique', type: 'autocomplete', required: true, suggestionsKey: 'nomsModsEquipements', isIdentity: true },
      { key: 'valeurMax', label: 'Valeur max', type: 'text' },
    ],
  },

  modsCompetences: {
    comment: '// Mod de compétence — The Division 2',
    fields: [
      { key: 'competence', label: 'Compétence', type: 'autocomplete', suggestionsKey: 'competences', required: true, isIdentity: true },
      { key: 'emplacement', label: 'Emplacement', type: 'autocomplete', suggestionsKey: 'emplacementsModsCompetences', required: true },
      { key: 'prerequis', label: 'Spécialisation requise', type: 'tagSelect', singleSelect: true, dynamicOptions: 'specialisations' },
      { key: 'statistiques', label: 'Statistiques', type: 'array', itemType: 'text', placeholder: 'Nom de la statistique...' },
    ],
  },
}

/** Construit les listes de suggestions. */
export function buildSuggestions(loadedData, generatorData, savedItems) {
  const s = {}
  // Merge saved items into loaded data for suggestions
  const merged = {}
  for (const cat of GENERATOR_CATEGORIES) {
    const dk = DATA_KEY[cat.key]
    const loaded = loadedData?.[dk] || []
    const saved = savedItems?.[cat.key] || []
    merged[dk] = [...loaded, ...saved]
  }

  // --- Noms par catégorie (pour autocomplétion du champ nom/identifiant) ---
  s.nomsArmes = [...new Set((merged.armes || []).map(a => a.nom).filter(Boolean))].sort()
  s.nomsEquipements = [...new Set((merged.equipements || []).map(e => e.nom).filter(Boolean))].sort()
  // Prioritize equipements matching selected marque
  const selectedMarque = generatorData?.equipements?.marque
  if (selectedMarque) {
    const marqueEquips = new Set(
      (merged.equipements || []).filter(e => e.marque?.toLowerCase() === selectedMarque.toLowerCase()).map(e => e.nom)
    )
    s.nomsEquipements = s.nomsEquipements.sort((a, b) => {
      const aMatch = marqueEquips.has(a) ? 0 : 1
      const bMatch = marqueEquips.has(b) ? 0 : 1
      return aMatch - bMatch || a.localeCompare(b)
    })
  }
  s.nomsTalentsArmes = [...new Set((merged.talentsArmes || []).map(t => t.nom).filter(Boolean))].sort()
  s.nomsTalentsEquipements = [...new Set((merged.talentsEquipements || []).map(t => t.nom).filter(Boolean))].sort()
  s.nomsEnsembles = [...new Set((merged.ensembles || []).map(e => e.nom).filter(Boolean))].sort()
  s.nomsAttributs = [...new Set((merged.attributs || []).map(a => a.nom).filter(Boolean))].sort()
  s.nomsModsArmes = [...new Set((merged.modsArmes || []).map(m => m.nom).filter(Boolean))].sort()
  s.nomsModsEquipements = [...new Set((merged.modsEquipements || []).map(m => m.statistique).filter(Boolean))].sort()

  // Compétences : flat array (from flattened) or grouped (from raw)
  const flatComps = merged.competences || []

  // Variantes filtrées par la compétence sélectionnée
  const selectedComp = generatorData?.competences?.competence
  if (selectedComp) {
    const compLower = selectedComp.toLowerCase()
    s.variantes = [...new Set(flatComps.filter(c => c.competence.toLowerCase() === compLower).map(c => c.variante).filter(Boolean))].sort()
  } else {
    s.variantes = [...new Set(flatComps.map(c => c.variante).filter(Boolean))].sort()
  }

  // Spécialisations (depuis class-spe.jsonc)
  s.specialisations = (loadedData?.classSpe || []).map(sp => ({ value: sp.cle, label: sp.nom })).sort((a, b) => a.label.localeCompare(b.label))

  // Emplacements de mods de compétences (from competencesGrouped or from flat enriched data)
  const groupedComps = loadedData?.competencesGrouped || []
  const emplacementSet = new Set()
  groupedComps.forEach(c => {
    (c.emplacementsMods || []).forEach(em => emplacementSet.add(em.emplacement))
  })
  // Also from flat data if emplacementsMods is available
  flatComps.forEach(c => {
    (c.emplacementsMods || []).forEach(em => emplacementSet.add(em.emplacement))
  })
  s.emplacementsModsCompetences = Array.from(emplacementSet).sort()

  // --- Fabricants d'armes ---
  const fabSet = new Set()
  merged.armes?.forEach(a => { if (a.fabricant) fabSet.add(a.fabricant) })
  if (generatorData?.armes?.fabricant) fabSet.add(generatorData.armes.fabricant)
  s.fabricants = Array.from(fabSet).sort()

  const marqueMap = new Map()
  merged.equipements?.forEach(e => { if (e.marque) marqueMap.set(e.marque, e.marque) })
  merged.ensembles?.forEach(e => { if (e.slug) marqueMap.set(e.slug, e.nom) })
  if (generatorData?.equipements?.marque) marqueMap.set(generatorData.equipements.marque, generatorData.equipements.marque)
  if (generatorData?.ensembles?.nom) {
    const slug = generatorData.ensembles.slug || slugify(generatorData.ensembles.nom)
    marqueMap.set(slug, generatorData.ensembles.nom)
  }
  s.marques = [...marqueMap.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([slug, nom]) => ({ value: slug, label: nom }))

  // Cross-reference suggestions: {value: slug, label: name} format
  // Used by autocomplete_array fields that store slugs
  s.talentsArmes = (merged.talentsArmes || []).filter(t => t.slug && t.nom).map(t => ({ value: t.slug, label: t.nom }))
  s.talentsArmes.sort((a, b) => a.label.localeCompare(b.label))
  if (generatorData?.talentsArmes?.nom) {
    const slug = generatorData.talentsArmes.slug || slugify(generatorData.talentsArmes.nom)
    if (!s.talentsArmes.find(t => t.value === slug)) {
      s.talentsArmes.push({ value: slug, label: generatorData.talentsArmes.nom })
    }
  }

  s.talentsEquipements = (merged.talentsEquipements || []).filter(t => t.slug && t.nom).map(t => ({ value: t.slug, label: t.nom }))
  s.talentsEquipements.sort((a, b) => a.label.localeCompare(b.label))
  if (generatorData?.talentsEquipements?.nom) {
    const slug = generatorData.talentsEquipements.slug || slugify(generatorData.talentsEquipements.nom)
    if (!s.talentsEquipements.find(t => t.value === slug)) {
      s.talentsEquipements.push({ value: slug, label: generatorData.talentsEquipements.nom })
    }
  }

  s.attributs = (merged.attributs || []).filter(a => a.slug && a.nom).map(a => ({ value: a.slug, label: a.nom }))
  s.attributs.sort((a, b) => a.label.localeCompare(b.label))

  s.modsArmes = (merged.modsArmes || []).filter(m => m.slug && m.nom).map(m => ({ value: m.slug, label: m.nom }))
  s.modsArmes.sort((a, b) => a.label.localeCompare(b.label))

  // Slug-keyed lookups for display resolution
  s._slugToName = {}
  const addLookup = (items, nameField = 'nom') => {
    for (const item of (items || [])) {
      if (item.slug && item[nameField]) s._slugToName[item.slug] = item[nameField]
    }
  }
  addLookup(merged.armes)
  addLookup(merged.equipements)
  addLookup(merged.talentsArmes)
  addLookup(merged.talentsEquipements)
  addLookup(merged.attributs)
  addLookup(merged.modsArmes)
  addLookup(merged.ensembles)

  const armesNom = new Map()
  merged.armes?.forEach(a => { if ((a.estNomme || a.estExotique) && a.slug) armesNom.set(a.slug, a.nom) })
  if (generatorData?.armes?.nom && generatorData.armes._rarity) {
    const slug = generatorData.armes.slug || slugify(generatorData.armes.nom)
    armesNom.set(slug, generatorData.armes.nom)
  }
  s.armesNommees = [...armesNom.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([slug, nom]) => ({ value: slug, label: nom }))

  const equipNom = new Map()
  merged.equipements?.forEach(e => { if ((e.estNomme || e.type === 'exotique') && e.slug) equipNom.set(e.slug, e.nom) })
  if (generatorData?.equipements?.nom && generatorData.equipements._rarity) {
    const slug = generatorData.equipements.slug || slugify(generatorData.equipements.nom)
    equipNom.set(slug, generatorData.equipements.nom)
  }
  s.equipementsNommes = [...equipNom.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([slug, nom]) => ({ value: slug, label: nom }))

  const compSet = new Set()
  flatComps.forEach(c => { if (c.competence) compSet.add(c.competence) })
  // Also from grouped if available
  groupedComps.forEach(c => { if (c.competence) compSet.add(c.competence) })
  s.competences = Array.from(compSet).sort()

  return s
}

/** Génère les valeurs par défaut pour une catégorie. */
export function getDefaults(categoryKey) {
  const config = FIELDS[categoryKey]
  if (!config) return {}
  const defaults = {}
  for (const field of config.fields) {
    switch (field.type) {
      case 'boolean': defaults[field.key] = false; break
      case 'number': defaults[field.key] = ''; break
      case 'array':
      case 'autocomplete_array': defaults[field.key] = []; break
      case 'objectArray': defaults[field.key] = []; break
      case 'tagSelect': defaults[field.key] = field.singleSelect ? '' : []; break
      case 'checkboxMap':
        defaults[field.key] = {}
        field.keys?.forEach(k => { defaults[field.key][k.key] = false })
        break
      case 'radioGroup': defaults[field.key] = ''; break
      default: defaults[field.key] = ''; break
    }
  }
  return defaults
}

/** Nettoie l'objet formulaire pour la sortie JSONC. */
export function cleanOutput(data, categoryKey) {
  const config = FIELDS[categoryKey]
  if (!config) return data
  const result = {}
  for (const field of config.fields) {
    if (field.type === 'radioGroup' && field.target) {
      const val = data[field.key]
      for (const [optKey, targetField] of Object.entries(field.target)) {
        if (val === optKey) result[targetField] = true
      }
      continue
    }
    const val = data[field.key]
    if (val === '' || val === undefined || val === null) continue
    if (field.type === 'boolean' && val === false) continue

    // tagSelect
    if (field.type === 'tagSelect') {
      if (field.outputAsObject) {
        // Convert array → { key: true, ... } for compatibilité
        if (Array.isArray(val) && val.length > 0) {
          const obj = {}
          val.forEach(v => { obj[v] = true })
          result[field.key] = obj
        }
        continue
      }
      if (field.singleSelect) {
        if (val) result[field.key] = val
      } else {
        if (Array.isArray(val) && val.length > 0) result[field.key] = val
      }
      continue
    }

    if ((field.type === 'array' || field.type === 'autocomplete_array') && Array.isArray(val) && val.length === 0) continue
    if (field.type === 'objectArray' && Array.isArray(val) && val.length === 0) continue
    if (field.type === 'checkboxMap') {
      const any = Object.values(val || {}).some(Boolean)
      if (!any) continue
      result[field.key] = val
      continue
    }
    if (field.type === 'number' && val !== '') {
      result[field.key] = Number(val)
      continue
    }
    result[field.key] = val
  }


  // Auto-generate slug si absent ou si nouveau (pas en mode édition)
  if (!result.slug) {
    if (categoryKey === 'modsEquipements') {
      result.slug = slugify(result.statistique || '')
    } else if (categoryKey === 'modsCompetences') {
      result.slug = slugify((result.competence || '') + '_' + (result.emplacement || ''))
    } else {
      result.slug = slugify(result.nom || '')
    }
  }

  return result
}

/** Génère les 6 pièces d'équipement pré-remplies pour un ensemble. */
export function generateEquipmentSet(ensembleData) {
  const nom = ensembleData.nom || 'Nouvel Ensemble'
  const ensembleSlug = ensembleData.slug || slugify(nom)
  const type = ensembleData.type || 'marque'
  const attrs = ensembleData.attributsEssentiels || []
  const attrEss = attrs.map(a => {
    const n = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return n === 'offensif' ? 'offensif' : n === 'defensif' ? 'défensif' : 'utilitaire'
  })

  const SLOTS = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres']
  const LABELS = { masque: 'Masque', torse: 'Torse', holster: 'Holster', sac_a_dos: 'Sac à dos', gants: 'Gants', genouilleres: 'Genouillères' }

  const SLOTS_WITH_MOD = ['torse', 'sac_a_dos']

  return SLOTS.map(slot => ({
    nom: `${LABELS[slot]} ${nom}`,
    slug: slugify(`${LABELS[slot]} ${nom}`),
    marque: ensembleSlug,
    emplacement: slot,
    attributEssentiel: attrEss.length > 0 ? [...attrEss] : ['offensif'],
    mod: SLOTS_WITH_MOD.includes(slot),
    type: type === 'gear_set' ? 'gear_set' : 'standard',
  }))
}

/**
 * Cherche un élément existant dans les données chargées.
 * Supporte les clés simples (string) et composites (array).
 */
export function findExisting(categoryKey, identityValues, loadedData, savedItems) {
  const dk = DATA_KEY[categoryKey]
  const idKey = IDENTITY_KEY[categoryKey]
  if (!idKey) return null

  const matcher = buildMatcher(idKey, identityValues)
  if (!matcher) return null

  const saved = savedItems?.[categoryKey] || []
  const found = saved.find(matcher)
  if (found) return { ...found, _source: 'saved' }

  const loaded = loadedData?.[dk] || []
  const foundLoaded = loaded.find(matcher)
  if (foundLoaded) return { ...foundLoaded, _source: 'loaded' }

  return null
}

/**
 * Récupère la/les valeur(s) d'identité depuis les données du formulaire.
 * Retourne une string (clé simple) ou un objet { key: value } (clé composite), ou null.
 */
export function getIdentityValue(categoryKey, formData) {
  const idKey = IDENTITY_KEY[categoryKey]
  if (!idKey) return null
  if (Array.isArray(idKey)) {
    const vals = {}
    let allFilled = true
    for (const k of idKey) {
      const v = formData[k]
      if (!v || !String(v).trim()) { allFilled = false; break }
      vals[k] = String(v).trim()
    }
    return allFilled ? vals : null
  }
  const v = formData[idKey]
  return v && String(v).trim() ? String(v).trim() : null
}

/**
 * Retourne le nom affiché de l'identité pour le bandeau d'édition.
 */
export function getIdentityLabel(categoryKey, identityValues, formData) {
  if (!identityValues) return ''
  // For slug-based identity, show the nom instead
  if (formData?.nom) return formData.nom
  if (typeof identityValues === 'string') return identityValues
  // Composite : join values
  return Object.values(identityValues).join(' — ')
}

/** Construit un matcher function pour chercher un item selon idKey + values. */
function buildMatcher(idKey, values) {
  if (!values) return null
  if (Array.isArray(idKey)) {
    if (typeof values !== 'object') return null
    return (item) => idKey.every(k =>
      (item[k] || '').toLowerCase() === (values[k] || '').toLowerCase()
    )
  }
  const name = typeof values === 'string' ? values : values[idKey]
  if (!name) return null
  const nameLower = name.toLowerCase()
  return (item) => (item[idKey] || '').toLowerCase() === nameLower
}

/**
 * Convertit un objet chargé en données de formulaire.
 */
export function itemToFormData(categoryKey, item) {
  const config = FIELDS[categoryKey]
  if (!config || !item) return null
  const data = getDefaults(categoryKey)

  // Always preserve slug from existing item
  if (item.slug) data.slug = item.slug

  for (const field of config.fields) {
    if (field.type === 'radioGroup' && field.target) {
      for (const [optKey, targetField] of Object.entries(field.target)) {
        if (item[targetField] === true) data[field.key] = optKey
      }
      continue
    }
    if (field.type === 'tagSelect' && field.outputAsObject && item[field.key]) {
      // Convert { fusil: true, pistolet: true } → ['fusil', 'pistolet']
      data[field.key] = Object.entries(item[field.key]).filter(([, v]) => v).map(([k]) => k)
      continue
    }
    if (item[field.key] !== undefined && item[field.key] !== null) {
      data[field.key] = field.type === 'number' ? String(item[field.key]) : item[field.key]
    }
  }
  return data
}
















































