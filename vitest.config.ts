import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    globals: false,
    css: false,
    testTimeout: 60000,
    exclude: [...configDefaults.exclude, 'Dua-API-main/**'],
  },
});
