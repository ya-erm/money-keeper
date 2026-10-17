import type { Page } from '@playwright/test';

import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';

async function getColumns(page: Page) {
  return Promise.all(
    [page.locator('.menu-bar'), page.getByTestId('PrimaryColumn'), page.getByTestId('DetailsColumn')].map(
      async (column) => {
        const box = await column.boundingBox();
        if (!box) throw new Error('Expected a visible layout column');
        return { x: box.x, width: box.width };
      },
    ),
  );
}

test.describe('Desktop columns', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('keeps the same columns across sections, subpages, and operation details', async ({ page }, testInfo) => {
    await importMockDataAsync(page);
    await openPathAsync(page);

    await expect(page.getByTestId('OperationDetails')).toBeVisible();
    const columns = await getColumns(page);
    expect(columns.map(({ width }) => width)).toEqual([240, 464, 464]);

    await page.getByTestId('AccountCard').filter({ hasText: 'T_TST' }).getByTestId('AccountName').click();
    const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Food for pets' });
    await operation.click();
    const details = page.getByTestId('DetailsColumn');
    await expect(details.getByTestId('TransactionForm')).toBeVisible();
    await expect(details.locator('input[name="comment"]')).toHaveValue('Food for pets');
    expect(await getColumns(page)).toEqual(columns);
    await page.screenshot({ path: testInfo.outputPath('desktop-operation.png') });

    await details.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(details.getByTestId('TransactionForm')).toHaveCount(0);
    expect(await getColumns(page)).toEqual(columns);

    await page.locator('.menu-bar a[href="/settings"]').click();
    await expect(details.getByText('Select a page on the left')).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);

    const primary = page.getByTestId('PrimaryColumn');
    await primary.locator('a[href="/settings/currency-rates"]').click();
    await expect(primary.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await expect(details.getByRole('heading', { name: 'Currency rates', exact: true })).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);
    await page.screenshot({ path: testInfo.outputPath('desktop-settings.png') });

    await primary.locator('a[href="/settings/known-places"]').click();
    await expect(details.getByTestId('AutoDetectLocationSetting')).toBeVisible();
    await expect(primary.locator('a[aria-current="page"]')).toHaveAttribute('href', '/settings/known-places');
    expect(await getColumns(page)).toEqual(columns);

    await page.locator('.menu-bar a[href="/analytics"]').click();
    await expect(details.getByText('Select a page on the left')).toBeVisible();
    await primary.locator('a[href="/analytics/categories"]').click();
    await expect(primary.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
    await expect(details.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);

    await page.locator('.menu-bar a[href="/categories"]').click();
    await expect(primary.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);

    await openPathAsync(page, '/transactions');
    await expect(details.getByTestId('OperationDetails')).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);
    await page.getByRole('link', { name: 'Create operation', exact: true }).click();
    await expect(details.getByTestId('CreateTransactionButton')).toBeVisible();
    expect(await getColumns(page)).toEqual(columns);
  });

  test('preserves single-column navigation below the desktop breakpoint', async ({ page }) => {
    await openPathAsync(page, '/settings/currency-rates');

    for (const width of [1200, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.getByTestId('DetailsColumn')).toBeVisible();
      expect((await getColumns(page)).map(({ width }) => width)).toEqual([240, 464, 464]);
    }

    for (const width of [1199, 768, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.getByTestId('DetailsColumn')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Currency rates', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toHaveCount(0);
      await expect(page.locator('.menu-bar')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }

    await page.locator('.menu-bar a[href="/accounts"]').click();
    await expect(page.getByTestId('DetailsColumn')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByTestId('OperationDetails')).toBeVisible();
  });
});
