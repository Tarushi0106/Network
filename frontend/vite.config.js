import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Determine the API base URL based on environment
const apiBaseUrl = process.env.VITE_API_URL || 'http://51.20.52.19:5000';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: apiBaseUrl,
        changeOrigin: true
      }
    }
  }
});
