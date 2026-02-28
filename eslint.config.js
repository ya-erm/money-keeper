import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import svelteConfig from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: ['**/*.js', '**/playwright.config.ts', '**/service-worker.ts', '.svelte-kit/**'],
  },
  js.configs.recommended,
  ...svelteConfig.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
        VoidFunction: 'readonly',
        JsonWebKey: 'readonly',
      },
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
        extraFileExtensions: ['.svelte'],
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
        VoidFunction: 'readonly',
        JsonWebKey: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off', // Отключено в пользу @typescript-eslint/no-unused-vars
      'svelte/no-reactive-functions': 'off',
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/no-reactive-reassign': 'warn',
      'svelte/no-immutable-reactive-statements': 'warn',
      'svelte/no-useless-mustaches': 'warn',
      'svelte/require-each-key': 'warn',
      'svelte/prefer-svelte-reactivity': 'warn',
      'no-useless-assignment': 'warn',
      'no-undef': 'warn',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
];
