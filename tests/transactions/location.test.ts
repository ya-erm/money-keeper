import { expect, test } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';
import { getTransactionFormLocators, selectAccountAsync } from '@tests/transactions/utils';
import type { Page } from '@playwright/test';

const currentPosition = { latitude: 44.8176, longitude: 20.4633 };
const places = [
  { id: 'far', name: 'Far away', latitude: 48.8566, longitude: 2.3522 },
  { id: 'near', name: 'Near cafe', latitude: 44.8181, longitude: 20.4633 },
  { id: 'nearest', name: 'Nearest cafe', latitude: 44.8177, longitude: 20.4633 },
];

async function readStoredLocation(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ latitude: number; longitude: number } | null>((resolve, reject) => {
        const request = indexedDB.open('mk-2');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const rows = db.transaction('transactions', 'readonly').objectStore('transactions').getAll();
          rows.onerror = () => {
            db.close();
            reject(rows.error);
          };
          rows.onsuccess = () => {
            db.close();
            const operation = rows.result.find((item) => item.comment === 'Map location operation');
            resolve(operation ? { latitude: operation.locationLat, longitude: operation.locationLng } : null);
          };
        };
      }),
  );
}

test.describe('Operation locations', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(currentPosition);
    // Avoid requests to the community tile server from automated tests.
    await context.route('https://tile.openstreetmap.org/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    );
    await importMockDataAsync(page, JSON.stringify({ ...JSON.parse(mockData), knownPlaces: places }));
  });

  test('suggests nearby saved places on opening without assigning a location', async ({ page }) => {
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });
    await expect(page.locator('.nearby-places')).toContainText('Nearest cafe');
    await expect(page.locator('.location-value')).toHaveCount(0);
    const options = page.locator('.known-place-select optgroup').first().locator('option');
    await expect(options).toHaveText(['Nearest cafe', 'Near cafe']);
    await page.locator('.nearby-places').getByRole('button', { name: 'Nearest cafe', exact: true }).click();
    await expect(page.locator('.location-value')).toContainText('Nearest cafe');
  });

  test('preserves an existing operation location when suggesting nearby places', async ({ page }) => {
    const data = JSON.parse(mockData);
    const operation = data.operations.find((item: { comment: string }) => item.comment === 'Food for pets');
    operation.locationLat = 48.8566;
    operation.locationLng = 2.3522;
    await importMockDataAsync(page, JSON.stringify({ ...data, knownPlaces: places }));
    await page.goto(`/accounts?account-card=${operation.accountId}&operation-id=${operation.id}`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('.nearby-places')).toContainText('Nearest cafe');
    await expect(page.locator('.location-value')).toContainText('Far away');
    await expect(page.locator('.known-place-select')).toHaveValue('far');
  });

  test('saves a point selected on the map and can change it while editing', async ({ page }) => {
    await page.goto('/accounts', { waitUntil: 'networkidle' });
    await page.getByTestId('AddOperationButton').click();
    await expect(page.locator('.nearby-places')).toContainText('Nearest cafe');
    await page.getByRole('button', { name: 'Choose on map', exact: true }).click();
    const picker = page.getByTestId('LocationPicker');
    const map = page.getByTestId('LocationMap');
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(page.getByTestId('ConfirmLocationButton')).toBeDisabled();
    await map.click({ position: { x: 70, y: 150 } });
    await page.getByTestId('ConfirmLocationButton').click();
    await expect(picker).toHaveCount(0);

    const { typeSwitchInButton, categorySelect, amountInput, commentInput, createButton } =
      getTransactionFormLocators(page);
    await typeSwitchInButton.click();
    await categorySelect.getByRole('button').filter({ hasText: 'T_Work' }).click();
    await selectAccountAsync(page, 'DestinationAccountSelect', 'T_TST');
    await amountInput.fill('100');
    await commentInput.fill('Map location operation');
    await createButton.click();
    await page.waitForURL(/accounts\?account-card=/);
    await page.goto('/accounts?account-card=f6ddb1f2-d708-4ff4-bc0c-5d7df732aee6', { waitUntil: 'networkidle' });
    await expect
      .poll(() => readStoredLocation(page))
      .toMatchObject({ latitude: expect.any(Number), longitude: expect.any(Number) });
    const selected = await readStoredLocation(page);
    expect(selected?.latitude).not.toBe(currentPosition.latitude);
    expect(selected?.longitude).not.toBe(currentPosition.longitude);
    const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Map location operation' });
    await operation.click();
    await expect(page.getByTestId('SaveTransactionButton')).toBeVisible();
    await expect(page.locator('.location-value')).toContainText('Unnamed');

    await page.locator('.location-actions').getByRole('button', { name: 'On map', exact: true }).click();
    await expect(map).toHaveClass(/leaflet-container/);
    await map.click({ position: { x: 70, y: 150 } });
    await page.getByTestId('ConfirmLocationButton').click();
    await page.getByTestId('SaveTransactionButton').click();
    await expect(page.getByTestId('SaveTransactionButton')).toHaveCount(0);
    await expect.poll(() => readStoredLocation(page)).not.toEqual(selected);
    const edited = await readStoredLocation(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('TransactionListItem').filter({ hasText: 'Map location operation' }).click();
    expect(await readStoredLocation(page)).toEqual(edited);
    await expect(page.locator('.location-value')).toContainText('Unnamed');
  });

  test('edits a saved place on the map and preserves changes only after saving', async ({ page }) => {
    await page.goto('/settings/known-places', { waitUntil: 'networkidle' });
    const card = page.locator('.place-card').filter({ hasText: 'Far away' });
    await card.click();
    const modal = page.locator('.modal').filter({ visible: true });
    await expect(modal.locator('input[type="number"]')).toHaveCount(0);
    await expect(modal.getByRole('button', { name: 'Detect via GPS', exact: true, includeHidden: true })).toHaveClass(
      /white/,
    );
    const openMap = modal.getByRole('button', { name: 'On map', exact: true, includeHidden: true });
    await expect(openMap).toHaveClass(/white/);
    await openMap.click();
    const picker = page.getByTestId('LocationPicker');
    const map = page.getByTestId('LocationMap');
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(map.locator('.location-pin')).toBeVisible();
    await map.click({ position: { x: 70, y: 150 } });
    await picker.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(card).toContainText('48.856600, 2.352200');
    await openMap.click();
    await expect(map).toHaveClass(/leaflet-container/);
    await map.click({ position: { x: 70, y: 150 } });
    await page.getByTestId('ConfirmLocationButton').click();
    await expect(modal.getByRole('status', { includeHidden: true })).toHaveText('Location selected');
    await expect(card).toContainText('48.856600, 2.352200');
    await modal.getByRole('button', { name: 'Save', exact: true, includeHidden: true }).click();
    await expect(card).not.toContainText('48.856600, 2.352200');
    const savedText = await card.innerText();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(card).toHaveText(savedText);
  });
});
