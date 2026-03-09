import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/BDDFr/',
  assetsInclude: ['**/*.jsonc'],
  build: {
    assetsInlineLimit: 10240,
  }
})

