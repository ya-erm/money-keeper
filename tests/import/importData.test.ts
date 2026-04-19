import { expect, test } from '@playwright/test';

import { importMockDataAsync, openGuestAppAsync } from '@tests/helpers';

test.describe('Import / Export', () => {
  test('imports seed data into guest indexedDB and shows it in the UI', async ({ page }) => {
    await openGuestAppAsync(page);
    await importMockDataAsync(page);

    await expect(page.getByText('Categories: 3,')).toBeVisible();
    await expect(page.getByText('Accounts: 2,')).toBeVisible();
    await expect(page.getByText('Operations: 4,')).toBeVisible();

    await page.goto('/transactions', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('TransactionListItem').filter({ hasText: 'Income' })).toBeVisible();
    await expect(page.getByTestId('TransactionListItem').filter({ hasText: 'Food for pets' })).toBeVisible();
  });
});
