import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page, Route } from '@playwright/test';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';
import { getTransactionFormLocators, selectAccountAsync } from '@tests/transactions/utils';

const sampleUrl = new URL('../../src/lib/receipts/fixtures/serbian-receipt.txt', import.meta.url);
const sample = readFileSync(sampleUrl, 'utf8').trim();
const unescaped = readFileSync(
  new URL('../../src/lib/receipts/fixtures/serbian-receipt-unescaped.txt', import.meta.url),
  'utf8',
).trim();
const photo = fileURLToPath(new URL('../../src/lib/receipts/fixtures/serbian-receipt.png', import.meta.url));
const receiptDetails = {
  merchant: 'LIDL SRBIJA KD',
  store: 'Prodavnica br. 0153',
  address: 'ТРОГИРСКА ПАДИНА 2',
  city: 'БЕОГРАД',
  taxId: '106884584',
  journal: 'LIDL SRBIJA KD\nCheese 1 × 525.70 RSD\n525.70 RSD',
  itemsAvailable: true,
  items: [{ name: 'Cheese', quantity: 1, unitPrice: 525.7, total: 525.7 }],
};

async function waitForStoredReceipt(page: Page, comment: string) {
  await expect
    .poll(() =>
      page.evaluate(async (savedComment) => {
        const request = indexedDB.open('mk-2');
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<boolean>((resolve, reject) => {
            const rows = db.transaction('transactions').objectStore('transactions').getAll();
            rows.onsuccess = () =>
              resolve(rows.result.some((item) => item.comment === savedComment && !!item.receiptUrl));
            rows.onerror = () => reject(rows.error);
          });
        } finally {
          db.close();
        }
      }, comment),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Denied in test', 'NotAllowedError');
      };
    }
  });
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.clock.setSystemTime('2026-10-17T11:30:00Z');
  await openPathAsync(page);
  const data = JSON.parse(mockData);
  data.accounts.push({ id: 'rsd-account', name: 'T_RSD', currency: 'RSD', icon: null });
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: 'Scan receipt QR', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Accounts', exact: true }).click();
  await page.getByTestId('AddOperationButton').click();
  await page.getByTestId('PurchaseContentsSection').getByRole('button', { name: 'Purchase contents Show' }).click();
  await page.getByTestId('ScanReceiptQrButton').click();
});

test('previews a link, fills an RSD operation and saves only after confirmation', async ({ page }) => {
  const { form, amountInput, dateInput, timeInput, categorySelect, commentInput, createButton } =
    getTransactionFormLocators(page);
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_RSD');
  await page.getByTestId('ScanReceiptQrButton').click();
  await expect(scanner.getByRole('button', { name: 'Read receipt', exact: true })).toHaveCount(0);
  await expect(scanner.getByRole('button', { name: 'Close', exact: true })).toHaveClass(/white/);
  await expect(scanner.getByRole('button', { name: 'Camera', exact: true }).locator('svg')).toHaveCount(1);
  await expect(scanner.getByRole('button', { name: 'Choose photo', exact: true }).locator('svg')).toHaveCount(1);
  await scanner.getByRole('textbox', { name: 'Receipt link' }).fill(sample);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525.70 RSD');
  await expect(page.getByTestId('ReceiptPreview')).toContainText('17.10.2026 12:56');
  await expect(page.getByTestId('ReceiptPreview')).not.toContainText('FTH7EX9W-FTH7EX9W-19890');
  await expect(page.getByTestId('ReceiptPreview').getByRole('link')).toHaveCount(0);
  await expect(scanner.getByRole('button', { name: 'Load another receipt', exact: true })).toBeVisible();
  await expect(scanner.getByRole('button', { name: 'Camera', exact: true })).toHaveCount(0);
  await expect(scanner.getByRole('button', { name: 'Choose photo', exact: true })).toHaveCount(0);
  await expect(scanner.locator('input[name="receipt-link"]')).toHaveCount(0);
  await expect(scanner.getByRole('button', { name: 'Read receipt', exact: true })).toHaveCount(0);
  await expect(amountInput).toHaveValue('');
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_RSD');
  await categorySelect.getByRole('button', { name: 'T_Shop' }).click();
  await expect(amountInput).toHaveValue('525.7');
  await expect(dateInput).toHaveValue('2026-10-17');
  await expect(timeInput).toHaveValue('12:56');
  await expect(form.getByTestId('ReceiptUrlInput')).toHaveValue(sample);
  await expect(form.getByTestId('DescriptionInput')).toHaveValue('');
  await expect(form.locator('input[name="destinationAmount"]')).toHaveCount(0);
  await commentInput.fill('Scanned Serbian receipt');
  await createButton.click();
  await page.waitForURL(/\/accounts(?:\?|$)/);
  await waitForStoredReceipt(page, 'Scanned Serbian receipt');
  await page.goto('/transactions');
  const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Scanned Serbian receipt' });
  await expect(operation).toBeVisible();
  await operation.click();
  await expect(page.locator('input[name="amount"]')).toHaveValue('525.7');
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue(sample);
  await expect(page.getByTestId('ScanReceiptButton')).toHaveCount(0);
});

