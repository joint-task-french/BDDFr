# AGENTS.md

## Objectif du repo
- App Vite + React pour la base de donnees FR de *The Division 2* avec 3 surfaces majeures: `db` (consultation), `build`/`library` (planner + partage), `generator` (contributions JSONC).
- Le coeur du projet est **data-driven**: les pages derivent quasi entierement de `src/data/**/*.jsonc` et de configs (`src/config/filterConfigs.js`, `src/config/generatorFields.js`).

## Architecture a comprendre en premier
- Entree/routing: `src/main.jsx` utilise `HashRouter` + `src/components/common/URLCleaner.jsx` (important pour GitHub Pages et URLs propres sous base `/BDDFr`).
- Routes principales: `src/App.jsx` (lazy loading, preload idle, auth callback via `?token=...`, provider `BuildProvider` pour planner/library).
- Chargement donnees: `src/hooks/useDataLoader.js` charge tous les JSONC via `import.meta.glob`, injecte les `slug`, enrichit (`competencesGrouped`, armes de specialisation, lookups).
- Etat build complexe: `src/context/BuildContext.jsx` (reducer central, contraintes exotiques/skills, persistence `localStorage`, SHD sync via event `SHD_LEVELS_UPDATED_EVENT`).
- Partage build: `src/utils/buildShare.js` encode/decode format compact (`~` + lz-string) + resolution IDs/slug vers objets runtime.

## Flux de donnees et frontieres
- Source veritee: `src/data/` (JSONC versionne) + schemas `src/data/schemas/`.
- Sync public: `npm run sync-data` copie uniquement les JSONC racine de `src/data` vers `public/data` (pas recursif); ne pas supposer que les sous-dossiers y seront reflates.
- DB page: `src/pages/DatabasePage.jsx` pilote recherche/filtres/tri via URL query (`q`, `filters`, `sort`) et `src/config/filterConfigs.js`.
- Generator: `src/pages/GeneratorPage.jsx` s'appuie sur `FIELDS/FILE_MAP/IDENTITY_KEY`; export ZIP fusionne local + loaded et regenere JSONC.
- Buildotheque API: `src/utils/apiBuildotheque.js` + pages `src/pages/build/BuildPlannerPage.jsx` et `src/pages/build/BuildLibraryPage.jsx` (auth Discord, likes, CRUD builds, override URL API en localStorage).

## Workflows dev/CI essentiels
- Installation: `npm install`.
- Dev local: `npm run dev` (declenche `predev` => `prepare` + `sync-data`).
- Build standard: `npm run build` (declenche `prebuild`, puis `vite build` + `generate-statics`).
- Build avec images OG (lourd): `npm run buildWithImages` ou `npm run generate-statics-images` (Puppeteer + serveur Vite local).
- Validation rapide PR: `npm run validate` (schemas + slugs + ensembles-pieces + skill-mods).
- Validation complete locale: `npm run validate-all` (execute tous les `scripts/validate/validate-*.mjs`, inclut icones).
- Hook git: `.githooks/pre-push` stash les changements non commites puis lance `npm run validate-all` sur le dernier commit.
- CI GitHub (`.github/workflows/pr-validate.yml`) utilise Node 24, lance `npm run validate` puis `npm run build`.

## Conventions projet-specifiques a respecter
- JSONC accepte commentaires/BOM; les scripts utilisent un strip custom ou `jsonc-parser` (voir `useDataLoader.js`, `validate-schemas.mjs`).
- Slug = identite primaire pour la plupart des categories; exceptions notables: `competences` (identite composee `competence + variante`), `builds` (nom).
- Eviter de hardcoder des donnees metier dans les composants/hooks (listes, labels, mappings d'items): reutiliser d'abord les JSONC et configs existants.
- Toujours privilegier `src/data/**/*.jsonc` + configs (`filterConfigs`, `generatorFields`) comme source de verite; le code UI doit surtout consommer ces structures.
- Si une donnee n'existe pas, creer un nouveau JSONC/config par defaut seulement si c'est pertinent, puis brancher proprement les points d'integration associes.
- Quand vous ajoutez une categorie donnee, alignez **ensemble**: `DATA_FILES_MAP` (`useDataLoader`), `FILE_MAP/IDENTITY_KEY/FIELDS` (`generatorFields`), filtres/tri (`filterConfigs`), et route/rendu DB.
- Les URLs partage/build utilisent query params (`b`, `build-id`, `edit`) et doivent rester retro-compatibles (`buildShare.decodeBuild` gere ancien et nouveau format).
- Base path deployment est configurable via `VITE_BASE_PATH`; par defaut `/BDDFr` (`vite.config.js`). Eviter les chemins absolus hardcodes hors cette convention.

## Integrations externes et automatisations
- PWA via `vite-plugin-pwa` dans `vite.config.js` (manifest + cache workbox).
- Buildotheque externe (API HTTP + OAuth Discord redirect) pilotee par metadata `buildLibraryApiUrl` ou override local.
- Workflow contribution auto via issue: `.github/workflows/contribution-issue-to-pr.yml` applique un patch JSONC (`scripts/apply-contribution-patch.mjs`) puis valide avant creation PR.


