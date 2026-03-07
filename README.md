 <p align="center">
  <img src="https://img.shields.io/badge/The_Division_2-TU22-FF9000?style=for-the-badge&logoColor=white" alt="TU22" />
  <img src="https://img.shields.io/badge/Langue-Français-blue?style=for-the-badge" alt="FR" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
</p>

<h1 align="center">🟠 Réseau SHD — Base de Données FR</h1>

<p align="center">
  <strong>Base de données francophone et outil de création de builds pour Tom Clancy's The Division 2</strong>
</p>

<p align="center">
  <a href="https://join-task-french.github.io/BDDFr/">🌐 Accéder au site</a>
</p>

---

## 📋 Présentation

**Réseau SHD** est un site statique (sans backend) hébergé sur GitHub Pages, entièrement en français, destiné aux joueurs de **The Division 2**. Il propose :

- 📊 **Base de données complète** — Armes, équipements, talents, ensembles, compétences et mods, tous traduits en français
- 🛠️ **Build Planner** — Outil interactif de création de builds avec respect des contraintes du jeu
- 🔗 **Partage de builds** — Génération d'un lien unique pour partager son build
- 📜 **Changelog** — Historique complet des modifications de la base de données

Le projet est mis à jour manuellement pour suivre les mises à jour du jeu (Title Updates).

---

## 🎮 Fonctionnalités

### Base de Données

| Catégorie | Contenu |
|-----------|---------|
| 🔫 Armes | 281 armes (220 classiques + 61 exotiques + armes spécifiques) |
| 🛡️ Équipements | 311 pièces (6 exotiques, 58 nommés, gear sets, marques) |
| 🎯 Talents d'armes | 48 talents avec compatibilités par type d'arme |
| 🏅 Talents d'équipements | 46 talents (torse / sac à dos) |
| 🔗 Ensembles | 61 ensembles (25 gear sets + 36 marques) avec bonus détaillés |
| ⚡ Compétences | 43 variantes de compétences avec statistiques |
| 🔧 Mods | 89 mods d'armes, 10 mods d'équipements, 18 mods de compétences |

- Recherche textuelle dans toutes les catégories
- Affichage adaptatif (desktop / tablette / mobile)
- Codes couleur : 🔴 Exotique · 🟡 Nommé · 🟢 Gear Set · 🟠 Standard

### Build Planner

Composition d'un build complet :

| Slot | Détail |
|------|--------|
| 🎖️ Arme spécifique | 1 des 6 armes de spécialisation (détermine la spé active) |
| 🔫 Arme primaire | Arme classique + talent au choix |
| 🔫 Arme secondaire | Arme classique + talent au choix |
| 🔫 Arme de poing | Pistolet + talent au choix |
| 🛡️ 6 pièces d'équipement | Masque, torse, holster, sac, gants, genouillères |
| ⚡ 2 compétences | Toutes variantes disponibles |

**Contraintes respectées :**
- ❌ Pas 2 armes exotiques équipées simultanément
- ❌ Pas 2 pièces d'équipement exotiques simultanément
- ✅ 1 arme exotique + 1 pièce exotique = autorisé
- ❌ Pas 2 compétences du même type
- ⚠️ Certaines compétences nécessitent une spécialisation spécifique
- 🟢 Talents de gear set automatiquement résolus sur torse/sac

**Partage de build :**
- Bouton **🔗 Partager** : génère un lien compact encodé en base64
- Le lien peut être partagé et le build sera automatiquement chargé à l'ouverture
- Sauvegarde locale dans le navigateur (localStorage)

---

## 🏗️ Architecture technique

### Stack

