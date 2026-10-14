import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/LWang.github.io/',
  plugins: [react()],
});