test('can load another receipt after a successful read', async ({ page }) => {
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await scanner.getByRole('button', { name: 'Load another receipt', exact: true }).click();
  await expect(page.getByTestId('ReceiptPreview')).toHaveCount(0);
  await expect(scanner.locator('input[name="receipt-link"]')).toHaveValue('');
  await expect(scanner.getByRole('button', { name: 'Read receipt', exact: true })).toHaveCount(0);
  await page.getByTestId('ReceiptPhotoInput').setInputFiles(photo);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525.70 RSD');
});

test('reads and saves an unescaped fiscal QR link without losing plus signs', async ({ page }) => {
  const scanner = page.getByTestId('ReceiptScanner');
  let requestedUrl = '';
  await page.route('**/api/receipts/serbia', async (route) => {
    requestedUrl = route.request().postDataJSON().url;
    await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  await scanner.locator('input[name="receipt-link"]').fill(unescaped);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('2,055.00 RSD');
  await expect.poll(() => requestedUrl).toContain('%2B');
  expect(new URL(requestedUrl).searchParams.get('vl')).not.toContain(' ');
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue(requestedUrl);
  await expect(page.locator('input[name="destinationAmount"]')).toHaveValue('2055');
});

test('opens the receipt scanner from purchase contents in a regular operation form', async ({ page }) => {
  await page.goto('/transactions/create');
  await expect(page.getByTestId('PurchaseContentsSection')).toBeVisible();
  await page.getByTestId('PurchaseContentsSection').getByRole('button', { name: 'Purchase contents Show' }).click();
  await expect(page.locator('form').getByText('(optional)', { exact: true })).toHaveCount(0);
  await page.getByTestId('ScanReceiptQrButton').click();
  await expect(page.getByTestId('ReceiptScanner')).toBeVisible();
});

test('loads store and items into separate receipt fields and preserves them after saving and editing', async ({
  page,
}) => {
  await page.route('**/api/receipts/serbia', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ url: sample });
    await route.fulfill({ json: receiptDetails });
  });
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_RSD');
  await page.getByTestId('ScanReceiptQrButton').click();
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('LIDL SRBIJA KD');
  await expect(page.getByTestId('ReceiptPreview')).toContainText('Cheese');
  await expect(page.getByTestId('ReceiptJournal')).toBeVisible();
  await expect(page.getByTestId('ReceiptJournal')).toHaveText(receiptDetails.journal);
  await expect(page.getByTestId('ReceiptPreview').locator('strong, li, details')).toHaveCount(0);
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(page.getByTestId('ReceiptScanner')).toHaveCount(0);
  await expect(page.locator('input[name="comment"]')).toHaveValue('LIDL SRBIJA KD');
  const contents = page.getByTestId('PurchaseContentsSection');
  await contents.getByRole('button', { name: 'Purchase contents Hide' }).click();
  await expect(page.getByTestId('ReceiptUrlInput')).not.toBeVisible();
  await contents.getByRole('button', { name: 'Purchase contents Show' }).click();
  await expect(page.getByTestId('ReceiptUrlInput')).toBeVisible();
  await expect(page.getByTestId('OpenReceiptButton')).toBeVisible();
  await page.getByTestId('ReceiptUrlInput.ClearButton').click();
  await expect(page.getByTestId('OpenReceiptButton')).toHaveCount(0);
  await page.getByTestId('ScanReceiptQrButton').click();
  await expect(scanner).toBeVisible();
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(scanner).toHaveCount(0);
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue('');
  await page.getByTestId('ReceiptUrlInput').fill(sample);
  await expect(page.getByTestId('ScanReceiptQrButton')).toHaveCount(0);
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue(sample);
  await expect(page.getByTestId('PurchaseItemName')).toHaveValue('Cheese');
  await expect(page.getByTestId('PurchaseItemQuantity')).toHaveValue('1');
  await expect(page.getByTestId('PurchaseItemUnitPrice')).toHaveValue('525.7');
  await expect(page.getByTestId('PurchaseItemTotal')).toHaveValue('525.7');
  const purchaseTotal = page.getByTestId('PurchaseItemsTotal');
  await expect(purchaseTotal).toHaveText('Total: 525.70 RSD');
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_USD');
  await expect(purchaseTotal).toHaveText('Total: 525.70 USD');
  await page.getByRole('button', { name: 'Another currency', exact: true }).click();
  await page.locator('input[name="another-currency"]').fill('EUR');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(purchaseTotal).toHaveText('Total: 525.70 EUR');
  await page.getByRole('button', { name: 'Same currency', exact: true }).click();
  await expect(purchaseTotal).toHaveText('Total: 525.70 USD');
  await expect(page.getByTestId('DescriptionInput')).toHaveValue('');
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_RSD');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop' }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await page.waitForURL(/\/accounts(?:\?|$)/);
  await waitForStoredReceipt(page, 'LIDL SRBIJA KD');
  await page.goto('/transactions');
  await page.getByTestId('TransactionListItem').filter({ hasText: 'LIDL SRBIJA KD' }).click();
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue(sample);
  await expect(page.getByTestId('PurchaseItemName')).toHaveValue('Cheese');
  await page
    .getByTestId('PurchaseContentsSection')
    .getByRole('button', { name: /Purchase contents/ })
    .click();
  await page.getByTestId('PurchaseItemName').fill('Edited cheese');
  await page.getByTestId('PurchaseItemQuantity').fill('0.375');
  expect(
    await page.getByTestId('PurchaseItemQuantity').evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(true);
  await page.getByTestId('PurchaseItemQuantity').press('ArrowUp');
  await expect(page.getByTestId('PurchaseItemQuantity')).toHaveValue('1.375');
  await page.getByTestId('PurchaseItemQuantity').press('ArrowDown');
  await expect(page.getByTestId('PurchaseItemQuantity')).toHaveValue('0.375');
  await page.getByTestId('PurchaseItemQuantity').fill('2');
  await page.getByTestId('PurchaseItemUnitPrice').fill('10');
  await expect(page.getByTestId('PurchaseItemTotal')).toHaveValue('20');
  await page.getByTestId('SaveTransactionButton').click();
  await page.getByTestId('TransactionListItem').filter({ hasText: 'LIDL SRBIJA KD' }).click();
  await expect(page.getByTestId('PurchaseItemName')).toHaveValue('Edited cheese');
  await expect(page.getByTestId('PurchaseItemQuantity')).toHaveValue('2');
  await expect(page.getByTestId('PurchaseItemUnitPrice')).toHaveValue('10');
  await expect(page.getByTestId('PurchaseItemTotal')).toHaveValue('20');
  await page
    .getByTestId('PurchaseContentsSection')
    .getByRole('button', { name: /Purchase contents/ })
    .click();
  await expect(page.getByTestId('PurchaseItemName')).not.toBeVisible();
  await page
    .getByTestId('PurchaseContentsSection')
    .getByRole('button', { name: /Purchase contents/ })
    .click();
  await expect(page.getByTestId('PurchaseItemName')).toBeVisible();
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(page.getByTestId('PurchaseItem')).toHaveCount(2);
  await expect(page.getByTestId('PurchaseItemUnitPrice').nth(1)).toHaveValue('');
  await page
    .getByTestId('PurchaseContentsSection')
    .getByRole('button', { name: /Purchase contents/ })
    .click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('PurchaseItemName').nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Remove item', exact: true }).nth(1).click();
  await expect(page.getByTestId('PurchaseItem')).toHaveCount(1);
});