| Technologie | Usage |
|-------------|-------|
| [React 19](https://react.dev) | Interface utilisateur |
| [Tailwind CSS 4](https://tailwindcss.com) | Styles utilitaires |
| [Vite 7](https://vite.dev) | Bundler / serveur de développement |
| [React Router 7](https://reactrouter.com) | Navigation (HashRouter pour GitHub Pages) |
| GitHub Pages | Hébergement statique (pas de backend) |
| GitHub Actions | CI/CD — validation des données + déploiement |

### Structure du projet

```
├── .github/workflows/
│   ├── deploy.yml              # Déploiement automatique sur GitHub Pages
│   └── pr-validate.yml         # Validation des données sur les Pull Requests
├── public/
│   ├── data/                   # ⚠️ Auto-généré par sync-data — ne pas modifier
│   ├── fonts/                  # Police Rajdhani (TTF)
│   └── img/ensembles/          # Logos des marques et gear sets
├── scripts/
│   ├── sync-data.mjs           # Copie src/data/*.jsonc → public/data/ (pré-build)
│   └── validate-schemas.mjs    # Script de validation JSONC ↔ schémas JSON
├── src/
│   ├── components/
│   │   ├── buildPlanner/       # Composants du Build Planner
│   │   ├── common/             # Composants réutilisables (Badge, Modal, etc.)
│   │   ├── database/           # Composants de la Base de Données
│   │   │   └── cards/          # Cartes spécialisées par catégorie
│   │   └── layout/             # Layout, Sidebar, navigation
│   ├── context/
│   │   └── BuildContext.jsx    # État global du Build Planner (useReducer)
│   ├── data/
│   │   ├── *.jsonc             # Données sources (JSONC avec commentaires)
│   │   └── schemas/            # Schémas JSON pour validation
│   ├── hooks/
│   │   └── useDataLoader.js    # Chargement asynchrone des données JSONC
│   ├── pages/
│   │   ├── BuildPlannerPage.jsx # Page Build Planner
│   │   ├── ChangelogPage.jsx    # Page Changelog
│   │   └── DatabasePage.jsx     # Page Base de Données
│   ├── styles/
│   │   └── index.css           # Styles globaux + thème SHD
│   └── utils/
│       ├── buildShare.js       # Encodage/décodage de builds pour partage URL
│       ├── dataLoader.js       # Fetch + parsing JSONC
│       └── formatters.js       # Labels FR, spécialisations, utilitaires
└── vite.config.js
```

### Données

Les données du jeu sont stockées en **JSONC** (JSON avec commentaires) pour faciliter la maintenance collaborative. Chaque fichier de données possède un **schéma JSON** associé dans `src/data/schemas/` qui valide la structure et les types/enums.

| Fichier | Schéma | Description |
|---------|--------|-------------|
| `armes.jsonc` | `armes.schema.json` | Toutes les armes (classiques, exotiques, nommées, spécifiques) |
| `equipements.jsonc` | `equipements.schema.json` | Pièces d'équipement par emplacement et source |
| `talents-armes.jsonc` | `talents-armes.schema.json` | Talents applicables aux armes |
| `talents-equipements.jsonc` | `talents-equipements.schema.json` | Talents de torse et sac à dos |
| `ensembles.jsonc` | `ensembles.schema.json` | Gear sets et marques avec bonus |
| `competences.jsonc` | `competences.schema.json` | Compétences et variantes |
| `mods-armes.jsonc` | `mods-armes.schema.json` | Mods applicables aux armes |
| `mods-equipements.jsonc` | `mods-equipements.schema.json` | Mods d'équipement |
| `mods-competences.jsonc` | `mods-competences.schema.json` | Mods de compétences |
| `changelog.jsonc` | `changelog.schema.json` | Historique des modifications de la base de données |
| `metadata.jsonc` | `metadata.schema.json` | Informations du projet et crédits |

---

## 🚀 Développement

### Prérequis

- [Node.js](https://nodejs.org) 20+
- npm

### Installation

```bash
git clone https://github.com/join-task-french/BDDFr.git
cd BDDFr
npm install
```

### Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build de production |
| `npm run validate` | Validation des données JSONC contre les schémas JSON |
| `npm run sync-data` | Synchronise `src/data/` → `public/data/` (auto avant dev/build) |

### Validation des données

Avant chaque déploiement et sur chaque Pull Request, les données sont automatiquement validées :

```bash
npm run validate
```

```
🔍 Validation des données JSONC contre les schémas JSON...

  ✅ armes.jsonc — OK (281 entrées)
  ✅ equipements.jsonc — OK (311 entrées)
  ✅ talents-armes.jsonc — OK (48 entrées)
  ...
  ✅ changelog.jsonc — OK (35 entrées)
  ✅ metadata.jsonc — OK (objet)

📊 Résultat : 11/11 fichiers validés
✅ Toutes les données sont valides !
```

---

## 📝 Contribuer aux données

### Modifier les données

1. Les fichiers de données sont dans `src/data/*.jsonc` — c'est la **seule source de vérité**
2. Chaque fichier est un tableau JSON avec commentaires (`//`)
3. Référez-vous aux schémas dans `src/data/schemas/` pour les champs attendus
4. Après modification, lancez `npm run validate` pour vérifier
5. Le dossier `public/data/` est **généré automatiquement** — ne le modifiez pas à la main

### Ajouter une arme

```jsonc
// Dans src/data/armes.jsonc
{
  "nom": "Nom de l'arme",
  "type": "fusil_assaut",        // Enum: fusil_assaut, fusil, fusil_precision, etc.
  "fabricant": "FABRICANT",
  "portee": 30,
  "rpm": 750,
  "chargeur": 30,
  "rechargement": 2.5,
  "headshot": "55%",
  "attributEssentiel": ".+21% de dégâts à la santé",
  "degatsBase": 50000,
  "estExotique": false,
  "estNomme": false,
  "talentNomme": "",
  "talent1": "",
  "talent2": "",
  "obtention": ""
}
```

### Ajouter un équipement

```jsonc
// Dans src/data/equipements.jsonc
{
  "nom": "Nom de la pièce",
  "marque": "Nom de la Marque",
  "emplacement": "torse",        // Enum: masque, torse, holster, sac_a_dos, gants, genouilleres
  "attributEssentiel": "",
  "attribut1": "",
  "attributUnique": "",
  "talent": "",                   // Talent dédié (pièces nommées)
  "mod": "",
  "estNomme": false,
  "estExotique": false,
  "source": "marque",             // Enum: gear_set, marque, exotic
  "talent1": "",                  // Talents exotiques uniquement
  "talent2": "",
  "obtention": ""
}
```

---

## 🔄 CI/CD

### Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` s'exécute automatiquement sur chaque push sur `main` :

1. **Validation** — Vérifie les données JSONC avec les schémas
2. **Build** — Compile le projet React avec Vite
3. **Déploiement** — Publie le dossier `dist/` sur GitHub Pages

### Validation sur Pull Request

Le workflow `.github/workflows/pr-validate.yml` s'exécute sur chaque PR vers `main` :

1. **Validation** — Vérifie les données JSONC
2. **Build** — Vérifie que le projet compile sans erreur

---

## 👥 Crédits

Données collectées et traduites par la communauté francophone :

**Rav** · **Major45-FR** · **Marco888** · **Squal_fr** · **Franck-FR** · **Saiyanns** · **V0ldeen** · **Ben3and** · **Titi-FT-70** · **PP.1974-fr** · **Captain77**

---

## ⚠️ Avertissement

Ce projet est un outil communautaire non officiel. *Tom Clancy's The Division 2* est une marque déposée d'Ubisoft. Toutes les données du jeu appartiennent à leurs propriétaires respectifs.

---

<p align="center">
  <sub>Fait avec 🟠 par le clan <strong>Join Task French</strong></sub>
</p>

