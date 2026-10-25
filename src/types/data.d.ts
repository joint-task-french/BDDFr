// FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
// Source : src/data/schemas/**/*.schema.json
// Régénérer : npm run generate-types

// --- src/data/schemas/armes/armes.schema.json ---
/**
 * Toutes les armes (classiques + exotiques) avec statistiques et talents. Clé = slug de l'arme.
 */
export interface ArmesTheDivision2 {
  /**
   * This interface was referenced by `ArmesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom de l'arme
     */
    nom: string;
    /**
     * texte de lore lié a l'arme
     */
    description?: string;
    /**
     * Slug du fichier icône du talent exotique/nommé dans game_assets/talents/arme/ (sans extension)
     */
    icon?: string;
    /**
     * Type/catégorie de l'arme
     */
    type:
      | 'fusil_assaut'
      | 'fusil'
      | 'fusil_precision'
      | 'pistolet_mitrailleur'
      | 'fusil_mitrailleur'
      | 'calibre_12'
      | 'pistolet';
    /**
     * Fabricant de l'arme
     */
    fabricant?: string;
    /**
     * Portée optimale en mètres
     */
    portee?: number;
    /**
     * Portée optimale en mètres si prototype
     */
    prototypePortee?: number;
    /**
     * Coups par minute
     */
    rpm?: number;
    /**
     * Coups par minute si prototype
     */
    prototypeRpm?: number;
    /**
     * Taille du chargeur
     */
    chargeur?: number;
    /**
     * Taille du chargeur si prototype
     */
    prototypeChargeur?: number;
    /**
     * Temps de rechargement en secondes
     */
    rechargement?: number;
    /**
     * Temps de rechargement en secondes si prototype
     */
    prototypeRechargement?: number;
    /**
     * Multiplicateur de headshot en pourcentage (ex: 60 pour 60%)
     */
    headshot?: number;
    /**
     * Multiplicateur de headshot en pourcentage si prototype
     */
    prototypeHeadshot?: number;
    /**
     * Attributs fixés par défaut sur cette arme, avec leur valeur spécifique. Le nom référence un attribut dans attributs.jsonc.
     */
    attributs?: AttributApplique[];
    /**
     * Écrase les attributs essentiels fixés par défaut sur cette arme, avec leur valeur spécifique. Le nom référence un attribut dans attributs.jsonc.
     */
    attributs_essentiels?: AttributApplique[];
    /**
     * Dégâts de base
     */
    degatsBase?: number;
    /**
     * Dégâts de base si prototype
     */
    prototypeDegatsBase?: number;
    /**
     * True si arme exotique
     */
    estExotique?: boolean;
    /**
     * True si arme nommée (talent dédié fixe)
     */
    estNomme?: boolean;
    /**
     * True si l'arme s'équipe dans l'emplacement Arme de poing (sidearm) même si son type est différent
     */
    armePoing?: boolean;
    /**
     * Liste de slugs de talents (référencent les noms dans talents-armes.jsonc). Pour les exotiques, les talents dédiés sont directement dans cette liste.
     */
    talents?: string[];
    /**
     * Liste de slugs de talents prototypes (référencent les noms dans talents-prototypes.jsonc).
     */
    talentsPrototypes?: string[];
    obtention?: Obtention;
    /**
     * Détail des emplacements spécifiques disponibles sur l'arme
     */
    emplacementsMods?: {
      /**
       * Ex: chargeur_556 ou [chargeur_556, chargeur_762]
       */
      chargeur?: (string | string[]) &
        (
          | 'chargeur_556'
          | 'chargeur_762'
          | 'chargeur_762_precision'
          | 'chargeur_integre'
          | 'chargeur_pistolet'
          | 'barillet'
          | 'bande_munitions'
          | 'chargeur_45_acp'
          | 'chargeur_9mm'
          | 'magasin_tubulaire'
        );
      /**
       * Ex: rail_sous_canon_long ou [rail_sous_canon_long, rail_sous_canon_court]
       */
      canon?: (string | string[]) & ('rail_sous_canon_long' | 'rail_sous_canon_court' | 'gadget' | 'lateral');
      /**
       * Ex: rail_optique_court ou [rail_optique_court, rail_optique_long]
       */
      viseur?: (string | string[]) &
        ('rail_optique_court' | 'rail_optique_long' | 'micro_rail_optique' | 'rail_optique');
      /**
       * Ex: bouche_556 ou [bouche_556, bouche_762]
       */
      bouche?: (string | string[]) &
        ('bouche_45_acp' | 'bouche_45' | 'bouche_9mm' | 'bouche_556' | 'bouche_762' | 'bouche');
    };
    /**
     * Mods pré-équipés (armes exotiques) — non modifiables. Chaque entrée est le slug du mod.
     */
    modsPredefinis?: string[];
    /**
     * Notes libres sur l'arme
     */
    notes?: string;
  };
}
export interface AttributApplique {
  /**
   * Nom de l'attribut (doit correspondre à un nom dans attributs.jsonc)
   */
  nom: string;
  /**
   * Valeur de l'attribut sur cet objet
   */
  valeur?: number;
  /**
   * Valeur de l'attribut sur cet objet si prototype
   */
  prototypeValue?: number;
}
export interface Obtention {
  /**
   * Description de comment obtenir l'objet (peut être vide)
   */
  description?: string;
  /**
   * Disponible via butin ciblé — true/false ou string décrivant les conditions
   */
  butinCible?: boolean | string;
  /**
   * Disponible via caches exotiques
   */
  cachesExotiques?: boolean;
  /**
   * Disponible via une mission — true/false ou string décrivant les conditions
   */
  mission?: boolean | string;
  /**
   * Disponible dans la Darkzone
   */
  darkZone?: boolean | string;
  /**
   * Disponible via un raid — true/false ou string décrivant les conditions
   */
  raid?: boolean | string;
  /**
   * Disponible au craft — true/false ou string décrivant les conditions
   */
  craft?: boolean | string;
  /**
   * Schemas disponible dans les caches reconstitué — true/false ou string décrivant les conditions
   */
  reconstitue?: boolean | string;
  /**
   * Disponible via une incursion — true/false ou string décrivant les conditions
   */
  incursion?: boolean | string;
  /**
   * Nom de la faction pour schémas représailles (optionnel)
   */
  represailles?: string;
}

