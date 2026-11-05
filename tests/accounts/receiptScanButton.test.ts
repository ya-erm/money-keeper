import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Account, Transaction } from '#lib/data/interfaces.js';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';

const accountId = 'qr-scan-account';
const otherAccountId = 'other-account';
const accountName = 'Receipt account';
const preferenceLabel = 'Show QR code scan button';
const receiptUrl = readFileSync(
  new URL('../../src/lib/receipts/fixtures/serbian-receipt.txt', import.meta.url),
  'utf8',
).trim();
const receiptDetails = {
  merchant: 'LIDL SRBIJA KD',
  store: 'Test branch',
  address: 'Test address',
  city: 'Test city',
  taxId: '000000001',
  journal: 'LIDL SRBIJA KD\nTest receipt',
  items: [{ name: 'Test item', quantity: 1, unitPrice: 525.7, total: 525.7 }],
  itemsAvailable: true,
};

async function openReadyPath(page: Page, path: string) {
  await openPathAsync(page, path);
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.locator('#app-content')).not.toHaveAttribute('inert', '');
}

async function seed(page: Page, enabled?: boolean) {
  const data = JSON.parse(mockData);
  data.accounts = [
    { id: accountId, name: accountName, currency: 'RSD', showReceiptScanButton: enabled },
    { id: otherAccountId, name: 'Other account', currency: 'EUR' },
  ];
  data.operations = [];
  await importMockDataAsync(page, JSON.stringify(data));
  await openReadyPath(page, `/accounts?account-card=${accountId}`);
}

async function openAccountOptions(page: Page) {
  await page
    .getByTestId('AccountCard')
    .filter({ hasText: accountName })
    .getByRole('button', { name: 'Additional options', exact: true })
    .click();
}

async function editAccount(page: Page) {
  await openAccountOptions(page);
  await page.locator('.modal').getByText('Edit', { exact: true }).click();
  return page.getByTestId('AccountForm');
}

async function storedRows<T>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(async (store) => {
    const request = indexedDB.open('mk-2');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<T[]>((resolve, reject) => {
        const rows = db.transaction(store).objectStore(store).getAll();
        rows.onsuccess = () => resolve(rows.result);
        rows.onerror = () => reject(rows.error);
      });
    } finally {
      db.close();
    }
  }, store);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime('2026-11-05T12:00:00Z');
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Denied in test', 'NotAllowedError');
      };
    }
  });
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: receiptDetails }));
  await openReadyPath(page, '/accounts');
});

test('defaults to hidden and saves the preference independently for each account', async ({ page }) => {
  await seed(page);
  const shortcut = page.getByTestId('AccountScanReceiptButton');
  await expect(shortcut).toHaveCount(0);
  let form = await editAccount(page);
  await expect(form.getByLabel(preferenceLabel)).not.toBeChecked();
  await form.getByLabel(preferenceLabel).check();
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toHaveText('QR code');
  await expect(shortcut.locator('svg')).toHaveCount(1);
  await expect(shortcut).toHaveAttribute('href', `/transactions/create?accountId=${accountId}&scan-receipt=1`);
  const qrBox = await shortcut.boundingBox();
  const addBox = await page.getByTestId('AddOperationButton').boundingBox();
  expect(qrBox!.x + qrBox!.width).toBeLessThan(addBox!.x);

  await page.reload();
  await expect(shortcut).toBeVisible();
  form = await editAccount(page);
  await expect(form.getByLabel(preferenceLabel)).toBeChecked();
  await form.getByLabel(preferenceLabel).uncheck();
  await page.keyboard.press('Escape');
  await expect(form).toHaveCount(0);
  await expect(shortcut).toBeVisible();

  // The balance-visibility action writes a complete account, so it must retain this preference.
  await openAccountOptions(page);
  await page.locator('.modal').getByText('Hide amount', { exact: true }).click();
  await expect(shortcut).toBeVisible();
  await expect
    .poll(async () => (await storedRows<Account>(page, 'accounts')).find((a) => a.id === accountId))
    .toMatchObject({ showReceiptScanButton: true, hideBalance: true });
  await page.reload();
  await expect(shortcut).toBeVisible();

  await openReadyPath(page, `/accounts?account-card=${otherAccountId}`);
  await expect(shortcut).toHaveCount(0);
  await openReadyPath(page, `/accounts?account-card=${accountId}`);
  form = await editAccount(page);
  await form.getByLabel(preferenceLabel).uncheck();
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);
  await expect(shortcut).toHaveCount(0);
  await page.reload();
  await expect(shortcut).toHaveCount(0);
});

