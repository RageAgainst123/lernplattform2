import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Projekt-Qualitäts-Limits (PLATTFORM_MANIFEST §10).
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'types/**/*.{ts,tsx}',
    ],
    // components/ui wird per shadcn-CLI verwaltet, nicht manuell — von den
    // Projekt-Limits ausgenommen (PLATTFORM_MANIFEST: ui via CLI, nicht modifizieren).
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'components/ui/**'],
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipComments: true }],
      complexity: ['error', { max: 10 }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