// --- src/data/schemas/armes/mods-armes.schema.json ---
/**
 * Clé = slug du mod.
 */
export interface ModsDArmesTheDivision2 {
  /**
   * This interface was referenced by `ModsDArmesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom de la modification
     */
    nom: string;
    /**
     * Type de modification
     */
    type: 'chargeur' | 'canon' | 'viseur' | 'bouche';
    /**
     * Attributs modifiés par ce mod (slug + valeur, négatif = malus)
     */
    attributs?: {
      attribut: string;
      valeur: number;
    }[];
    /**
     * Effet textuel non lié à un attribut (optionnel)
     */
    bonus?: string;
    /**
     * Description de lore du mod (optionnel)
     */
    description?: string;
    /**
     * Emplacements spécifiques compatibles (ex: ['rail_optique_court', 'micro_rail_optique']). Tableau vide = universel pour ce type global.
     */
    compatible: (
      | 'chargeur_556'
      | 'chargeur_762'
      | 'chargeur_762_precision'
      | 'chargeur_integre'
      | 'chargeur_pistolet'
      | 'barillet'
      | 'bande_munitions'
      | 'chargeur_45_acp'
      | 'chargeur_9mm'
      | 'magasin_tubulaire'
      | 'rail_sous_canon_long'
      | 'rail_sous_canon_court'
      | 'gadget'
      | 'lateral'
      | 'rail_optique_court'
      | 'rail_optique_long'
      | 'micro_rail_optique'
      | 'rail_optique'
      | 'bouche_45_acp'
      | 'bouche_45'
      | 'bouche_9mm'
      | 'bouche_556'
      | 'bouche_762'
      | 'bouche'
    )[];
    /**
     * True si mod exotique lié à une arme exotique
     */
    estExotique?: boolean;
    /**
     * Slug de spécialisation requise (optionnel)
     */
    prerequis?: string;
    /**
     * Notes libres sur le mod
     */
    notes?: string;
  };
}

