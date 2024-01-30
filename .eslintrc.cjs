module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:svelte/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['*.cjs', '*.js', 'playwright.config.ts', 'service-worker.ts'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      rules: {
        'svelte/valid-compile': ['error', { ignoreWarnings: true }],
      },
    },
    {
      files: ['*.ts', '*.svelte'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-misused-promises': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },
  ],
  parserOptions: {
    project: ['tsconfig.json'],
    extraFileExtensions: ['.svelte'],
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
};
