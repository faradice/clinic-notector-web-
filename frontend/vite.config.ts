/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: a new service worker takes over on the next load, so visitors
      // never get stuck on a stale version — important for a live product.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // We ship our own public/manifest.webmanifest, so the plugin shouldn't add one.
      manifest: false,
      workbox: {
        // Precache the app shell (hashed build assets + the one-pager) for offline load.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,ico,png}'],
        // SPA fallback for offline navigations, but never for the API.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
      },
      // Keep the SW OUT of `npm run dev` (avoids caching HMR modules). Test the real
      // SW with `npm run build && npm run preview`.
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