test('automatically loads details and allows retry after a network failure', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/receipts/serbia', (route) => {
    attempts++;
    return attempts === 1 ? route.abort('internetdisconnected') : route.fulfill({ json: receiptDetails });
  });
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await expect(scanner.getByRole('status')).toHaveText('Could not load the item list');
  await expect(scanner.getByRole('status')).toHaveCSS('text-align', 'center');
  await expect(scanner.getByRole('button', { name: 'Fill operation', exact: true })).toBeEnabled();
  expect(attempts).toBe(1);
  await scanner.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(page.getByTestId('ReceiptPreview')).toContainText('LIDL SRBIJA KD');
  await expect(page.getByTestId('ReceiptPreview')).toContainText('Cheese');
  await expect(scanner.getByRole('button', { name: 'Retry loading', exact: true })).toHaveCount(0);
  expect(attempts).toBe(2);
});

test('can continue while the details request is still pending', async ({ page }) => {
  const pending: { route?: Route } = {};
  await page.route('**/api/receipts/serbia', (route) => {
    pending.route = route;
  });
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await expect(scanner.getByRole('status')).toHaveText('Loading receipt details…');
  await expect(scanner.getByRole('button', { name: 'Fill operation', exact: true })).toBeEnabled();
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(page.getByTestId('ReceiptUrlInput')).toHaveValue(sample);
  await expect(page.locator('input[name="destinationAmount"]')).toHaveValue('525.7');
  await expect(page.getByTestId('PurchaseItem')).toHaveCount(0);
  await pending.route?.abort().catch(() => {});
});