// --- src/data/schemas/armes/talents-armes.schema.json ---
/**
 * Clé = slug du talent.
 */
export interface TalentsDArmes {
  /**
   * This interface was referenced by `TalentsDArmes`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    [k: string]: any;
  } & {
    nom: string;
    /**
     * Slug du fichier icône dans game_assets/talents/arme/ (sans extension)
     */
    icon?: string;
    description?: string;
    prerequis?: string;
    /**
     * True si talent exotique (dédié à une arme exotique).
     */
    estExotique?: boolean;
    /**
     * Description de la version parfaite du talent
     */
    perfectDescription?: string;
    /**
     * Noms des armes nommées qui portent la version parfaite de ce talent
     */
    armesParfaites?: string[];
    /**
     * Types d'armes compatibles (true) ou non (false). Si absent, compatible avec tout.
     */
    compatibilite?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^[a-z0-9_]+$".
       */
      [k: string]: boolean;
    };
    /**
     * Notes libres sur le talent
     */
    notes?: string;
    descente?: Descente;
  };
}
export interface Descente {
  boucles: string[];
  categorie: 'offensif' | 'defensif' | 'utilitaire' | 'exotique';
  /**
   * Notes spécifiques au mode Descente
   */
  notes?: string;
  levels: {
    /**
     * Description du talent avec variables : {var_name}, {other_var_name}...
     */
    base: string;
    /**
     * Valeurs des variables pour un niveau donné (ex: '1', '2', etc.)
     */
    [k: string]:
      | {
          [k: string]: string | number;
        }
      | string;
  };
}

// --- src/data/schemas/armes/talents-prototypes.schema.json ---
/**
 * Clé = slug du talent.
 */
export interface TalentsPrototypes {
  /**
   * This interface was referenced by `TalentsPrototypes`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    nom: string;
    description: string;
    statMin: number;
    statMax: number;
    pas: number;
    /**
     * Slug du fichier icône dans game_assets/talents/prototypes/ (sans extension)
     */
    icon?: string;
  };
}

// --- src/data/schemas/autres/attributs.schema.json ---
/**
 * Référentiel de tous les attributs. Clé = slug de l'attribut.
 */
export interface AttributsTheDivision2 {
  /**
   * This interface was referenced by `AttributsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom de l'attribut tel qu'affiché en jeu
     */
    nom: string;
    /**
     * Catégorie de l'attribut
     */
    categorie: 'offensif' | 'defensif' | 'utilitaire';
    /**
     * Sur quel type d'objet cet attribut peut apparaître
     *
     * @minItems 1
     */
    cible: [
      'arme' | 'equipement' | 'mod_arme' | 'mod_equipement' | 'competence' | 'mod_competence',
      ...('arme' | 'equipement' | 'mod_arme' | 'mod_equipement' | 'competence' | 'mod_competence')[]
    ];
    /**
     * Unité d'affichage (%, pts, etc.)
     */
    unite?: string;
    /**
     * Valeur minimum classique de l'attribut
     */
    min?: number;
    /**
     * Valeur maximum classique de l'attribut
     */
    max?: number;
    /**
     * Valeur maximum de l'attribut sur les prototypes
     */
    prototypeMax?: number;
    /**
     * Description courte de ce que fait l'attribut
     */
    description?: string;
    /**
     * True si cet attribut est un attribut essentiel (core attribute). Les attributs essentiels et classiques forment deux pools séparés.
     */
    estEssentiel?: boolean;
    /**
     * Slugs des statistiques de jeu que cet attribut modifie (référence statistiques.jsonc)
     */
    statistiques?: string[];
    /**
     * Si cet attribut peut être sélectionné manuellement dans le build planner
     */
    selectionable?: boolean;
  };
}

