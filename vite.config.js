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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
        cleanupOutdatedCaches: true,
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
    assetsInlineLimit: 10240,
    chunkSizeWarningLimit: 2000,
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