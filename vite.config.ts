import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  // Uses '/Pokemon-AU/' on production builds for GitHub Pages (https://luso233.github.io/Pokemon-AU/)
  // while keeping '/' on local dev (`vite`). Override via VITE_BASE_PATH if deploying elsewhere.
  base:
    process.env.VITE_BASE_PATH ?? (command === 'build' ? '/Pokemon-AU/' : '/'),
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/ollama-proxy': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama-proxy/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['@pkmn/sim', '@pkmn/sets', '@pkmn/img', 'inkjs/full'],
  },
}));
