import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Sicherheits-kritische reine Auth-Logik (PLATTFORM_MANIFEST §10: lib/auth 90%).
      // Schemas werden über lib/schemas/*.test.ts geprüft; lib/supabase/** und
      // actions.ts sind dünne Wrapper um Framework-Aufrufe (Mocks/E2E).
      include: ['lib/auth/teacher-auth.ts', 'lib/auth/pin.ts', 'lib/blocks/evaluate.ts'],
      exclude: ['**/*.test.{ts,tsx}'],
      thresholds: {
        statements: 90,
        functions: 90,
        lines: 90,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
