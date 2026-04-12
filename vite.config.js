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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
      manifest: {
        "short_name": "BDDFr",
        "name": "BDDFr",
        "icons": [
          {
            "src": "favicon_150x150.png",
            "type": "image/png",
            "sizes": "150x150",
            "purpose": "any maskable"
          },
          {
            "src": "favicon_192x192.png",
            "type": "image/png",
            "sizes": "192x192"
          }
        ],
        "start_url": process.env.VITE_BASE_PATH || '/BDDFr',
        "display": "standalone",
        "theme_color": "#15181d",
        "background_color": "#0d0f12"
      }
    })
  ],
  base: process.env.VITE_BASE_PATH || '/BDDFr',
  assetsInclude: ['**/*.jsonc'],
  build: {
    assetsInlineLimit: 10240,
  },
  define: {
    __APP_VERSION__: JSON.stringify(Date.now().toString()),
    __REPOS_URL__: JSON.stringify(`https://github.com/${ process.env.GITHUB_REPOSITORY || 'joint-task-french/bddfr' }`)
  },
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  }
})

