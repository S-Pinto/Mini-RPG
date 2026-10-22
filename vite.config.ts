import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Relative base path ensures GitHub Pages compatibility
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
