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
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
    await expect(page.getByTestId('RemoveLocationButton')).toHaveCount(0);
    await page.getByTestId('KnownPlaceSelect').click();
    const options = page.getByRole('group', { name: 'Nearby', exact: true }).getByRole('menuitem');
    await expect(options).toHaveText(['Nearest cafe', 'Near cafe']);
    await options.filter({ hasText: 'Nearest cafe' }).click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Nearest cafe');
    await expect(page.getByRole('button', { name: 'Edit location', exact: true })).toBeVisible();
    await page.getByTestId('RemoveLocationButton').click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
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
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Far away');
    await page.getByRole('button', { name: 'Edit location', exact: true }).click();
    await expect(page.getByTestId('LocationNameInput')).toHaveValue('Far away');
    await expect(page.getByTestId('LocationCoordinates')).toContainText('(48.8566, 2.3522)');
    await page.getByTestId('LocationPicker').getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Far away');
  });

  test('saves a point selected on the map and can change it while editing', async ({ page }) => {
    await page.goto('/accounts', { waitUntil: 'networkidle' });
    await page.getByTestId('AddOperationButton').click();
    await page.getByRole('button', { name: 'Choose on map', exact: true }).click();
    const picker = page.getByTestId('LocationPicker');
    const map = page.getByTestId('LocationMap');
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(map.locator('.location-pin')).toBeVisible();
    await expect(page.getByTestId('ConfirmLocationButton')).toBeEnabled();
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
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Point on map');

    await page.getByRole('button', { name: 'Edit location', exact: true }).click();
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
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Point on map');
  });

  test('edits a saved place on the map and preserves changes only after saving', async ({ page }) => {
    await page.goto('/settings/known-places', { waitUntil: 'networkidle' });
    const card = page.locator('.place-card').filter({ hasText: 'Far away' });
    await card.click();
    const picker = page.getByTestId('LocationPicker');
    const map = page.getByTestId('LocationMap');
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(map.locator('.location-pin')).toBeVisible();
    await map.click({ position: { x: 70, y: 150 } });
    await picker.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(card).toContainText('48.856600, 2.352200');
    await card.click();
    await expect(map).toHaveClass(/leaflet-container/);
    await map.click({ position: { x: 70, y: 150 } });
    await page.getByTestId('ConfirmLocationButton').click();
    await expect(picker).toHaveCount(0);
    await expect(card).not.toContainText('48.856600, 2.352200');
    const savedText = await card.innerText();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(card).toHaveText(savedText);
  });

  test('adds and selects a saved place from an empty list', async ({ page }) => {
    await importMockDataAsync(page, JSON.stringify({ ...JSON.parse(mockData), knownPlaces: [] }));
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });
    const selector = page.getByTestId('KnownPlaceSelect');
    await expect(selector).toBeEnabled();
    await expect(selector).toContainText('Not specified');
    await selector.press('ArrowDown');
    await expect(page.getByTestId('KnownPlaceOptions')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Add', exact: true }).click();
    await expect(page.getByTestId('LocationCoordinates')).toContainText('(44.8176, 20.4633)');
    await page.getByTestId('LocationNameInput').fill('New shop');
    await page.getByTestId('ConfirmLocationButton').click();
    await expect(selector).toContainText('New shop');
    await expect(page.getByRole('button', { name: 'Edit location', exact: true })).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await selector.click();
    await expect(page.getByRole('menuitem', { name: 'New shop', exact: true })).toBeVisible();
  });

  test('copies coordinates and returns the map to GPS', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as unknown as { copiedCoordinates: string }).copiedCoordinates = value;
          },
        },
      });
    });
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Choose on map', exact: true }).click();
    const label = page.getByTestId('LocationCoordinates');
    await expect(label).toContainText('Coordinates: (44.8176, 20.4633)');
    await label.click();
    expect(await page.evaluate(() => (window as unknown as { copiedCoordinates: string }).copiedCoordinates)).toBe(
      '44.8176, 20.4633',
    );
    await page.getByTestId('LocationMap').click({ position: { x: 70, y: 150 } });
    await expect(label).not.toContainText('(44.8176, 20.4633)');
    await page.getByTestId('LocateOnMapButton').click();
    await expect(label).toContainText('(44.8176, 20.4633)');
    await expect(page.getByTestId('LocationNameInput')).not.toHaveAttribute('placeholder');
  });

  test('chooses an unnamed point without GPS and cancels without changing the form', async ({ page }) => {
    await importMockDataAsync(page, JSON.stringify({ ...JSON.parse(mockData), knownPlaces: [] }));
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined }),
    );
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });
    const open = page.getByRole('button', { name: 'Choose on map', exact: true });
    await open.click();
    await expect(page.getByTestId('LocationMap')).toHaveClass(/leaflet-container/);
    await expect(page.getByTestId('ConfirmLocationButton')).toBeDisabled();
    await page.getByTestId('LocationMap').click({ position: { x: 70, y: 150 } });
    await page.getByTestId('LocationPicker').getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
    await expect(page.getByTestId('RemoveLocationButton')).toHaveCount(0);
    await open.click();
    await expect(page.getByTestId('LocationMap')).toHaveClass(/leaflet-container/);
    await page.getByTestId('LocationMap').click({ position: { x: 70, y: 150 } });
    await page.getByTestId('ConfirmLocationButton').click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Point on map');
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText(/\([-\d.]+, [-\d.]+\)/);
    await page.getByTestId('RemoveLocationButton').click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
  });

  test('does not replace a manually selected point with a late GPS response', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'permissions', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (callback: PositionCallback) => {
            (window as unknown as { gpsCallback: PositionCallback }).gpsCallback = callback;
          },
        },
      });
    });
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Choose on map', exact: true }).click();
    await expect(page.getByTestId('LocationMap')).toHaveClass(/leaflet-container/);
    await page.getByTestId('LocationMap').click({ position: { x: 70, y: 150 } });
    const selected = await page.getByTestId('LocationCoordinates').textContent();
    await page.evaluate((position) => {
      (window as unknown as { gpsCallback: PositionCallback }).gpsCallback({ coords: position } as GeolocationPosition);
    }, currentPosition);
    await expect(page.getByTestId('LocationCoordinates')).toHaveText(selected!);
    await page.getByTestId('LocationPicker').getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByTestId('KnownPlaceSelect')).toContainText('Not specified');
  });
});
