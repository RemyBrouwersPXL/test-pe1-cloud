import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/auth': {
        target: process.env.VITE_AUCTION_SERVICE_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/auctions': {
        target: process.env.VITE_AUCTION_SERVICE_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: process.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/inspections': {
        target: process.env.VITE_INSPECTION_SERVICE_URL || 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
    'import.meta.env.VITE_RELEASE_TAG': JSON.stringify(process.env.VITE_RELEASE_TAG || `v${process.env.VITE_APP_VERSION || '1.0.0'}`),
    'import.meta.env.VITE_GIT_COMMIT': JSON.stringify(process.env.VITE_GIT_COMMIT || ''),
  },
});