test('can enable the shortcut when creating an account and retains it in JSON export', async ({ page }) => {
  await openReadyPath(page, '/accounts?action=create');
  const form = page.getByTestId('AccountForm');
  await expect(form.getByLabel(preferenceLabel)).not.toBeChecked();
  await form.locator('input[name="name"]').fill(accountName);
  await form.locator('input[name="currency"]').fill('RSD');
  await form.getByLabel(preferenceLabel).check();
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('AccountScanReceiptButton')).toBeVisible();
  await openReadyPath(page, '/settings/import-export');
  await page.getByText('Show', { exact: true }).click();
  const exported = JSON.parse(await page.locator('textarea').nth(1).inputValue());
  expect(exported.accounts).toEqual([expect.objectContaining({ name: accountName, showReceiptScanButton: true })]);
});

for (const width of [390, 1440]) {
  test(`opens the scanner with the selected account and saves the reviewed operation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, true);
    await page.getByTestId('AccountScanReceiptButton').click();
    const scanner = page.getByTestId('ReceiptScanner');
    await expect(scanner).toBeVisible();
    await expect(page.locator('input[name="accountId"]')).toHaveValue(accountId);
    await scanner.getByRole('textbox', { name: 'Receipt link' }).fill(receiptUrl);
    await expect(page.getByTestId('ReceiptPreview')).toContainText(receiptDetails.merchant);
    await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
    await expect(scanner).toHaveCount(0);
    await expect(page.locator('input[name="amount"]')).toHaveValue('525.7');
    expect(await storedRows<Transaction>(page, 'transactions')).toEqual([]);
    await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
    await page.getByTestId('CreateTransactionButton').click();
    await expect(page).toHaveURL(new RegExp(`/accounts\\?account-card=${accountId}$`));
    await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
    await expect
      .poll(() => storedRows<Transaction>(page, 'transactions'))
      .toEqual([
        expect.objectContaining({
          accountId,
          amount: 525.7,
          receiptUrl,
          receiptOrganizationName: receiptDetails.merchant,
        }),
      ]);
    await expect(page.getByTestId('AccountScanReceiptButton')).toBeVisible();
  });

  test(`supports close, repeated clicks and browser back/forward without saving at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, true);
    const scanner = page.getByTestId('ReceiptScanner');
    await page.getByTestId('AccountScanReceiptButton').click({ clickCount: 2 });
    await expect(scanner).toHaveCount(1);
    await scanner.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(scanner).toHaveCount(0);
    await expect(page.getByTestId('TransactionForm')).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByTestId('AccountScanReceiptButton')).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/scan-receipt=1/);
    await expect(scanner).toBeVisible();
    await page.goBack();
    await expect(scanner).toHaveCount(0);
    await page.getByTestId('AccountScanReceiptButton').click();
    await expect(scanner).toBeVisible();
    await page.goBack();
    await page.getByTestId('AddOperationButton').click();
    await expect(page.getByTestId('TransactionForm')).toBeVisible();
    await expect(scanner).toHaveCount(0);
    expect(await storedRows<Transaction>(page, 'transactions')).toEqual([]);
  });
}

test('keeps the Russian QR shortcut and Add button visible on a narrow phone', async ({ page, context }) => {
  await seed(page, true);
  await context.addCookies([{ name: 'locale', value: 'ru-RU', url: 'http://127.0.0.1:4173' }]);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.reload();
  await expect(page.getByTestId('AccountScanReceiptButton')).toHaveText('QR код');
  await expect(page.getByTestId('AddOperationButton')).toHaveText('Добавить');
  for (const id of ['AccountScanReceiptButton', 'AddOperationButton']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await expect(page).toHaveScreenshot('qr-shortcut-ru-narrow.png');
});
