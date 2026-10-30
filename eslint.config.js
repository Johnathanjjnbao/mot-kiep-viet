import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config(
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        caches: 'readonly',
        Response: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        document: 'readonly',
        innerWidth: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        navigator: 'readonly',
        indexedDB: 'readonly',
      },
    },
  },
  {
    ignores: ['.local/**', 'dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        crypto: 'readonly',
        HTMLDialogElement: 'readonly',
        HTMLInputElement: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },
);