test('can retry when the store loaded but the items are unavailable', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/receipts/serbia', (route) => {
    attempts++;
    return route.fulfill({
      json: attempts === 1 ? { ...receiptDetails, items: [], itemsAvailable: false } : receiptDetails,
    });
  });
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('LIDL SRBIJA KD');
  await expect(scanner.getByRole('status')).toHaveText('Could not load the item list');
  await expect(scanner.getByRole('status')).toHaveCSS('text-align', 'center');
  await expect(scanner.getByRole('button', { name: 'Fill operation', exact: true })).toBeEnabled();
  await scanner.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(scanner.getByRole('button', { name: 'Retry loading', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('ReceiptJournal')).toBeVisible();
});

test('scans a QR video frame and stops the camera after reading it', async ({ page }) => {
  await page.evaluate(
    async (dataUrl) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1000;
      canvas.getContext('2d')?.drawImage(image, 0, 0, 1000, 1000);
      const stream = canvas.captureStream(5);
      Object.assign(window, { receiptTestStream: stream });
      navigator.mediaDevices.getUserMedia = async () => stream;
    },
    `data:image/png;base64,${readFileSync(photo).toString('base64')}`,
  );
  await page.getByTestId('ReceiptScanner').getByRole('button', { name: 'Camera', exact: true }).click();
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525.70 RSD');
  expect(
    await page.evaluate(
      () => (window as unknown as { receiptTestStream: MediaStream }).receiptTestStream.getTracks()[0].readyState,
    ),
  ).toBe('ended');
});

