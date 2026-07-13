import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service worker personalizzato (src/sw.js): serve per gestire
      // le notifiche push oltre alla cache offline.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ]
})
