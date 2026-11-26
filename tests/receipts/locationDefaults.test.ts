import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Transaction } from '#lib/data/interfaces.js';
import type { ReceiptDetails } from '#lib/receipts/serbianReceipt.js';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';

const receiptUrl = readFileSync(
  new URL('../../src/lib/receipts/fixtures/serbian-receipt.txt', import.meta.url),
  'utf8',
).trim();
const address = 'Test Street 12, Novi Sad';
const place = { id: 'shop', name: 'Test shop', latitude: 45.2671, longitude: 19.8335 };
const otherPlace = { id: 'other', name: 'Other place', latitude: 44.8176, longitude: 20.4633 };
const categoryId = '0a6e4a28-93cf-42a3-be3a-6d6cc9b2da56';
test.setTimeout(60000);
const details: ReceiptDetails = {
  merchant: 'Test merchant',
  store: 'Test branch',
  address: ' Test Street 12 ',
  city: ' Novi Sad ',
  taxId: '',
  journal: 'Test merchant\nTest Street 12\nNovi Sad',
  items: [],
  itemsAvailable: true,
};

const operation = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'previous-receipt',
  accountId: 'receipt-account',
  categoryId,
  date: '2026-10-01T12:00:00Z',
  amount: 100,
  comment: 'Previous purchase',
  receiptUrl,
  receiptAddress: address,
  locationLat: place.latitude,
  locationLng: place.longitude,
  ...overrides,
});

async function seed(page: Page, operations: Transaction[] = []) {
  const data = JSON.parse(mockData);
  data.accounts.push({ id: 'receipt-account', name: 'T_RSD', currency: 'RSD' });
  data.operations = operations;
  data.knownPlaces = [place, otherPlace];
  await importMockDataAsync(page, JSON.stringify(data));
}

async function openForm(page: Page, id?: string) {
  await page.goto(id ? `/transactions/edit?id=${id}` : '/transactions/create?accountId=receipt-account', {
    waitUntil: 'networkidle',
  });
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
}

async function scan(page: Page, receiptDetails = details) {
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: receiptDetails }));
  const contents = page.getByTestId('PurchaseContentsSection');
  const url = page.getByTestId('ReceiptUrlInput');
  if (!(await url.isVisible())) await contents.getByRole('button', { name: /Purchase contents/ }).click();
  if (await url.inputValue()) await page.getByTestId('ReceiptUrlInput.ClearButton').click();
  await page.getByTestId('ScanReceiptQrButton').click();
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(receiptUrl);
  await expect(page.getByTestId('ReceiptJournal')).toHaveText(receiptDetails.journal);
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(scanner).toHaveCount(0);
}

async function exportData(page: Page) {
  await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  await page.getByTestId('ShowExportTextAreaButton').click();
  return JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
}

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime('2026-11-26T12:00:00Z');
  await page.addInitScript(() => {
    if (navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Denied in test', 'NotAllowedError');
      };
  });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
});

test('learns a receipt address through save, edit, copy and JSON import, then reuses its location', async ({
  page,
}, testInfo) => {
  await seed(page);
  await openForm(page);
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
  await page.getByTestId('KnownPlaceSelect').click();
  await page.getByRole('menuitem', { name: place.name, exact: true }).click();
  await page.locator('[name=comment]').fill('First receipt location');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  const data = await exportData(page);
  const saved = data.operations.find((item: Transaction) => item.comment === 'First receipt location');
  expect(saved).toMatchObject({ receiptAddress: address, locationLat: place.latitude, locationLng: place.longitude });

  await openForm(page, saved.id);
  await page.locator('[name=comment]').fill('Edited receipt location');
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  const edited = (await exportData(page)).operations.find((item: Transaction) => item.id === saved.id);
  expect(edited.receiptAddress).toBe(address);
  await page.goto('/accounts?account-card=receipt-account', { waitUntil: 'networkidle' });
  const row = page.getByTestId('TransactionListItem').filter({ hasText: 'Edited receipt location' });
  await row.dispatchEvent('pointerdown');
  await expect(page.getByRole('button', { name: 'Duplicate', exact: true })).toBeVisible();
  await row.dispatchEvent('pointerup');
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  const copied = (await exportData(page)).operations.filter(
    (item: Transaction) => item.comment === 'Edited receipt location',
  );
  expect(copied).toHaveLength(2);
  expect(copied.every((item: Transaction) => item.receiptAddress === address)).toBe(true);

  // Only the imported receipt can supply the next location.
  const importedAddress = 'Import Street 99, Novi Sad';
  data.operations = [{ ...edited, id: 'imported-receipt-location', receiptAddress: importedAddress }];
  await importMockDataAsync(page, JSON.stringify(data));
  await openForm(page);
  await scan(page, { ...details, address: 'Import Street 99' });
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await page.getByTestId('KnownPlaceSelect').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('receipt-location-390px.png') });
  await expect(page.locator('[name=receiptAddress]')).toHaveCount(0);
  await page.locator('[name=comment]').fill('Automatically located receipt');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await page.reload({ waitUntil: 'networkidle' });
  const final = (await exportData(page)).operations.find(
    (item: Transaction) => item.comment === 'Automatically located receipt',
  );
  expect(final).toMatchObject({
    receiptAddress: importedAddress,
    locationLat: place.latitude,
    locationLng: place.longitude,
  });
});

