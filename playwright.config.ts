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
  webServer: {
    command: 'npm run build && npm run preview',
    reuseExistingServer: true,
    port: 4173,
  },
  testDir: './tests',
};

export default config;
