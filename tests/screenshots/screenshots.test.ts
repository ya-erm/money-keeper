import test, { Page } from '@playwright/test';
import { importMockDataAsync } from '@tests/utils';
import { mockData } from '../demo.mock';

const SCREENSHOTS_PATH = 'tests/screenshots';

async function openRoute(page: Page, route: string) {
  await page.goto(route + (route.includes('?') ? '&' : '?') + 'hideGuestToast=true', {
    waitUntil: 'networkidle',
  });
}

['en-US', 'ru-RU'].map((locale) => {
  test.describe(`Screenshots for locale ${locale}`, () => {
    test.use({ viewport: { width: 390, height: 844 }, locale });

    test.describe('Categories', () => {
      const folder = `${SCREENSHOTS_PATH}/${locale}/categories`;
      test('empty categories', async ({ page }) => {
        await openRoute(page, '/categories');
        await page.screenshot({ path: `${folder}/empty.png` });
      });
      test('create new category', async ({ page }) => {
        await openRoute(page, '/categories?action=create');
        await page.screenshot({ path: `${folder}/new.png` });
      });
      test('categories example', async ({ page }) => {
        await importMockDataAsync(page, { direct: true, mockData });
        await openRoute(page, '/categories');
        await page.screenshot({ path: `${folder}/demo.png` });
      });
    });

    test.describe('Accounts', () => {
      const folder = `${SCREENSHOTS_PATH}/${locale}/accounts`;
      test('empty accounts', async ({ page }) => {
        await openRoute(page, '/accounts');
        await page.screenshot({ path: `${folder}/empty.png` });
      });
      test('create new account', async ({ page }) => {
        await openRoute(page, '/accounts?action=create');
        await page.screenshot({ path: `${folder}/new.png` });
      });
      test('accounts example', async ({ page }) => {
        await importMockDataAsync(page, { direct: true, mockData });
        await openRoute(page, '/accounts');
        await page.screenshot({ path: `${folder}/demo.png` });
      });
    });
  });
});
