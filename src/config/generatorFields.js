/**
 * Configuration des champs pour le générateur JSONC.
 * Types supportés :
 * text, textarea, number, boolean, enum, array, objectArray,
 * checkboxMap, radioGroup, tagSelect, autocomplete, autocomplete_array
 */
import { slugify } from '../utils/slugify'

export const GENERATOR_CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'talentsAutres', label: "Talents Autres (Descente)", icon: '🌀' },
  { key: 'talentsPrototypes', label: 'Talents Prototypes', icon: '💎' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'attributs', label: 'Attributs', icon: '📊' },
  { key: 'statistiques', label: 'Statistiques', icon: '📈' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
  { key: 'builds', label: 'Builds Prédéfinis', icon: '🏗️' },
  { key: 'buildsTags', label: 'Tags de Build', icon: '🏷️' },
]

export const IDENTITY_KEY = {
  armes: 'slug',
  equipements: 'slug',
  talentsArmes: 'slug',
  talentsEquipements: 'slug',
  talentsAutres: 'slug',
  talentsPrototypes: 'slug',
  ensembles: 'slug',
  competences: ['competence', 'variante'],
  attributs: 'slug',
  statistiques: 'slug',
  modsArmes: 'slug',
  modsEquipements: 'slug',
  modsCompetences: 'slug',
  builds: 'nom',
  buildsTags: 'id',
}

export const DATA_KEY = {
  armes: 'armes',
  equipements: 'equipements',
  talentsArmes: 'talentsArmes',
  talentsEquipements: 'talentsEquipements',
  talentsAutres: 'talentsAutres',
  talentsPrototypes: 'talentsPrototypes',
  ensembles: 'ensembles',
  competences: 'competences',
  attributs: 'attributs',
  statistiques: 'statistiques',
  modsArmes: 'modsArmes',
  modsEquipements: 'modsEquipements',
  modsCompetences: 'modsCompetences',
  builds: 'builds',
  buildsTags: 'buildsTags',
}

export const FILE_MAP = {
  armes: 'armes/armes.jsonc',
  equipements: 'equipements/equipements.jsonc',
  talentsArmes: 'armes/talents-armes.jsonc',
  talentsEquipements: 'equipements/talents-equipements.jsonc',
  talentsAutres: 'talents-autres.jsonc',
  talentsPrototypes: 'talents-prototypes.jsonc',
  ensembles: 'equipements/ensembles.jsonc',
  competences: 'competences.jsonc',
  attributs: 'attributs/attributs.jsonc',
  statistiques: 'attributs/statistiques.jsonc',
  modsArmes: 'armes/mods-armes.jsonc',
  modsEquipements: 'equipements/mods-equipements.jsonc',
  modsCompetences: 'mods-competences.jsonc',
  builds: 'builds/builds.jsonc',
  buildsTags: 'builds/tags.jsonc',
}

