import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  // Usa '/' en desarrollo, '/ss_minigame/' en producción
  base: process.env.NODE_ENV === 'production' ? '/ss_minigame/' : '/',
  build: {
    outDir: 'dist',
  },
});
