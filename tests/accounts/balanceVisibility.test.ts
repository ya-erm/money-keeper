import type { Page } from '@playwright/test';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';

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
