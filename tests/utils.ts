import { expect, type BrowserContext, type Page, type Locator } from '@playwright/test';

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

export async function hasLocatorClassAsync(locator: Locator, className: string) {
  const classes = (await locator.getAttribute('class'))?.split(' ');
  return classes.includes(className);
}
