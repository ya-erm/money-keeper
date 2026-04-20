import { type Page } from '@playwright/test';

import { mockData } from './mock';

export async function openPathAsync(page: Page, path = '/accounts') {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

export async function importMockDataAsync(page: Page) {
  await openPathAsync(page, '/settings/import-export');

  await page.getByTestId('ImportTextArea').fill(mockData);
  await page.getByTestId('ParseJsonButton').click();
  await page.getByTestId('AddToJournalButton').waitFor({ state: 'visible' });
  await page.getByTestId('AddToJournalButton').click();

  await page.getByTestId('ImportSuccessToast').waitFor({ state: 'visible' });
}
