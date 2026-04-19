import { expect, type Page } from '@playwright/test';

import { mockData } from './mock';

export async function openGuestAppAsync(page: Page, path = '/accounts') {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

export async function importMockDataAsync(page: Page) {
  await openGuestAppAsync(page, '/settings/import-export');

  await page.getByTestId('ImportTextArea').fill(mockData);
  await page.getByTestId('ParseJsonButton').click();
  await page.getByTestId('AddToJournalButton').waitFor({ state: 'visible' });
  await page.getByTestId('AddToJournalButton').click();

  await page.getByTestId('ImportSuccessToast').waitFor({ state: 'visible' });
}

export async function selectAccountAsync(page: Page, testId: string, accountName: string) {
  const select = page.getByTestId(testId);
  await select.getByRole('button').click();
  await page.getByTestId(`${testId}.Portal`).getByRole('button').filter({ hasText: accountName }).click();
}

export async function assertTransactionVisibleAsync(page: Page, comment: string) {
  const item = page.getByTestId('TransactionListItem').filter({ hasText: comment });
  await expect(item).toBeVisible();
}

export async function assertTransactionNotVisibleAsync(page: Page, comment: string) {
  const item = page.getByTestId('TransactionListItem').filter({ hasText: comment });
  await expect(item).toHaveCount(0);
}
