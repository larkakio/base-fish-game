import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['phaser'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