export const FIELDS = {
  armes: {
    comment: '// Arme — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsArmes', isIdentity: true },
      { key: 'type', label: 'Type', type: 'tagSelect', required: true, dynamicOptions: 'armesTypes', singleSelect: true },
      { key: 'fabricant', label: 'Fabricant', type: 'autocomplete', suggestionsKey: 'fabricants' },
      { key: 'portee', label: 'Portée (m)', type: 'number', min: 0 },
      { key: 'prototypePortee', label: 'Portée (Prototype)', type: 'number', min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'portee', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'rpm', label: 'CPM', type: 'number', step: 1, min: 0 },
      { key: 'prototypeRpm', label: 'CPM (Prototype)', type: 'number', step: 1, min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'rpm', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'chargeur', label: 'Chargeur', type: 'number', step: 1, min: 0 },
      { key: 'prototypeChargeur', label: 'Chargeur (Prototype)', type: 'number', step: 1, min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'chargeur', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'rechargement', label: 'Rechargement (s)', type: 'number', step: 0.1, min: 0 },
      { key: 'prototypeRechargement', label: 'Rechargement (Prototype)', type: 'number', step: 0.1, min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'rechargement', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'headshot', label: 'Headshot (%)', type: 'number', step: 1, min: 0 },
      { key: 'prototypeHeadshot', label: 'Headshot (Prototype)', type: 'number', step: 1, min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'headshot', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'degatsBase', label: 'Dégâts base', type: 'number', step: 1, min: 0 },
      { key: 'prototypeDegatsBase', label: 'Dégâts base (Prototype)', type: 'number', step: 1, min: 0, visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'degatsBase', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: '_rarity', label: 'Rareté', type: 'radioGroup', target: { exo: 'estExotique', nom: 'estNomme' }, options: [
          { value: '', label: 'Standard' },
          { value: 'exo', label: 'Exotique' },
          { value: 'nom', label: 'Nommé' },
        ]},
      { key: 'talents', label: 'Talents', type: 'autocomplete_array', suggestionsKey: 'talentsArmes', placeholder: 'Rechercher un talent...' },
      { key: 'talentsPrototypes', label: 'Talents Prototypes', type: 'autocomplete_array', suggestionsKey: 'talentsPrototypes', placeholder: 'Rechercher un talent prototype...', hiddenWhen: { key: '_rarity', value: 'exo' } },
      { key: 'attributs', label: 'Attributs fixés', type: 'objectArray', fields: [
          { key: 'nom', label: 'Nom', type: 'autocomplete', suggestionsKey: 'attributs' },
          { key: 'valeur', label: 'Valeur', type: 'number' },
          { key: 'prototypeValue', label: 'Valeur (Prototype)', type: 'number', visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'valeur', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
        ]},
      { key: 'emplacementsMods', label: 'Emplacements Mods', type: 'objectGroup', fields: [
          { key: 'chargeur', label: 'Chargeur (slug mod)', type: 'autocomplete', suggestionsKey: 'modsArmes' },
          { key: 'canon', label: 'Canon (slug mod)', type: 'autocomplete', suggestionsKey: 'modsArmes' },
          { key: 'viseur', label: 'Viseur (slug mod)', type: 'autocomplete', suggestionsKey: 'modsArmes' },
          { key: 'bouche', label: 'Bouche (slug mod)', type: 'autocomplete', suggestionsKey: 'modsArmes' },
        ]},
      { key: 'modsPredefinis', label: 'Mods prédéfinis (exotiques)', type: 'autocomplete_array', suggestionsKey: 'modsArmes', placeholder: 'Rechercher un mod...', visibleWhen: { key: '_rarity', value: 'exo' } },
      { key: 'attributs_essentiels', label: 'Attributs essentiels', type: 'objectArray', fields: [
          { key: 'nom', label: 'Nom', type: 'autocomplete', suggestionsKey: 'attributs' },
          { key: 'valeur', label: 'Valeur', type: 'number' },
          { key: 'prototypeValue', label: 'Valeur (Prototype)', type: 'number', visibleWhen: [{ key: 'type', notEmpty: true }, { key: 'valeur', notEmpty: true }], hiddenWhen: { key: '_rarity', value: 'exo' } },
        ]},
      { key: 'armePoing', label: 'Arme de poing', type: 'boolean' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'obtention', label: 'Obtention', type: 'objectGroup', fields: [
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'butinCible', label: 'Butin ciblé', type: 'triState' },
          { key: 'cachesExotiques', label: 'Caches exotiques', type: 'triState' },
          { key: 'darkZone', label: 'Dark Zone', type: 'triState' },
          { key: 'mission', label: 'Mission', type: 'triState' },
          { key: 'raid', label: 'Raid', type: 'triState' },
          { key: 'craft', label: 'Craft', type: 'triState' },
          { key: 'incursion', label: 'Incursion', type: 'triState' },
          { key: 'represailles', label: 'Schémas représailles (faction)', type: 'text', placeholder: 'Nom de la faction (optionnel)' },
        ]},
      { key: 'icon', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },
    ],
  },

  equipements: {
    comment: '// Équipement — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsEquipements', isIdentity: true },
      { key: 'marque', label: 'Marque / Gear Set', type: 'autocomplete', suggestionsKey: 'marques' },
      { key: 'emplacement', label: 'Emplacement', type: 'tagSelect', required: true, singleSelect: true, dynamicOptions: 'equipementsTypes' },
      { key: 'attributEssentiel', label: 'Attribut(s) essentiel(s)', type: 'tagSelect', dynamicOptions: 'attributsTypes' },
      { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
          { key: 'nom', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'attributs' },
          { key: 'valeur', label: 'Valeur', type: 'number', step: 0.1 },
          { key: 'prototypeValue', label: 'Valeur (Prototype)', type: 'number', step: 0.1, visibleWhen: [{ key: 'emplacement', notEmpty: true }, { key: 'valeur', notEmpty: true }], hiddenWhen: { key: 'type', value: 'exotique' } },
        ]},
      { key: 'talents', label: 'Talents', type: 'autocomplete_array', suggestionsKey: 'talentsEquipements', placeholder: 'Rechercher un talent...' },
      { key: 'talentsPrototypes', label: 'Talents Prototypes', type: 'autocomplete_array', suggestionsKey: 'talentsPrototypes', placeholder: 'Rechercher un talent prototype...', hiddenWhen: { key: 'type', value: 'exotique' } },
      { key: 'mod', label: 'Emplacement de mod', type: 'boolean' },
      { key: 'type', label: 'Type', type: 'tagSelect', singleSelect: true, options: [
          { value: 'standard', label: 'Standard', color: 'blue' },
          { value: 'exotique', label: 'Exotique', color: 'red' },
          { value: 'gear_set', label: 'Gear Set', color: 'green' },
        ]},
      { key: 'estNomme', label: 'Nommé', type: 'boolean', hiddenWhen: { key: 'type', value: 'exotique' } },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'obtention', label: 'Obtention', type: 'objectGroup', fields: [
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'butinCible', label: 'Butin ciblé', type: 'triState' },
          { key: 'cachesExotiques', label: 'Caches exotiques', type: 'triState' },
          { key: 'darkZone', label: 'Dark Zone', type: 'triState' },
          { key: 'mission', label: 'Mission', type: 'triState' },
          { key: 'raid', label: 'Raid', type: 'triState' },
          { key: 'craft', label: 'Craft', type: 'triState' },
          { key: 'incursion', label: 'Incursion', type: 'triState' },
          { key: 'represailles', label: 'Schémas représailles (faction)', type: 'text', placeholder: 'Nom de la faction (optionnel)' },
        ]},
      { key: 'attributUnique', label: 'Attribut unique', type: 'text' },
    ],
  },

  talentsArmes: {
    comment: "// Talent d'arme — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsTalentsArmes', isIdentity: true },
      { key: 'icon', label: 'Icône (slug)', type: 'text', required: true, placeholder: 'nom_fichier_sans_extension' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'prerequis', label: 'Prérequis', type: 'text' },
      { key: 'estExotique', label: 'Talent exotique', type: 'boolean' },
      { key: 'compatibilite', label: 'Compatibilité', type: 'tagSelect', hiddenWhen: { key: 'estExotique', value: true }, dynamicOptions: 'armesTypesCompat', outputAsObject: true },
      { key: 'perfectDescription', label: 'Description parfaite', type: 'textarea', hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'armesParfaites', label: 'Armes parfaites', type: 'autocomplete_array', suggestionsKey: 'armesNommees', placeholder: "Rechercher une arme nommée...", hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'notes', label: 'Notes', type: 'textarea' },

      // --- MODE DESCENTE ---
      { key: 'hasDescente', label: 'Disponible en mode Descente', type: 'boolean' },
      { key: 'descente_boucles', label: 'Boucles (Descente)', type: 'array', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_categorie', label: 'Catégorie (Descente)', type: 'radioGroup', options: [
          { value: 'offensif', label: 'Offensif' },
          { value: 'defensif', label: 'Défensif' },
          { value: 'utilitaire', label: 'Utilitaire' },
          { value: 'exotique', label: 'Exotique' },
        ], visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_notes', label: 'Notes (Descente)', type: 'textarea', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_base', label: 'Description avec variables {var} (Descente)', type: 'textarea', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_vars', label: 'Variables par niveau (Descente)', type: 'objectArray', fields: [
          { key: 'niveau', label: 'Niveau (1, 2...)', type: 'text' },
          { key: 'variable', label: 'Variable (ex: degats)', type: 'text' },
          { key: 'valeur', label: 'Valeur (ex: 10%)', type: 'text' }
        ], visibleWhen: { key: 'hasDescente', value: true } },
    ],
  },

  talentsEquipements: {
    comment: "// Talent d'équipement — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsTalentsEquipements', isIdentity: true },
      { key: 'icon', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'prerequis', label: 'Prérequis', type: 'text' },
      { key: 'estExotique', label: 'Talent exotique', type: 'boolean' },
      { key: 'emplacement', label: 'Emplacement', type: 'tagSelect', required: true, singleSelect: true, dynamicOptions: 'talentEquipEmplacements' },
      { key: 'perfectDescription', label: 'Description parfaite', type: 'textarea', hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'equipementsParfaits', label: 'Équipements parfaits', type: 'autocomplete_array', suggestionsKey: 'equipementsNommes', placeholder: "Rechercher un équipement nommé...", hiddenWhen: { key: 'estExotique', value: true } },
      { key: 'gearSet', label: 'Gear Set (slug)', type: 'autocomplete', suggestionsKey: 'nomsEnsembles' },
      { key: 'notes', label: 'Notes', type: 'textarea' },

      // --- MODE DESCENTE ---
      { key: 'hasDescente', label: 'Disponible en mode Descente', type: 'boolean' },
      { key: 'descente_boucles', label: 'Boucles (Descente)', type: 'array', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_categorie', label: 'Catégorie (Descente)', type: 'radioGroup', options: [
          { value: 'offensif', label: 'Offensif' },
          { value: 'defensif', label: 'Défensif' },
          { value: 'utilitaire', label: 'Utilitaire' },
          { value: 'exotique', label: 'Exotique' },
        ], visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_notes', label: 'Notes (Descente)', type: 'textarea', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_base', label: 'Description avec variables {var} (Descente)', type: 'textarea', visibleWhen: { key: 'hasDescente', value: true } },
      { key: 'descente_vars', label: 'Variables par niveau (Descente)', type: 'objectArray', fields: [
          { key: 'niveau', label: 'Niveau (1, 2...)', type: 'text' },
          { key: 'variable', label: 'Variable (ex: degats)', type: 'text' },
          { key: 'valeur', label: 'Valeur (ex: 10%)', type: 'text' }
        ], visibleWhen: { key: 'hasDescente', value: true } },
    ],
  },

  talentsAutres: {
    comment: "// Talent spécifique Descente — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'text', required: true, isIdentity: true },
      { key: 'icon', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },

      // --- MODE DESCENTE (Toujours activé pour cette catégorie) ---
      { key: 'descente_boucles', label: 'Boucles (Descente)', type: 'array', required: true },
      { key: 'descente_categorie', label: 'Catégorie (Descente)', type: 'radioGroup', required: true, options: [
          { value: 'offensif', label: 'Offensif' },
          { value: 'defensif', label: 'Défensif' },
          { value: 'utilitaire', label: 'Utilitaire' },
          { value: 'exotique', label: 'Exotique' },
        ]},
      { key: 'descente_notes', label: 'Notes (Descente)', type: 'textarea' },
      { key: 'descente_base', label: 'Description avec variables {var} (Descente)', type: 'textarea', required: true },
      { key: 'descente_vars', label: 'Variables par niveau (Descente)', type: 'objectArray', fields: [
          { key: 'niveau', label: 'Niveau (1, 2...)', type: 'text' },
          { key: 'variable', label: 'Variable (ex: degats)', type: 'text' },
          { key: 'valeur', label: 'Valeur (ex: 10%)', type: 'text' }
        ]},
    ],
  },

  talentsPrototypes: {
    comment: "// Talent Prototype — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsTalentsPrototypes', isIdentity: true },
      { key: 'icon', label: 'Icône (slug)', type: 'text', placeholder: 'nom_fichier_sans_extension' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'statMin', label: 'Valeur Min', type: 'number', step: 0.1, required: true },
      { key: 'statMax', label: 'Valeur Max', type: 'number', step: 0.1, required: true },
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
      { key: 'icon', label: 'Logo (fichier)', type: 'text', placeholder: 'nom-du-icon.png' },
      { key: 'attributsEssentiels', label: 'Attributs essentiels', type: 'tagSelect', dynamicOptions: 'attributsTypes' },
      { key: 'bonus1piece', label: 'Bonus 1 pièce', type: 'objectGroup', hiddenWhen: { key: 'type', value: 'gear_set' }, fields: [
          { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
              { key: 'slug', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'attributs' },
              { key: 'value', label: 'Valeur', type: 'number' },
            ]},
          { key: 'talent', label: 'Talent', type: 'autocomplete', suggestionsKey: 'talentsEquipements' },
        ]},
      { key: 'bonus2pieces', label: 'Bonus 2 pièces', type: 'objectGroup', fields: [
          { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
              { key: 'slug', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'attributs' },
              { key: 'value', label: 'Valeur', type: 'number' },
            ]},
          { key: 'talent', label: 'Talent', type: 'autocomplete', suggestionsKey: 'talentsEquipements' },
        ]},
      { key: 'bonus3pieces', label: 'Bonus 3 pièces', type: 'objectGroup', fields: [
          { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
              { key: 'slug', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'attributs' },
              { key: 'value', label: 'Valeur', type: 'number' },
            ]},
          { key: 'talent', label: 'Talent', type: 'autocomplete', suggestionsKey: 'talentsEquipements' },
        ]},
      { key: 'bonus4pieces', label: 'Bonus 4 pièces (gear set)', type: 'objectGroup', hiddenWhen: { key: 'type', value: 'marque' }, fields: [
          { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
              { key: 'slug', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'attributs' },
              { key: 'value', label: 'Valeur', type: 'number' },
            ]},
          { key: 'talent', label: 'Talent', type: 'autocomplete', suggestionsKey: 'talentsEquipements' },
        ]},
      { key: 'talentTorse', label: 'Talent Torse (gear set)', type: 'autocomplete', suggestionsKey: 'talentsEquipements', hiddenWhen: { key: 'type', value: 'marque' } },
      { key: 'talentSac', label: 'Talent Sac (gear set)', type: 'autocomplete', suggestionsKey: 'talentsEquipements', hiddenWhen: { key: 'type', value: 'marque' } },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  competences: {
    comment: '// Compétence — The Division 2',
    fields: [
      { key: 'competence', label: 'Compétence', type: 'autocomplete', suggestionsKey: 'competences', required: true, placeholder: 'TOURELLE, DRONE...', isIdentity: true },
      { key: 'variante', label: 'Variante', type: 'autocomplete', required: true, suggestionsKey: 'variantes', isIdentity: true },
      { key: 'prerequis', label: 'Spécialisation requise', type: 'tagSelect', singleSelect: true, dynamicOptions: 'specialisations' },
      { key: 'icon', label: 'Icône (slug)', type: 'text' },
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
      { key: 'categorie', label: 'Catégorie', type: 'tagSelect', required: true, singleSelect: true, dynamicOptions: 'attributsTypes' },
      { key: 'cible', label: 'Cible', type: 'tagSelect', options: [
          { value: 'arme', label: 'Arme', color: 'red' },
          { value: 'equipement', label: 'Équipement', color: 'blue' },
        ]},
      { key: 'unite', label: 'Unité', type: 'text', placeholder: '%, pts, pts/s...' },
      { key: 'min', label: 'Minimum', type: 'number', step: 0.1, min: 0 },
      { key: 'max', label: 'Maximum', type: 'number', step: 0.1, min: 0 },
      { key: 'prototypeMax', label: 'Maximum (Prototype)', type: 'number', step: 0.1, min: 0, visibleWhen: [{ key: 'categorie', notEmpty: true }, { key: 'max', notEmpty: true }] },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'estEssentiel', label: 'Attribut essentiel', type: 'boolean' },
      { key: 'selectionable', label: 'Sélectionable', type: 'boolean' },
      { key: 'statistiques', label: 'Statistiques affectées', type: 'autocomplete_array', suggestionsKey: 'statistiques', placeholder: 'Rechercher une statistique...' },
    ],
  },

  statistiques: {
    comment: '// Statistique — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsStatistiques', isIdentity: true },
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
          { value: 'bouche', label: 'Bouche', color: 'yellow' },
          { value: 'autre', label: 'Autre', color: 'green' },
        ]},
      { key: 'compatible', label: 'Compatible avec', type: 'tagSelect', dynamicOptions: 'armesTypesCompat' },
      { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
          { key: 'attribut', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'allAttributsSlugs' },
          { key: 'valeur', label: 'Valeur', type: 'number', step: 0.1 },
        ]},
      { key: 'estExotique', label: 'Mod exotique', type: 'boolean' },
      { key: 'bonus', label: 'Bonus texte (optionnel)', type: 'text', placeholder: 'Effet non lié à un attribut...' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'prerequis', label: 'Prérequis (spécialisation)', type: 'text' },
    ],
  },

  modsEquipements: {
    comment: "// Mod d'équipement — The Division 2",
    fields: [
      { key: 'nom', label: 'Nom', type: 'autocomplete', required: true, suggestionsKey: 'nomsModsEquipements', isIdentity: true },
      { key: 'categorie', label: 'Catégorie', type: 'tagSelect', singleSelect: true, dynamicOptions: 'attributsTypes' },
      { key: 'protocole', label: 'Protocole', type: 'text' },
      { key: 'attributs', label: 'Attributs', type: 'objectArray', fields: [
          { key: 'attribut', label: 'Attribut', type: 'autocomplete', suggestionsKey: 'allAttributsSlugs' },
          { key: 'valeur', label: 'Valeur', type: 'number', step: 0.1 },
        ]},
    ],
  },

  modsCompetences: {
    comment: '// Mod de compétence — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'competence', label: 'Compétence', type: 'autocomplete', suggestionsKey: 'competenceSlugs', required: true, isIdentity: true },
      { key: 'emplacement', label: 'Emplacement', type: 'autocomplete', suggestionsKey: 'emplacementsModsCompetences', required: true },
      { key: 'compatible', label: 'Compatible avec', type: 'autocomplete_array', suggestionsKey: 'competenceSlugs', placeholder: 'Slug compétence...' },
      { key: 'prerequis', label: 'Spécialisation requise', type: 'tagSelect', singleSelect: true, dynamicOptions: 'specialisations' },
      { key: 'attributs', label: 'Attributs modifiés', type: 'objectArray', fields: [
          { key: 'attribut', label: 'Statistique', type: 'autocomplete', suggestionsKey: 'statistiques' },
          { key: 'valeur', label: 'Valeur', type: 'number', step: 1 },
        ]},
      { key: 'bonus', label: 'Bonus texte (optionnel)', type: 'text', placeholder: 'Effet non lié à une statistique...' },
    ],
  },

  builds: {
    comment: '// Build Prédéfini — The Division 2',
    fields: [
      { key: 'nom', label: 'Nom', type: 'text', required: true, isIdentity: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'encoded', label: 'Code Partage (Base64)', type: 'text', required: true },
      { key: 'tags', label: 'Tags', type: 'tagSelect', dynamicOptions: 'buildTags' },
    ],
  },

  buildsTags: {
    comment: '// Tags de Build — The Division 2',
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true, isIdentity: true },
      { key: 'label', label: 'Libellé', type: 'text', required: true },
      { key: 'color', label: 'Couleur Tailwind', type: 'text', placeholder: 'red, blue, green...' },
    ],
  },
}