// --- src/data/schemas/autres/builds.schema.json ---
export type BuildsDeReference = {
  /**
   * Nom du build
   */
  nom: string;
  /**
   * Description détaillée du build
   */
  description: string;
  /**
   * Liste d'identifiants de tags associés
   */
  tags?: string[];
  /**
   * Chaîne de caractères encodée contenant la configuration du build
   */
  encoded: string;
  /**
   * Nombre de likes du build
   */
  likes?: number;
  /**
   * Date de création du build (timestamp Unix en ms)
   */
  timestamp?: number;
}[];

// --- src/data/schemas/autres/class-spe.schema.json ---
/**
 * Les 6 spécialisations du jeu. Clé = slug de la spécialisation.
 */
export interface ClassesDeSpecialisationTheDivision2 {
  /**
   * This interface was referenced by `ClassesDeSpecialisationTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    cle: string;
    nom: string;
    icon?: string;
    arme: {
      /**
       * Nom de l'arme
       */
      nom: string;
      /**
       * Texte de lore lié à l'arme
       */
      description?: string;
      /**
       * Slug du fichier icône dans game_assets/armes/specialisations/ (sans extension)
       */
      icon?: string;
      /**
       * Type/catégorie de l'arme (toujours arme_specifique pour les spécialisations)
       */
      type: 'arme_specifique';
      /**
       * Fabricant de l'arme
       */
      fabricant?: string;
      /**
       * Portée optimale en mètres
       */
      portee?: number;
      /**
       * Coups par minute
       */
      rpm?: number;
      /**
       * Taille du chargeur
       */
      chargeur?: number;
      /**
       * Temps de rechargement en secondes
       */
      rechargement?: number;
      /**
       * Multiplicateur de headshot en pourcentage (ex: 60 pour 60%)
       */
      headshot?: number;
      /**
       * Attributs fixés par défaut sur cette arme, avec leur valeur spécifique. Le nom référence un attribut dans attributs.jsonc.
       */
      attributs?: {
        /**
         * Nom de l'attribut (doit correspondre à un nom dans attributs.jsonc)
         */
        nom: string;
        /**
         * Valeur de l'attribut sur cette arme
         */
        valeur?: number;
      }[];
      /**
       * Écrase les attributs essentiels fixés par défaut sur cette arme, avec leur valeur spécifique. Le nom référence un attribut dans attributs.jsonc.
       */
      attributs_essentiels?: {
        /**
         * Nom de l'attribut (doit correspondre à un nom dans attributs.jsonc)
         */
        nom: string;
        /**
         * Valeur de l'attribut sur cette arme
         */
        valeur?: number;
      }[];
      /**
       * Dégâts de base
       */
      degatsBase?: number;
      /**
       * True si arme exotique
       */
      estExotique?: boolean;
      /**
       * True si arme nommée
       */
      estNomme?: boolean;
      /**
       * Liste de slugs de talents
       */
      talents?: string[];
      /**
       * Comment obtenir l'arme
       */
      obtention?: {
        /**
         * Description de comment obtenir l'objet
         */
        description?: string;
      };
      /**
       * Détail des emplacements spécifiques disponibles sur l'arme
       */
      emplacementsMods?: {};
      /**
       * Notes libres sur l'arme
       */
      notes?: string;
    };
    classStats: {
      bonusArme: {
        maxPoints: number;
        maxElement: number;
        valeurParPoint: number;
      };
      bonusAttributs: {
        nom: string;
        valeur: number;
      }[];
    };
  };
}

// --- src/data/schemas/autres/competences.schema.json ---
/**
 * Structure groupée par type de compétence. Clé = slug de la compétence.
 */
export interface CompetencesTheDivision2 {
  /**
   * This interface was referenced by `CompetencesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom du type de compétence (ex: TOURELLE, DRONE)
     */
    competence: string;
    icon?: string;
    emplacementsMods?: {
      emplacement: string;
      prerequis?: string;
    }[];
    variantes: {
      variante: string;
      prerequis?: string;
      icon?: string;
      expertise?: string;
      statistiques?: string;
      effetEtat?: string;
      tier1: string;
      tier2: string;
      tier3: string;
      tier4: string;
      tier5: string;
      tier6: string;
      surcharge: string;
      slug: string;
      /**
       * Notes libres sur la variante de compétence
       */
      notes?: string;
    }[];
    /**
     * Notes libres sur le type de compétence
     */
    notes?: string;
  };
}

