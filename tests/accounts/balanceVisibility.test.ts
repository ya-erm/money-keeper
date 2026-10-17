import type { Page } from '@playwright/test';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';
import type { Snapshot } from '../../src/lib/data/snapshot';

async function readSyncedData(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('mk-2');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await Promise.all(
        ['accounts', 'globalSettings', 'memberSettings', 'journal'].map(
          (store) =>
            new Promise((resolve, reject) => {
              const read = db.transaction(store).objectStore(store).getAll();
              read.onsuccess = () => resolve(read.result);
              read.onerror = () => reject(read.error);
            }),
        ),
      );
    } finally {
      db.close();
    }
  });
}

test('toggles card balances locally and remembers each account after reload', async ({ page }) => {
  await importMockDataAsync(page);
  await openPathAsync(page, '/accounts');

  const card = page.getByTestId('AccountCard').filter({ hasText: 'T_TST' });
  const otherCard = page.getByTestId('AccountCard').filter({ hasText: 'T_USD' });
  const toggle = card.getByRole('button', { name: 'Hide amount', exact: true });
  const dataBefore = await readSyncedData(page);

  await expect(toggle).toContainText(/549\.50/);
  await toggle.click();
  await expect(card.getByRole('button', { name: 'Show amount', exact: true })).toContainText('******');
  await expect(otherCard.getByRole('button', { name: 'Hide amount', exact: true })).not.toContainText('******');
  await expect.poll(() => readSyncedData(page)).toEqual(dataBefore);

  await page.reload({ waitUntil: 'networkidle' });
  const show = card.getByRole('button', { name: 'Show amount', exact: true });
  await expect(show).toContainText('******');
  await show.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toContainText(/549\.50/);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(toggle).toContainText(/549\.50/);
  expect(await readSyncedData(page)).toEqual(dataBefore);
});

test('applies local account privacy across screens without changing synchronized data', async ({ page, browser }) => {
  test.setTimeout(60000);
  const data = JSON.parse(mockData) as Snapshot;
  data.accounts.forEach((account) => (account.currency = 'USD'));
  data.operations.forEach((operation) => (operation.date = '2024-02-01T12:00:00.000Z'));
  const income = data.operations.find((operation) => operation.comment === 'Income')!;
  data.operations.push({ ...income, id: 'previous-month-income', date: '2024-01-15T12:00:00.000Z', amount: 20 });
  await importMockDataAsync(page, JSON.stringify(data));
  await openPathAsync(page, '/accounts');
  const before = await readSyncedData(page);
  const card = page.getByTestId('AccountCard').filter({ hasText: 'T_TST' });
  await card.getByRole('button', { name: 'Hide amount', exact: true }).click();

  await card.getByRole('button', { name: 'Additional options', exact: true }).click();
  await page.locator('.modal button').filter({ hasText: 'Correct balance' }).click();
  await expect(page.locator('.current-balance')).toContainText('******');

  await openPathAsync(page, '/accounts/list');
  await expect(page.getByRole('button', { name: 'T_TST', exact: true })).toContainText('******');
  await expect(page.getByRole('button', { name: 'T_USD', exact: true })).not.toContainText('******');

  await openPathAsync(page, '/analytics/accounts');
  const row = page.locator('tr').filter({ hasText: 'T_TST' });
  await expect(row.locator('.rated-balance')).toContainText('******');
  await expect(row.locator('.percentages')).toContainText('%');
  await expect(page.locator('tfoot')).toContainText('******');

  await openPathAsync(page, '/analytics/categories');
  await expect(page.getByRole('button', { name: /T_Pets/ })).toContainText('******');
  await page.getByRole('button', { name: /T_Pets/ }).click();
  await expect(page.getByRole('region', { name: 'By comment' })).toContainText('******');

  await openPathAsync(page, '/analytics/income-expenses');
  await expect(page.locator('.hidden-money').first()).toBeVisible();

  await openPathAsync(page, '/analytics');
  await expect(page.locator('.account-list li').filter({ hasText: 'T_TST' }).locator('.amount')).toBeEmpty();
  await expect(page.locator('.account-list li').filter({ hasText: 'T_USD' }).locator('.amount')).not.toBeEmpty();
  await expect(page.locator('.category-legend')).toHaveClass(/amounts-hidden/);
  await expect(page.locator('.balance-summary')).toContainText('******');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.balance-summary')).toContainText('******');
  expect(await readSyncedData(page)).toEqual(before);

  const otherDevice = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const otherPage = await otherDevice.newPage();
    await importMockDataAsync(otherPage, JSON.stringify(data));
    await openPathAsync(otherPage, '/accounts/list');
    await expect(otherPage.getByRole('button', { name: 'T_TST', exact: true })).not.toContainText('******');
  } finally {
    await otherDevice.close();
  }

  await openPathAsync(page, '/accounts');
  await card.getByRole('button', { name: 'Show amount', exact: true }).click();
  await openPathAsync(page, '/accounts/list');
  await expect(page.getByRole('button', { name: 'T_TST', exact: true })).not.toContainText('******');
  await openPathAsync(page, '/analytics/accounts');
  await expect(row.locator('.rated-balance')).not.toContainText('******');
  await expect(page.locator('tfoot')).not.toContainText('******');
  expect(await readSyncedData(page)).toEqual(before);
});
