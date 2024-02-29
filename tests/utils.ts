import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';

import { mockData as testMockData } from './mock';

export async function useAuthAsync(page: Page, context: BrowserContext) {
  const { TEST_LOGIN = '', TEST_PASSWORD = '' } = process.env;
  expect(TEST_LOGIN).toBeDefined();
  expect(TEST_PASSWORD).toBeDefined();

  await page.goto('/login', { waitUntil: 'networkidle' });

  await page.getByTestId('LoginInput').fill(TEST_LOGIN);
  await page.getByTestId('PasswordInput').fill(TEST_PASSWORD);
  await page.getByTestId('SignInButton').click();

  await page.waitForNavigation();

  const cookies = await context.cookies(page.url());
  const sessionCookie = cookies.find((x) => x.name === 'session.v2');
  expect(sessionCookie?.value).toBeDefined();
}

type ImportMockDataOptions = {
  direct?: boolean;
  mockData?: string;
};

const defaultOptions: ImportMockDataOptions = {
  direct: false,
  mockData: testMockData,
};

export async function importMockDataAsync(page: Page, options: ImportMockDataOptions = {}) {
  const { direct, mockData } = { ...defaultOptions, ...options };

  if (direct) {
    // Go to import page directly
    await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  } else {
    // Go to import page via settings
    await page.locator('a[href="/settings"]').click();
    await page.waitForURL('/settings', { waitUntil: 'networkidle' });

    await page.locator('a[href="/settings/import-export"]').click();
    await page.waitForURL('/settings/import-export', { waitUntil: 'networkidle' });
  }

  await page.getByTestId('ImportTextArea').fill(mockData);

  await page.getByTestId('ParseJsonButton').click();

  await page.getByTestId('AddToJournalButton').waitFor({ state: 'visible' });
  await page.getByTestId('AddToJournalButton').click();

  await page.getByTestId('ImportSuccessToast').waitFor({ state: 'visible' });
}

export async function hasLocatorClassAsync(locator: Locator, className: string) {
  const classes = (await locator.getAttribute('class'))?.split(' ');
  return classes?.includes(className);
}