// --- src/data/schemas/autres/metadata.schema.json ---
export interface MetadonneesTheDivision2 {
  titre: string;
  /**
   * Version du jeu / mise à jour
   */
  version: string;
  /**
   * Liste des contributeurs
   */
  credits?: string[];
  /**
   * Niveau maximum d'expertise applicable sur le jeu
   */
  maxExpertiseLevel?: number;
  /**
   * Historique des modifications de la base de données
   */
  changelog?: {
    date:
      | string
      | {
          /**
           * Date de début (YYYY-MM-DD)
           */
          from: string;
          /**
           * Date de fin (YYYY-MM-DD)
           */
          to: string;
        };
    /**
     * Nom du patch associé (ex: TU22)
     */
    patch?: string;
    /**
     * Liste des changements effectués (chaque élément peut être une chaîne Markdown ou un objet pliable)
     */
    changements?: (
      | string
      | {
          /**
           * Titre affiché quand l'élément est replié
           */
          titre: string;
          description: string | string[];
        }
    )[];
  }[];
}

// --- src/data/schemas/autres/mods-competences.schema.json ---
/**
 * Clé = slug du mod.
 */
export interface ModsDeCompetencesTheDivision2 {
  /**
   * This interface was referenced by `ModsDeCompetencesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom affiché du mod
     */
    nom: string;
    /**
     * Slug de la compétence associée
     */
    competence: string;
    /**
     * Emplacement du mod sur la compétence
     */
    emplacement: string;
    /**
     * Clé de spécialisation requise pour utiliser ce mod (optionnel)
     */
    prerequis?: string;
    /**
     * Attributs de la compétence modifiés par ce mod
     */
    attributs: {
      /**
       * Slug de la statistique affectée (depuis statistiques.jsonc)
       */
      attribut: string;
      /**
       * Valeur du bonus (en %)
       */
      valeur?: number;
    }[];
    /**
     * Notes libres sur le mod
     */
    notes?: string;
  };
}

// --- src/data/schemas/autres/montre.schema.json ---
export interface MontreSHDTheDivision2 {
  categories: {
    [k: string]: {
      id: string;
      label: string;
      color: string;
      bgColor: string;
      borderColor: string;
      accentColor: string;
      icon: string;
      stats: {
        [k: string]: {
          [k: string]: any;
        } & {
          ratio: number;
          label: string;
          max: number;
          unit?: string;
          unite?: string;
          step: number;
          target?: string;
          statistique?: string;
        };
      };
    };
  };
  max_points_per_stat: number;
}

// --- src/data/schemas/autres/tags.schema.json ---
/**
 * Clé = slug du tag.
 */
export interface TagsDeBuild {
  /**
   * This interface was referenced by `TagsDeBuild`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom affiché du tag
     */
    label: string;
    /**
     * Couleur CSS ou classe Tailwind associée
     */
    color: string;
  };
}

// --- src/data/schemas/autres/talents-autres.schema.json ---
/**
 * Talents spécifiques au mode Descente qui ne sont ni des talents d'armes ni d'équipements. Clé = slug du talent.
 */
export interface TalentsAutresDescente {
  /**
   * This interface was referenced by `TalentsAutresDescente`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]*$".
   */
  [k: string]: {
    nom: string;
    /**
     * Slug du fichier icône (optionnel)
     */
    icon?: string;
    /**
     * Données spécifiques au mode de jeu Descente
     */
    descente: {
      boucles: string[];
      categorie: 'offensif' | 'defensif' | 'utilitaire' | 'exotique';
      /**
       * Notes spécifiques au mode Descente
       */
      notes?: string;
      levels: {
        /**
         * Description du talent avec variables : {var_name}, {other_var_name}...
         */
        base: string;
        /**
         * Valeurs des variables pour un niveau donné (ex: '1', '2', etc.)
         */
        [k: string]:
          | {
              [k: string]: string | number;
            }
          | string;
      };
    };
  };
}

