import { expect, type BrowserContext, type Page } from '@playwright/test';

export async function useAuthAsync(page: Page, context: BrowserContext) {
  const { TEST_SESSION } = process.env;
  expect(TEST_SESSION).toBeDefined();
  await page.goto('/');
  await context.addCookies([
    {
      url: page.url(),
      name: 'session',
      value: TEST_SESSION ?? '',
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
}
