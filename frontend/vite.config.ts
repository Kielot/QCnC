import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'QCnC', short_name: 'QCnC', description: 'QCnC Physical GUI Testing System',
      theme_color: '#0f1b2d', background_color: '#f4f6f9', display: 'standalone', start_url: '/',
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
    },
    // Static assets only. API calls (/api) are never cached, so live hardware status is never served stale.
    workbox: { navigateFallback: '/index.html', navigateFallbackDenylist: [/^\/api/], globPatterns: ['**/*.{js,css,html,png,svg}'] }
  })]
});
