import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || './',
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

