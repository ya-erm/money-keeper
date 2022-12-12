import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const { TEST_LOGIN, TEST_PASSWORD } = process.env;

  await page.goto(`http://localhost:${config.webServer?.port}/login`);

  await page.locator('input[name="login"]').fill(TEST_LOGIN ?? '');
  await page.locator('input[name="password"]').fill(TEST_PASSWORD ?? '');
  await page.getByTestId('SignInButton').click();
  await page.waitForNavigation();

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: './tests/storageState.json' });
  await browser.close();
}

export default globalSetup;
