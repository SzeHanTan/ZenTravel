import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /ilmu-api/* → https://api.ilmu.ai/* to avoid CORS in dev
      '/ilmu-api': {
        target: 'https://api.ilmu.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ilmu-api/, ''),
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
})
