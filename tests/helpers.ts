import { expect, type Page } from '@playwright/test';

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

/** Keyboard sorting starts after the toolbar transition has finished moving focusable controls. */
export async function moveSortItemUp(page: Page, listId: string, id: string) {
  const rows = page.getByTestId(listId).locator(':scope > li');
  const item = page.getByTestId(listId).locator(`:scope > li[data-id="${id}"]`);
  await expect(item).toHaveAttribute('tabindex', '0');
  await expect
    .poll(() =>
      page
        .getByTestId('SortingToolbar')
        .evaluate(
          (element) =>
            element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length,
        ),
    )
    .toBe(0);
  await item.focus();
  await expect(item).toBeFocused();
  await item.press('Space');
  await item.press('ArrowUp');
  await expect(rows.first()).toHaveAttribute('data-id', id);
  await item.press('Space');
}
