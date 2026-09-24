import { type Page } from '@playwright/test';

import { mockData } from './mock';

export async function openPathAsync(page: Page, path = '/accounts') {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

export async function importMockDataAsync(page: Page, data = mockData) {
  await openPathAsync(page, '/settings/import-export');

  await page.getByTestId('ImportTextArea').fill(data);
  await page.getByTestId('ParseJsonButton').click();
  await page.getByTestId('AddToJournalButton').waitFor({ state: 'visible' });
  await page.getByTestId('AddToJournalButton').click();

  await page.getByTestId('ImportSuccessToast').waitFor({ state: 'visible' });
}