/** Construit les listes de suggestions. */
export function buildSuggestions(loadedData, generatorData, savedItems) {
  const s = {}
  const merged = {}
  for (const cat of GENERATOR_CATEGORIES) {
    const dk = DATA_KEY[cat.key]
    const loaded = loadedData?.[dk] || {}
    const loadedArray = Array.isArray(loaded) ? loaded : Object.values(loaded)
    const saved = savedItems?.[cat.key] || []
    merged[dk] = [...loadedArray, ...saved]
  }

  const extractUniqueWithSlugs = (items) => {
    if (!items) return []
    const validItems = items.filter(i => i.nom)
    const counts = validItems.reduce((acc, item) => {
      acc[item.nom] = (acc[item.nom] || 0) + 1
      return acc
    }, {})

    const mapped = validItems.map(item => {
      if (counts[item.nom] > 1 && item.slug) {
        return `${item.nom} (${item.slug})`
      }
      return item.nom
    })
    return [...new Set(mapped)].sort()
  }

  s.nomsArmes = extractUniqueWithSlugs(merged.armes)
  s.nomsEquipements = extractUniqueWithSlugs(merged.equipements)

  const selectedMarque = generatorData?.equipements?.marque
  if (selectedMarque) {
    const marqueEquips = new Set(
        (merged.equipements || []).filter(e => e.marque?.toLowerCase() === selectedMarque.toLowerCase()).map(e => e.nom)
    )
    s.nomsEquipements = s.nomsEquipements.sort((a, b) => {
      const cleanA = a.replace(/\s\([^)]+\)$/, '')
      const cleanB = b.replace(/\s\([^)]+\)$/, '')
      const aMatch = marqueEquips.has(cleanA) ? 0 : 1
      const bMatch = marqueEquips.has(cleanB) ? 0 : 1
      return aMatch - bMatch || a.localeCompare(b)
    })
  }

  s.nomsTalentsArmes = extractUniqueWithSlugs(merged.talentsArmes)
  s.nomsTalentsEquipements = extractUniqueWithSlugs(merged.talentsEquipements)
  s.nomsTalentsPrototypes = extractUniqueWithSlugs(merged.talentsPrototypes)
  s.nomsEnsembles = extractUniqueWithSlugs(merged.ensembles)
  s.nomsAttributs = extractUniqueWithSlugs(merged.attributs)
  s.nomsModsArmes = extractUniqueWithSlugs(merged.modsArmes)
  s.nomsModsEquipements = extractUniqueWithSlugs(merged.modsEquipements)
  s.nomsStatistiques = extractUniqueWithSlugs(merged.statistiques)
  s.nomsBuilds = extractUniqueWithSlugs(merged.builds)
  s.nomsBuildsTags = extractUniqueWithSlugs(merged.buildsTags)

  s.statistiques = (merged.statistiques || []).filter(st => st.slug && st.nom).map(st => ({ value: st.slug, label: st.nom }))
  s.statistiques.sort((a, b) => a.label.localeCompare(b.label))

  s.buildTags = (merged.buildsTags || []).filter(t => t.id && t.label).map(t => ({ value: t.id, label: t.label }))
  s.buildTags.sort((a, b) => a.label.localeCompare(b.label))

  s.allAttributsSlugs = (merged.attributs || []).filter(a => a.slug && a.nom).map(a => ({ value: a.slug, label: a.nom }))
  s.allAttributsSlugs.sort((a, b) => a.label.localeCompare(b.label))

  const flatComps = merged.competences || []
  const selectedComp = generatorData?.competences?.competence
  if (selectedComp) {
    const compLower = selectedComp.toLowerCase()
    s.variantes = [...new Set(flatComps.filter(c => c.competence.toLowerCase() === compLower).map(c => c.variante).filter(Boolean))].sort()
  } else {
    s.variantes = [...new Set(flatComps.map(c => c.variante).filter(Boolean))].sort()
  }

  const rawSpe = loadedData?.classSpe || {}
  const speList = Array.isArray(rawSpe) ? rawSpe : Object.values(rawSpe)
  s.specialisations = speList.map(sp => ({ value: sp.cle, label: sp.nom })).sort((a, b) => a.label.localeCompare(b.label))

  const rawGrouped = loadedData?.competencesGrouped || {}
  const groupedComps = Array.isArray(rawGrouped) ? rawGrouped : Object.values(rawGrouped)
  const emplacementSet = new Set()
  groupedComps.forEach(c => {
    (c.emplacementsMods || []).forEach(em => emplacementSet.add(em.emplacement))
  })
  flatComps.forEach(c => {
    (c.emplacementsMods || []).forEach(em => emplacementSet.add(em.emplacement))
  })
  s.emplacementsModsCompetences = Array.from(emplacementSet).sort()

  const compSlugSet = new Set()
  groupedComps.forEach(c => { if (c.slug) compSlugSet.add(c.slug) })
  flatComps.forEach(c => { if (c.competenceSlug) compSlugSet.add(c.competenceSlug) })
  s.competenceSlugs = Array.from(compSlugSet).sort().map(slug => ({ value: slug, label: slug }))

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

  s.talentsPrototypes = (merged.talentsPrototypes || []).filter(t => t.slug && t.nom).map(t => ({ value: t.slug, label: t.nom }))
  s.talentsPrototypes.sort((a, b) => a.label.localeCompare(b.label))
  if (generatorData?.talentsPrototypes?.nom) {
    const slug = generatorData.talentsPrototypes.slug || slugify(generatorData.talentsPrototypes.nom)
    if (!s.talentsPrototypes.find(t => t.value === slug)) {
      s.talentsPrototypes.push({ value: slug, label: generatorData.talentsPrototypes.nom })
    }
  }

  s.attributs = (merged.attributs || []).filter(a => a.slug && a.nom).map(a => ({ value: a.slug, label: a.nom }))
  s.attributs.sort((a, b) => a.label.localeCompare(b.label))

  s.modsArmes = (merged.modsArmes || []).filter(m => m.slug && m.nom).map(m => ({ value: m.slug, label: m.nom }))
  s.modsArmes.sort((a, b) => a.label.localeCompare(b.label))

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
  addLookup(merged.talentsPrototypes)
  addLookup(merged.attributs)
  addLookup(merged.modsArmes)
  addLookup(merged.ensembles)
  addLookup(merged.modsEquipements)
  addLookup(merged.modsCompetences)
  addLookup(merged.statistiques)

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
  groupedComps.forEach(c => { if (c.competence) compSet.add(c.competence) })
  s.competences = Array.from(compSet).sort()

  const armesType = loadedData?.armes_type || {}
  const eqType = loadedData?.equipements_type || {}
  const attrType = loadedData?.attributs_type || {}

  const colorCycle = ['red', 'yellow', 'blue', 'green']
  s.armesTypes = Object.entries(armesType)
      .filter(([k]) => k !== 'arme_specifique')
      .map(([value, obj], i) => ({ value, label: obj.nom, color: colorCycle[i % colorCycle.length] }))
  s.armesTypesCompat = Object.entries(armesType)
      .filter(([k]) => k !== 'arme_specifique')
      .map(([value, obj], i) => ({ value, label: obj.nom, color: colorCycle[i % colorCycle.length] }))
  s.equipementsTypes = Object.entries(eqType)
      .map(([value, obj], i) => ({ value, label: obj.nom, color: colorCycle[i % colorCycle.length] }))
  const attrColors = { offensif: 'red', defensif: 'blue', utilitaire: 'yellow' }
  s.attributsTypes = Object.entries(attrType)
      .map(([value, obj]) => ({ value, label: obj.nom, color: attrColors[value] || 'yellow' }))
  s.talentEquipEmplacements = [
    ...Object.entries(eqType)
        .filter(([k]) => k === 'torse' || k === 'sac_a_dos')
        .map(([value, obj], i) => ({ value, label: obj.nom, color: colorCycle[i % colorCycle.length] })),
    { value: 'tous', label: 'Tous', color: 'yellow' },
  ]

  return s
}

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
      case 'objectGroup':
        defaults[field.key] = {}
        if (field.fields) {
          for (const sf of field.fields) {
            switch (sf.type) {
              case 'boolean':
                defaults[field.key][sf.key] = false; break
              case 'triState': defaults[field.key][sf.key] = null; break
              case 'number': defaults[field.key][sf.key] = ''; break
              default: defaults[field.key][sf.key] = ''; break
            }
          }
        }
        break
      case 'radioGroup': defaults[field.key] = ''; break
      default: defaults[field.key] = ''; break
    }
  }
  return defaults
}