test('matches only the active workspace and exact address, skipping newer records without a location', async ({
  page,
}) => {
  await seed(page, [
    operation(),
    operation({ id: 'without-position', date: '2026-10-02T12:00:00Z', locationLat: undefined, locationLng: undefined }),
    operation({
      id: 'another-city',
      date: '2026-10-03T12:00:00Z',
      receiptAddress: 'Test Street 12, Belgrade',
      locationLat: otherPlace.latitude,
      locationLng: otherPlace.longitude,
    }),
  ]);
  await page.evaluate(
    async (foreign) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('mk-2');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('transactions', 'readwrite');
          tx.objectStore('transactions').put({ ...foreign, owner: 'other-workspace' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    operation({
      id: 'foreign',
      date: '2026-10-04T12:00:00Z',
      locationLat: otherPlace.latitude,
      locationLng: otherPlace.longitude,
    }),
  );
  await openForm(page);
  await scan(page, { ...details, address: 'test\tSTREET 12', city: 'NOVI SAD' });
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await page.getByRole('button', { name: 'Edit location', exact: true }).click();
  await expect(page.getByTestId('LocationCoordinates')).toContainText('(45.2671, 19.8335)');
});

test('preserves explicit place selection and clearing across repeated scans and editing', async ({ page }) => {
  await seed(page, [operation()]);
  await openForm(page);
  await page.getByTestId('KnownPlaceSelect').click();
  await page.getByRole('menuitem', { name: otherPlace.name, exact: true }).click();
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(otherPlace.name);
  await page.getByTestId('RemoveLocationButton').click();
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
  await openForm(page, 'previous-receipt');
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
});

test('removes an earlier receipt suggestion when another branch or an unavailable receipt has no match', async ({
  page,
}) => {
  await seed(page, [operation()]);
  await openForm(page);
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await scan(page, { ...details, address: 'Unknown street 7' });
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await scan(page, { ...details, address: '', city: '' });
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
});

test('clears hidden address metadata when the receipt link is replaced manually', async ({ page }) => {
  await seed(page, [operation()]);
  await openForm(page, 'previous-receipt');
  const contents = page.getByTestId('PurchaseContentsSection');
  await contents.getByRole('button', { name: /Purchase contents/ }).click();
  await page.getByTestId('ReceiptUrlInput').fill('https://example.com/another-receipt');
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  const saved = (await exportData(page)).operations.find((item: Transaction) => item.id === 'previous-receipt');
  expect(saved).not.toHaveProperty('receiptAddress');
  expect(saved).toMatchObject({ locationLat: place.latitude, locationLng: place.longitude });
});

test('a delayed automatic GPS result cannot overwrite a receipt location', async ({ page }) => {
  await seed(page, [operation()]);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mk-2');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('memberSettings', 'readwrite');
        const store = tx.objectStore('memberSettings');
        const request = store.get('guest');
        request.onsuccess = () => store.put({ ...request.result, owner: 'guest', autoDetectLocation: true });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  });
  await page.addInitScript((position) => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          window.addEventListener(
            'task4-gps-result',
            () => success({ coords: position } as unknown as GeolocationPosition),
            {
              once: true,
            },
          );
        },
      },
    });
  }, otherPlace);
  await openForm(page);
  await expect(page.getByTestId('DetectLocationButton')).toBeDisabled();
  await scan(page);
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await page.evaluate(() => window.dispatchEvent(new Event('task4-gps-result')));
  await expect(page.getByTestId('KnownPlaceSelect')).toContainText(place.name);
  await expect(page.getByTestId('RemoveLocationButton')).toBeVisible();
});