// --- src/data/schemas/common/statistiques.schema.json ---
/**
 * Référentiel des noms de statistiques de jeu The Division 2. Sert de lien entre les attributs affectant une même statistique.
 */
export interface StatistiquesDuJeu {
  [k: string]: {
    /**
     * Nom affiché de la statistique
     */
    nom: string;
    /**
     * Description courte de la statistique
     */
    description?: string;
  };
}

// --- src/data/schemas/equipements/ensembles.schema.json ---
/**
 * Clé = slug de l'ensemble.
 */
export interface EnsemblesGearSetsMarquesTheDivision2 {
  /**
   * This interface was referenced by `EnsemblesGearSetsMarquesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    nom: string;
    type: 'gear_set' | 'marque' | 'improvise';
    icon?: string;
    attributsEssentiels?: ('offensif' | 'defensif' | 'utilitaire' | 'random')[];
    bonus1piece?: string | BonusObject;
    bonus2pieces?: string | BonusObject;
    bonus3pieces?: string | BonusObject;
    bonus4pieces?: string | BonusObject;
    talentTorse?: string;
    talentSac?: string;
    /**
     * Notes libres sur l'ensemble
     */
    notes?: string;
  };
}
export interface BonusObject {
  attributs: {
    slug: string;
    value: number;
  }[];
  talent?: string;
}

// --- src/data/schemas/equipements/equipements.schema.json ---
/**
 * Toutes les pièces d'équipement. Clé = slug de l'équipement.
 */
export interface EquipementsTheDivision2 {
  /**
   * This interface was referenced by `EquipementsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    nom: string;
    /**
     * texte de lore lié a l'équipement
     */
    description?: string;
    /**
     * Slug de la marque/gear set, ou 'Exotique'
     */
    marque?: string;
    emplacement: 'masque' | 'torse' | 'holster' | 'sac_a_dos' | 'gants' | 'genouilleres';
    attributEssentiel?: ('offensif' | 'defensif' | 'utilitaire' | 'random')[];
    attributs?: ({
      [k: string]: any;
    } & {
      /**
       * Nom de l'attribut (doit correspondre à un nom dans attributs.jsonc)
       */
      nom?: string;
      /**
       * Valeur de l'attribut sur cet objet
       */
      valeur?: number;
      /**
       * Valeur de l'attribut sur cet objet si prototype
       */
      prototypeValue?: number;
    })[];
    talents?: string[];
    talentsPrototypes?: string[];
    mod?: boolean | number;
    estNomme?: boolean;
    type?: 'improvise' | 'standard' | 'gear_set' | 'exotique';
    obtention?: Obtention;
    /**
     * Notes libres sur l'équipement
     */
    notes?: string;
  };
}
export interface Obtention {
  /**
   * Description de comment obtenir l'objet (peut être vide)
   */
  description?: string;
  /**
   * Disponible via butin ciblé — true/false ou string décrivant les conditions
   */
  butinCible?: boolean | string;
  /**
   * Disponible via caches exotiques
   */
  cachesExotiques?: boolean;
  /**
   * Disponible via une mission — true/false ou string décrivant les conditions
   */
  mission?: boolean | string;
  /**
   * Disponible dans la Darkzone
   */
  darkZone?: boolean | string;
  /**
   * Disponible via un raid — true/false ou string décrivant les conditions
   */
  raid?: boolean | string;
  /**
   * Disponible au craft — true/false ou string décrivant les conditions
   */
  craft?: boolean | string;
  /**
   * Schemas disponible dans les caches reconstitué — true/false ou string décrivant les conditions
   */
  reconstitue?: boolean | string;
  /**
   * Disponible via une incursion — true/false ou string décrivant les conditions
   */
  incursion?: boolean | string;
  /**
   * Nom de la faction pour schémas représailles (optionnel)
   */
  represailles?: string;
}

// --- src/data/schemas/equipements/mods-equipements.schema.json ---
/**
 * Clé = slug du mod.
 */