export function cleanOutput(data, categoryKey) {
  const config = FIELDS[categoryKey]
  if (!config) return data
  const result = {}

  // On préserve explicitement le slug généré ou chargé
  if (data.slug) {
    result.slug = data.slug
  }

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

    if (field.type === 'tagSelect') {
      if (field.outputAsObject) {
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
        if (Array.isArray(val)) result[field.key] = val
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
    if (field.type === 'objectGroup') {
      if (val && typeof val === 'object') {
        const cleaned = {}
        for (const sf of (field.fields || [])) {
          const sv = val[sf.key]
          if (sf.type === 'number' && sv !== '' && sv !== undefined) {
            cleaned[sf.key] = Number(sv)
          } else if (sf.type === 'boolean') {
            if (sv === true) cleaned[sf.key] = true
          } else if (sf.type === 'triState') {
            if (typeof sv === 'string' && sv.trim().length > 0) {
              cleaned[sf.key] = sv.trim()
            } else if (sv === true) {
              cleaned[sf.key] = true
            } else if (sv === false) {
              cleaned[sf.key] = false
            }
          } else if (sf.type === 'textarea') {
            if (sv && String(sv).trim()) cleaned[sf.key] = String(sv).trim()
          } else {
            if (sv) cleaned[sf.key] = sv
          }
        }
        for (const sf of (field.fields || [])) {
          if (sf.type === 'text' && !cleaned[sf.key]) delete cleaned[sf.key]
        }
        if (Object.keys(cleaned).length > 0) {
          result[field.key] = cleaned
        }
      }
      continue
    }
    if (field.type === 'number' && val !== '') {
      result[field.key] = Number(val)
      continue
    }
    result[field.key] = val
  }

  // Création du slug uniquement si l'élément n'en a pas encore (nouvel élément)
  if (!result.slug) {
    const idVal = getIdentityValue(categoryKey, result)
    const fallback = typeof idVal === 'string' ? idVal : (idVal ? Object.values(idVal).join('_') : 'nouvel_element')
    result.slug = slugify(result.nom || fallback)
  }

  // --- TRAITEMENT SPÉCIFIQUE POUR LE MODE DESCENTE ---
  if (data.hasDescente || categoryKey === 'talentsAutres') {
    result.descente = {
      boucles: data.descente_boucles || [],
      categorie: data.descente_categorie || 'offensif',
      notes: data.descente_notes || '',
      levels: {
        base: data.descente_base || ''
      }
    }

    // Reconstruction de la hiérarchie imbriquée des niveaux
    if (Array.isArray(data.descente_vars)) {
      data.descente_vars.forEach(v => {
        if (v.niveau && v.variable) {
          if (!result.descente.levels[v.niveau]) {
            result.descente.levels[v.niveau] = {}
          }
          result.descente.levels[v.niveau][v.variable] = v.valeur
        }
      })
    }
  }

  // Nettoyage des champs virtuels liés au formulaire
  // On s'assure qu'ils n'apparaissent pas dans le JSONC final, qu'ils soient vides ou remplis
  delete result.hasDescente
  delete result.descente_boucles
  delete result.descente_categorie
  delete result.descente_notes
  delete result.descente_base
  delete result.descente_vars

  return result
}

export function generateEquipmentSet(ensembleData, equipementsType) {
  const nom = ensembleData.nom || 'Nouvel Ensemble'
  const ensembleSlug = ensembleData.slug || slugify(nom)
  const type = ensembleData.type || 'marque'
  const attrs = ensembleData.attributsEssentiels || []
  const attrEss = attrs.map(a => {
    const n = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return n === 'offensif' ? 'offensif' : n === 'defensif' ? 'defensif' : 'utilitaire'
  })

  const SLOTS = equipementsType ? Object.keys(equipementsType) : ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres']
  const SLOTS_WITH_MOD = ['torse', 'sac_a_dos']

  return SLOTS.map(slot => {
    const slotLabel = equipementsType?.[slot]?.nom || slot
    return {
      nom: `${slotLabel} ${nom}`,
      slug: slugify(`${slotLabel} ${nom}`),
      marque: ensembleSlug,
      emplacement: slot,
      attributEssentiel: attrEss.length > 0 ? [...attrEss] : ['offensif'],
      mod: SLOTS_WITH_MOD.includes(slot),
      type: type === 'gear_set' ? 'gear_set' : 'standard',
    }
  })
}

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

export function getIdentityLabel(categoryKey, identityValues, formData) {
  if (!identityValues) return ''
  if (formData?.nom) return formData.nom
  if (typeof identityValues === 'string') return identityValues
  return Object.values(identityValues).join(' — ')
}

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

export function itemToFormData(categoryKey, item) {
  const config = FIELDS[categoryKey]
  if (!config || !item) return null
  const data = getDefaults(categoryKey)

  // Conserve le slug immuable
  if (item.slug) data.slug = item.slug

  for (const field of config.fields) {
    if (field.type === 'radioGroup' && field.target) {
      for (const [optKey, targetField] of Object.entries(field.target)) {
        if (item[targetField] === true) data[field.key] = optKey
      }
      continue
    }
    if (field.type === 'tagSelect' && field.outputAsObject && item[field.key]) {
      data[field.key] = Object.entries(item[field.key]).filter(([, v]) => v).map(([k]) => k)
      continue
    }
    if (field.type === 'objectGroup' && typeof item[field.key] === 'object' && !Array.isArray(item[field.key])) {
      const src = item[field.key]
      const merged = { ...data[field.key] }
      for (const sf of (field.fields || [])) {
        if (sf.key in src && src[sf.key] !== undefined) {
          if (src[sf.key] === null) continue
          merged[sf.key] = sf.type === 'number' ? String(src[sf.key]) : src[sf.key]
        }
      }
      data[field.key] = merged
    } else if (item[field.key] !== undefined && item[field.key] !== null) {
      data[field.key] = field.type === 'number' ? String(item[field.key]) : item[field.key]
    }
  }

  // --- MAPPING INVERSE POUR LE MODE DESCENTE ---
  if (item.descente) {
    data.hasDescente = true
    data.descente_boucles = item.descente.boucles || []
    data.descente_categorie = item.descente.categorie || 'offensif'
    data.descente_notes = item.descente.notes || ''
    data.descente_base = item.descente.levels?.base || ''
    data.descente_vars = []

    // Déconstruction de la hiérarchie imbriquée vers un tableau plat pour le formulaire
    if (item.descente.levels) {
      for (const [niv, vars] of Object.entries(item.descente.levels)) {
        if (niv === 'base') continue
        for (const [varName, varVal] of Object.entries(vars)) {
          data.descente_vars.push({ niveau: niv, variable: varName, valeur: varVal })
        }
      }
    }
  }

  return data
}