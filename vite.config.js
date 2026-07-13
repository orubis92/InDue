import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'InDue — Attività condivise',
        short_name: 'InDue',
        description: 'Le cose da fare, in due: casa, vacanza e tutto il resto.',
        theme_color: '#0F6B66',
        background_color: '#F2F4F1',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        // Cache dell'app shell per uso offline (i dati richiedono comunque rete)
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ]
})
