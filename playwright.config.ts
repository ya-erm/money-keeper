import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Read from default ".env" file.
dotenv.config();

const config: PlaywrightTestConfig = {
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  /*
  globalSetup: './tests/global-setup',
  use: {
    // Tell all tests to load signed-in state from 'storageState.json'.
    storageState: './tests/storageState.json',
  },
  */
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    testIdAttribute: 'data-testId',
    timezoneId: 'Europe/Moscow',
    viewport: {
      width: 390,
      height: 844,
    },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    reuseExistingServer: true,
    port: 4173,
  },
  testDir: './tests',
};

export default config;
