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
- Comparateur et listes: `src/context/CollectionContext.jsx` porte l'etat partage (listes en localStorage `bddfr_listes`, selection de comparaison en sessionStorage, menu contextuel). Les cartes ne font qu'appeler `itemMenuHandlers(categorie, item)` — aucune UI de menu dans les cartes.
- Ce qui est comparable est decrit dans `src/config/comparisonConfig.js` (`groupBy` = ce qui a du sens cote a cote, `rows` = les champs et leur sens de lecture). Ajouter une categorie comparable se fait la, pas dans les composants.
- L'identite d'un item vient de `src/utils/itemIdentity.js` : slug en general, `competenceSlug:slug` pour les variantes de competences (deux competences peuvent partager un slug de variante), et la vue `descente` est reconstituee depuis trois sources.
- Generator: `src/pages/GeneratorPage.jsx` s'appuie sur `FIELDS/FILE_MAP/IDENTITY_KEY`; export ZIP fusionne local + loaded et regenere JSONC.
- Buildotheque API: `src/utils/apiBuildotheque.js` + pages `src/pages/build/BuildPlannerPage.jsx` et `src/pages/build/BuildLibraryPage.jsx` (auth Discord, likes, CRUD builds, override URL API en localStorage).

## Workflows dev/CI essentiels
- Installation: `npm install`.
- Dev local: `npm run dev` (declenche `predev` => `prepare` + `sync-data`).
- Build standard: `npm run build` (declenche `prebuild`, puis `vite build` + `generate-statics`).
- Build avec images OG (lourd): `npm run buildWithImages` ou `npm run generate-statics-images` (Puppeteer + serveur Vite local).
- Validation rapide PR: `npm run validate` (schemas + slugs + ensembles-pieces + skill-mods + tests).
- Validation complete locale: `npm run validate-all` (tous les `scripts/validate/validate-*.mjs` dont icones, puis lint et tests).
- Tests: `npm test` (Vitest; `npm run test:watch` en dev).
- Smoke test: `npm run smoke` (charge `dist/` dans Chrome via Puppeteer). `npm run smoke:build` enchaine build + smoke. Lance en CI apres le build : c'est le seul filet qui attrape un ecran blanc ou un catalogue vide, cas ou le build reussit quand meme.
- Lint: `npm run lint` (echoue sur erreur), `npm run lint:ci` (cliquet sur le nombre d'avertissements, plafond dans package.json), `npm run lint:strict` (objectif zero). Voir `eslint.config.js`.
- Types: `npm run generate-types` regenere `src/types/data.d.ts` depuis `src/data/schemas/` (a relancer apres modification d'un schema).
- Images: `node scripts/convert-images-webp.mjs --apply` convertit les PNG de `src/img/` en WebP (`--dry-run` par defaut).
- Hook git: `.githooks/pre-push` stash les changements non commites puis lance `npm run validate-all` sur le dernier commit.
- CI GitHub (`.github/workflows/pr-validate.yml`) utilise Node 24, lance `npm run validate` puis `npm run build`.

## Conventions projet-specifiques a respecter
- JSONC accepte commentaires/BOM; **runtime et validation utilisent tous deux `jsonc-parser`** (`useDataLoader.js`, `validate-*.mjs`) — indispensable pour que ce qui passe la validation soit exactement ce que l'app sait lire. Ne pas reintroduire de strip par regex : l'ancien se desynchronisait et rendait 2 fichiers silencieusement illisibles.
- Slug = identite primaire pour la plupart des categories; exceptions notables: `competences` (identite composee `competence + variante`), `builds` (nom).
- Eviter de hardcoder des donnees metier dans les composants/hooks (listes, labels, mappings d'items): reutiliser d'abord les JSONC et configs existants.
- Toujours privilegier `src/data/**/*.jsonc` + configs (`filterConfigs`, `generatorFields`) comme source de verite; le code UI doit surtout consommer ces structures.
- Si une donnee n'existe pas, creer un nouveau JSONC/config par defaut seulement si c'est pertinent, puis brancher proprement les points d'integration associes.
- Quand vous ajoutez une categorie donnee, alignez **ensemble**: `DATA_FILES_MAP` (`useDataLoader`), `FILE_MAP/IDENTITY_KEY/FIELDS` (`generatorFields`), filtres/tri (`filterConfigs`), `CATEGORIES` (`src/config/categories.js`), `COMPARISON_CONFIG` (`comparisonConfig`) et route/rendu DB. Le test `useDataLoader.test.js` echoue si un JSONC n'est pas branche.
- Les URLs partage/build utilisent query params (`b`, `build-id`, `edit`) et doivent rester retro-compatibles (`buildShare.decodeBuild` gere ancien et nouveau format).
- Base path deployment est configurable via `VITE_BASE_PATH`; par defaut `/BDDFr` (`vite.config.js`). Eviter les chemins absolus hardcodes hors cette convention.

## Integrations externes et automatisations
- PWA via `vite-plugin-pwa` dans `vite.config.js` : le precache ne couvre que la coquille JS/CSS/HTML ; images, polices et chunks Mermaid passent par `runtimeCaching`.
- Decoupage des chunks (`build.rollupOptions.output.manualChunks`) : `game-data` isole les JSONC (~770 Ko) du code applicatif pour que leurs caches s'invalident independamment, `react-vendor` isole le socle React. Ne pas separer react/react-dom/scheduler : ils doivent rester dans le meme chunk.
- Assets en WebP ; `GameAssets.jsx` indexe par nom de fichier SANS extension, donc les champs `icon` des JSONC ne portent jamais d'extension.
- Pages statiques / SEO : `scripts/lib/site-pages.mjs` (commun aux deux generateurs) ecrit pour chaque URL publique un `index.html` qui EST l'app (copie de `dist/index.html`, head propre a la page, contenu pre-rendu dans `#root`), plus les pages de categorie, `404.html` (l'app, en noindex) et le sitemap. Ne jamais revenir a des stubs `location.replace("/#/...")` : Google ignore le fragment et n'indexe alors que l'accueil. URLs canoniques avec slash final (GitHub Pages redirige les autres en 301). Le sitemap doit etre soumis dans la Search Console : un `robots.txt` sous `/BDDFr/` n'est lu par aucun moteur.
- Apercus Discord : chaque page generee par `generate-static-pages*.mjs` (et `dist/index.html`) embarque, en plus des balises Open Graph, un *component embed* Discord inline (`<script id="discord:component-embed">`). Le format (contenu par categorie, boutons, degradation sous 3000 octets) vit uniquement dans `scripts/lib/discord-embed.mjs` ; `discord-embed.test.js` verifie les contraintes Discord sur toutes les donnees. Les embeds exigent une URL de base absolue (sinon rien n'est emis).
- Remontee d'erreurs client : `src/utils/errorReporter.js`, active en definissant `VITE_ERROR_WEBHOOK` au build (webhook Discord ou endpoint JSON). Sans cette variable, aucun appel reseau.
- Buildotheque externe (API HTTP + OAuth Discord redirect) pilotee par metadata `buildLibraryApiUrl` ou override local.
- Workflow contribution auto via issue: `.github/workflows/contribution-issue-to-pr.yml` applique un patch JSONC (`scripts/apply-contribution-patch.mjs`) puis valide avant creation PR.
- **Securite**: le corps d'issue est une donnee NON FIABLE (n'importe qui peut ouvrir une issue, le job a un token en ecriture). `apply-contribution-patch.mjs` restreint les ecritures aux `.jsonc` de `src/data/` (allowlist lue sur disque), valide les slugs et refuse les cles de prototype; le workflow verifie en plus qu'aucun fichier hors `src/data/` n'a bouge. Couvert par `scripts/apply-contribution-patch.test.js` — ne pas relacher ces controles.