export interface ModsDEquipementsTheDivision2 {
  /**
   * This interface was referenced by `ModsDEquipementsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    categorie: 'offensif' | 'defensif' | 'utilitaire';
    /**
     * Nom affiché du mod
     */
    nom: string;
    /**
     * Attributs modifiés par ce mod (slug + valeur)
     */
    attributs?: {
      attribut: string;
      valeur?: number;
    }[];
    /**
     * Effet textuel non lié à un attribut (optionnel)
     */
    bonus?: string;
    /**
     * Notes libres sur le mod
     */
    notes?: string;
  };
}

// --- src/data/schemas/equipements/talents-equipements.schema.json ---
/**
 * Clé = slug du talent.
 */
export interface TalentsDEquipements {
  /**
   * This interface was referenced by `TalentsDEquipements`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    [k: string]: any;
  } & {
    nom: string;
    /**
     * Slug du fichier icône dans game_assets/talents/equipements/ (sans extension)
     */
    icon?: string;
    description?: string;
    prerequis?: string;
    /**
     * True si talent exotique (dédié à un équipement exotique).
     */
    estExotique?: boolean;
    /**
     * Sur quel emplacement le talent peut être utilisé
     */
    emplacement: 'torse' | 'sac_a_dos' | 'masque' | 'holster' | 'gants' | 'genouilleres' | 'gear_set';
    /**
     * Slug de l'ensemble (si talent de gear set)
     */
    gearSet?: string;
    /**
     * Description de la version parfaite du talent
     */
    perfectDescription?: string;
    /**
     * Noms des équipements nommés qui portent la version parfaite de ce talent
     */
    equipementsParfaits?: string[];
    /**
     * Notes libres sur le talent
     */
    notes?: string;
    descente?: Descente;
  };
}
export interface Descente {
  boucles: string[];
  categorie: 'offensif' | 'defensif' | 'utilitaire' | 'exotique';
  /**
   * Notes spécifiques au mode Descente
   */
  notes?: string;
  levels: {
    /**
     * Description du talent avec variables : {var_name}, {other_var_name}...
     */
    base: string;
    /**
     * Valeurs des variables pour un niveau donné (ex: '1', '2', etc.)
     */
    [k: string]:
      | {
          [k: string]: string | number;
        }
      | string;
  };
}

// --- src/data/schemas/types/armes-type.schema.json ---
/**
 * Types d'armes + attributs essentiels liés
 */
export interface TypesArmesTheDivision2 {
  /**
   * This interface was referenced by `TypesArmesTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    nom: string;
    attributs_essentiels: string[];
    icon: string;
    type: 'principale' | 'secondaire' | 'specifique';
    /**
     * Emoji représentant le type d'arme
     */
    emoji?: string;
    /**
     * Slug de la statistique de dégâts correspondant à ce type d'arme
     */
    statistique: string;
  };
}

// --- src/data/schemas/types/attributs-type.schema.json ---
/**
 * Catégories d'attributs (offensif, defensif, utilitaire)
 */
export interface TypesAttributsTheDivision2 {
  /**
   * This interface was referenced by `TypesAttributsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z_]+$".
   */
  [k: string]: {
    /**
     * Le nom d'affichage de la catégorie
     */
    nom: string;
    /**
     * L'identifiant de l'icône associée
     */
    icon: string;
    /**
     * Couleur associé a la catégorie
     */
    color: string;
  };
}

// --- src/data/schemas/types/equipements-type.schema.json ---
/**
 * Types d'emplacements d'équipement
 */
export interface TypesEquipementsTheDivision2 {
  /**
   * This interface was referenced by `TypesEquipementsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    nom: string;
    icon: string;
    /**
     * Emoji représentant le type d'équipement
     */
    emoji?: string;
    /**
     * Valeur de protection (points) pour cet emplacement d'équipement
     */
    protection?: number;
  };
}

// --- src/data/schemas/types/mods-armes-type.schema.json ---
/**
 * Clé = slug du type de mod (ex: chargeur, canon, viseur, bouche). Valeur = objet avec le nom affiché.
 */
export interface TypesDeModsTheDivision2 {
  /**
   * This interface was referenced by `TypesDeModsTheDivision2`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z0-9_]+$".
   */
  [k: string]: {
    /**
     * Nom du type de mod
     */
    nom: string;
  };
}