test('starts the camera automatically without shifting the reserved square preview', async ({ page }, testInfo) => {
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(scanner).toHaveCount(0);
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    const stream = canvas.captureStream(5);
    const timer = setInterval(() => context.fillRect(0, 0, 600, 1000), 100);
    Object.assign(window, { receiptTestStream: stream, receiptTestTimer: timer });
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((resolve) => {
        Object.assign(window, { grantReceiptCamera: () => resolve(stream) });
      });
  });
  await page.getByTestId('ScanReceiptQrButton').click();
  const preview = page.getByTestId('ReceiptCameraPreview');
  await expect(preview).toBeVisible();
  const bounds = await preview.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.width - bounds!.height)).toBeLessThan(1);
  const link = scanner.locator('input[name="receipt-link"]');
  const linkBefore = await link.boundingBox();
  await expect(scanner.getByRole('button', { name: 'Choose photo', exact: true })).toBeEnabled();
  await expect(link).toBeEnabled();
  await expect(scanner.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { grantReceiptCamera: () => void }).grantReceiptCamera());
  const video = scanner.locator('video');
  await expect(video).toHaveCSS('opacity', '1');
  expect(await preview.boundingBox()).toEqual(bounds);
  expect(await video.boundingBox()).toEqual(bounds);
  expect(await link.boundingBox()).toEqual(linkBefore);
  await expect(video).toHaveCSS('object-fit', 'cover');
  await page.screenshot({ path: testInfo.outputPath('camera-preview.png') });
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(scanner).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { receiptTestStream: MediaStream }).receiptTestStream.getTracks()[0].readyState,
    ),
  ).toBe('ended');
  await page.evaluate(() => clearInterval((window as unknown as { receiptTestTimer: number }).receiptTestTimer));
});

test('reads a real QR image and resolves RSD when the account is selected afterwards', async ({ page }) => {
  await page.goto('/transactions/create?scan-receipt=1', { waitUntil: 'networkidle' });
  await page.getByTestId('ReceiptPhotoInput').setInputFiles(photo);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525.70 RSD');
  await page.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(page.locator('input[name="amount"]')).toHaveValue('');
  await expect(page.locator('input[name="destinationAmount"]')).toHaveValue('525.7');
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_RSD');
  await expect(page.locator('input[name="amount"]')).toHaveValue('525.7');
  await expect(page.locator('input[name="destinationAmount"]')).toHaveCount(0);
});

test('preserves the RSD amount for a foreign currency account and does not guess a conversion', async ({ page }) => {
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(sample);
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await selectAccountAsync(page, 'SourceAccountSelect', 'T_USD');
  await expect(page.locator('input[name="amount"]')).toHaveValue('');
  await expect(page.locator('input[name="destinationAmount"]')).toHaveValue('525.7');
});

test('shows errors and leaves the form unchanged when cancelled', async ({ page }) => {
  const amount = page.locator('input[name="amount"]');
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill('https://example.com/');
  await expect(scanner.getByRole('alert')).toContainText('Only Serbian fiscal receipt');
  await expect(page.getByTestId('ReceiptPreview')).toHaveCount(0);
  await scanner.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(scanner.locator('input[name="receipt-link"]')).toHaveValue('');
  await expect(scanner.getByRole('alert')).toHaveCount(0);
  await scanner.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(amount).toHaveValue('');
});

test('clearing a link cancels its pending read and allows another link', async ({ page }) => {
  const scanner = page.getByTestId('ReceiptScanner');
  const input = scanner.locator('input[name="receipt-link"]');
  await input.fill('https://example.com/');
  await scanner.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(input).toHaveValue('');
  await input.fill(sample);
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525.70 RSD');
  await expect(scanner.getByRole('alert')).toHaveCount(0);
});

test('handles camera denial and offers link input', async ({ page }) => {
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    };
  });
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.getByRole('button', { name: 'Camera', exact: true }).click();
  await expect(scanner.getByRole('alert')).toContainText('Could not start the camera');
  await expect(scanner.locator('input[name="receipt-link"]')).toBeEnabled();
});

test('releases a camera stream granted after the scanner was closed', async ({ page }) => {
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 100;
    const stream = canvas.captureStream();
    Object.assign(window, { receiptTestStream: stream });
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((resolve) => {
        Object.assign(window, { grantReceiptCamera: () => resolve(stream) });
      });
  });
  await page.getByTestId('ReceiptScanner').getByRole('button', { name: 'Camera', exact: true }).click();
  await page.getByTestId('ReceiptScanner').getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(() => (window as unknown as { grantReceiptCamera: () => void }).grantReceiptCamera());
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { receiptTestStream: MediaStream }).receiptTestStream.getTracks()[0].readyState,
      ),
    )
    .toBe('ended');
});
