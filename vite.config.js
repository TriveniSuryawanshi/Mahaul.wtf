import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:2439',
        changeOrigin: true,
      },
    },
  },
});
