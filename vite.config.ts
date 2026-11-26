import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@pkmn/sim', '@pkmn/sets', '@pkmn/img', 'inkjs/full'],
  },
});
