import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Read from default ".env" file.
dotenv.config();

const config: PlaywrightTestConfig = {
  /*
  globalSetup: './tests/global-setup',
  use: {
    // Tell all tests to load signed-in state from 'storageState.json'.
    storageState: './tests/storageState.json',
  },
  */
  use: {
    baseURL: 'http://127.0.0.1:4173',
    testIdAttribute: 'data-testId',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    reuseExistingServer: true,
    port: 4173,
  },
  testDir: './tests',
};

export default config;
