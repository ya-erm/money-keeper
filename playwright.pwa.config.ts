import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Service workers are disabled by SvelteKit's development server.
export default defineConfig({
  ...base,
  testMatch: '**/startup/*.test.ts',
  outputDir: 'test-results-pwa',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/pwa', open: 'never' }]],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4174' },
  projects: [{ name: 'pwa-chromium', metadata: { pwa: true } }],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174',
    port: 4174,
    reuseExistingServer: false,
  },
});
