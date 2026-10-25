import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Le precache ne contient que la coquille applicative (JS/CSS/HTML).
        // Les images et polices sont mises en cache a la demande (runtimeCaching
        // ci-dessous) : elles representaient l'essentiel des ~14 Mo precharges
        // par chaque visiteur, pour des assets dont il ne voit qu'une fraction.
        globPatterns: ['**/*.{js,css,html}'],
        // Les moteurs de diagrammes Mermaid (cytoscape, katex, un chunk par type
        // de diagramme) ne servent que sur quelques pages de contenu : inutile
        // de les precharger, le runtime cache les prendra si besoin.
        globIgnores: [
          '**/assets/{cytoscape,katex,dagre}*.js',
          '**/assets/chunk-*.js',
          // Mermaid emet un chunk par type de diagramme, nommes
          // `<nom>-<HASH8 majuscule>-<hash vite>.js`. Les chunks applicatifs
          // n'ont qu'un seul segment de hash (et en casse mixte), ils ne
          // correspondent donc pas a ce motif.
          '**/assets/*-[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]-*.js',
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'bddfr-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'bddfr-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Chunks lazy exclus du precache (Mermaid & co).
            urlPattern: ({ request, url }) => request.destination === 'script' && url.pathname.includes('/assets/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bddfr-lazy-chunks',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        "short_name": "BDDFr",
        "name": "BDDFr",
        "icons": [
          {
            "src": "favicon_192x192.png",
            "type": "image/png",
            "sizes": "192x192"
          },
          {
            "src": "favicon_512x512.png",
            "type": "image/png",
            "sizes": "512x512"
          }
        ],
        "start_url": process.env.VITE_BASE_PATH || '/BDDFr',
        "display": "standalone",
        "theme_color": "#15181d",
        "background_color": "#2c3e50"
      }
    })
  ],
  base: process.env.VITE_BASE_PATH || '/BDDFr',
  assetsInclude: ['**/*.jsonc'],
  build: {
    // 0 = aucun asset inline en base64. Avec l'ancienne valeur (10 Ko), 168 des
    // 236 images etaient encodees en base64 dans le bundle JS : le chunk
    // GameAssets pesait 1,79 Mo (1,27 Mo gzip, le base64 ne se compressant pas)
    // sur le chemin critique, non cachable individuellement et invalide en
    // entier des qu'une seule icone changeait.
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // '\u005C' = antislash : evite un litteral d'echappement ici.
          const path = id.split('\u005C').join('/')

          // Les ~767 Ko de JSONC bruts representaient pres de la moitie du
          // chunk d'entree. Donnees et code applicatif changent a des rythmes
          // tres differents : les separer evite qu'une correction de CSS
          // n'invalide toute la base de donnees dans le cache des visiteurs
          // (et inversement).
          if (path.includes('/src/data/') && path.includes('.jsonc')) {
            return 'game-data'
          }

          // Socle React : quasi immuable entre deux deploiements applicatifs.
          // react, react-dom, scheduler et react-router restent dans le MEME
          // chunk — les separer casserait l'ordre d'initialisation.
          const VENDOR_REACT = ['react', 'react-dom', 'scheduler', 'react-router', 'react-router-dom']
          if (VENDOR_REACT.some(m => path.includes('/node_modules/' + m + '/'))) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(Date.now().toString()),
    __REPOS_URL__: JSON.stringify(`https://github.com/${ process.env.GITHUB_REPOSITORY || 'joint-task-french/bddfr' }`)
  },
  server: {
    // Restreint aux hotes locaux : `true` desactivait la protection
    // anti-DNS-rebinding du serveur de dev.
    allowedHosts: ['localhost', '127.0.0.1', '.localhost'],
  },
  preview: {
    allowedHosts: ['localhost', '127.0.0.1', '.localhost'],
  }
})
