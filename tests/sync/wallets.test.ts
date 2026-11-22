import type { BrowserContext, Route } from '@playwright/test';
import { test, expect } from '@tests/fixtures';

test('two devices synchronize wallet payments, savings and personal preferences while keeping independent active participants', async ({
  browser,
}, testInfo) => {
  test.setTimeout(90000);
  const owner = 'wallet-sync-owner';
  const snapshot = {
    walletsEnabled: true,
    participants: [
      { id: 'alex', name: 'Алексей', walletsOrder: ['a', 'b', 'holiday'] },
      { id: 'maria', name: 'Мария', walletsOrder: ['b', 'a', 'holiday'] },
    ],
    virtualWallets: [
      { id: 'a', name: 'Алексей', participantId: 'alex' },
      { id: 'b', name: 'Мария', participantId: 'maria' },
      { id: 'holiday', name: 'Отпуск' },
    ],
    walletTransfers: [],
    categories: [{ id: 'out', name: 'Покупка', type: 'OUT' }],
    accounts: [
      { id: 'card', name: 'Карта RSD', currency: 'RSD' },
      { id: 'eur', name: 'Счёт EUR', currency: 'EUR' },
    ],
    operations: [],
    accountTags: [],
    operationTags: [],
    currencyRates: [],
    groupings: [],
    repeatings: [],
  };
  type Row = { order: number; encryption: string; data: string };
  const rows: Row[] = [{ order: 1, encryption: 'none', data: JSON.stringify({ snapshot }) }];
  async function api(route: Route) {
    if (route.request().url().endsWith('/get-updates')) {
      const { start } = route.request().postDataJSON();
      await route.fulfill({ json: { journal: rows.filter((row) => row.order > start) } });
      return;
    }
    const batch = route.request().postDataJSON().items as Row[];
    if (Math.min(...batch.map((row) => row.order)) <= rows.at(-1)!.order) {
      await route.fulfill({ status: 409, json: { code: 'CONFLICT', message: 'Concurrent update' } });
      return;
    }
    rows.push(...batch);
    await route.fulfill({ json: { syncNumber: rows.at(-1)!.order } });
  }
  async function device(context: BrowserContext, participantId: string) {
    const page = await context.newPage();
    await page.clock.setSystemTime('2026-11-22T12:00:00Z');
    await page.route('**/api/v2/journal', api);
    await page.route('**/api/v2/journal/get-updates', api);
    await page.goto('/accounts', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('AddOperationButton')).toBeVisible();
    await page.evaluate(
      async ({ owner, participantId }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('mk-2');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const tx = db.transaction(['members', 'globalSettings', 'memberSettings'], 'readwrite');
        tx.objectStore('members').put({ uuid: owner, login: 'wallet-sync', publicKey: '', privateKey: '' });
        tx.objectStore('globalSettings').put({
          id: 'global',
          selectedMember: owner,
          selectedParticipants: { [owner]: participantId },
        });
        tx.objectStore('memberSettings').put({ owner, syncNumber: 0, encryption: 'none' });
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      },
      { owner, participantId },
    );
    await page.reload({ waitUntil: 'networkidle' });
    await page.goto('/wallets');
    await expect(page.getByTestId('WalletCard')).toHaveCount(3);
    return page;
  }
  const a = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
  const b = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
  try {
    const source = await device(a, 'alex');
    const target = await device(b, 'maria');
    await source.goto('/settings', { waitUntil: 'networkidle' });
    await source.getByRole('button', { name: /Основная валюта/ }).click();
    await expect(source.getByTestId('MainCurrencyParticipant')).toHaveText('Алексей');
    await source.getByTestId('MainCurrencyForm').locator('input[name=currency]').fill('eur');
    await source.getByTestId('MainCurrencyForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(source.getByTestId('MainCurrencyForm')).toHaveCount(0);
    await source.goto('/accounts/list');
    await source.getByRole('button', { name: 'Сортировка счетов', exact: true }).click();
    const accountRow = source.getByTestId('AccountSortList').locator(':scope > li[data-id="eur"]');
    await accountRow.focus();
    await accountRow.press('Space');
    await accountRow.press('ArrowUp');
    await accountRow.press('Space');
    await source.getByRole('button', { name: 'Скрыть Карта RSD', exact: true }).click();
    await source.locator('.sorting').getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(source).not.toHaveURL(/action=sort/);
    await source.goto('/wallets/list');
    await source.getByRole('button', { name: 'Сортировка кошельков', exact: true }).click();
    const walletRow = source.getByTestId('WalletSortList').locator(':scope > li[data-id="b"]');
    await walletRow.focus();
    await walletRow.press('Space');
    await walletRow.press('ArrowUp');
    await walletRow.press('Space');
    await source.getByRole('button', { name: 'Скрыть Алексей', exact: true }).click();
    await source.locator('.sorting-bar').getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(source).toHaveURL(/\/wallets\/list$/);
    await source.evaluate(async () => {
      const path = '/src/lib/data/index.ts';
      const data = await import(path);
      await data.operationsService.save({
        id: 'shared',
        accountId: 'card',
        categoryId: 'out',
        amount: 10000,
        date: '2026-11-21T10:00:00Z',
        walletAllocation: {
          shares: [
            { walletId: 'a', amount: 5000 },
            { walletId: 'b', amount: 5000 },
          ],
        },
      });
      await data.walletTransfersService.save({
        id: 'saving',
        fromWalletId: 'a',
        toWalletId: 'holiday',
        currency: 'RSD',
        amount: 2000,
        date: '2026-11-21T10:00:00Z',
        contributorParticipantId: 'alex',
      });
      await data.journalService.uploadQueue();
    });
    await target.evaluate(async () => {
      const path = '/src/lib/data/index.ts';
      const { journalService } = await import(path);
      await journalService.syncWithServer();
    });
    await target.goto('/settings/participants');
    await expect(target.getByTestId('ParticipantPicker')).toHaveValue('maria');
    await target.goto('/wallets');
    await expect(target.getByTestId('WalletCard').first()).toContainText('Мария');
    await expect(target.getByTestId('WalletCard').filter({ hasText: 'Отпуск' })).toContainText('2\u00a0000');
    await target.goto('/wallets?wallet=holiday');
    await expect(target.getByTestId('WalletContribution')).toContainText('Алексей');
    await target.screenshot({ path: testInfo.outputPath('shared-savings-second-device-390.png'), fullPage: true });
    await target.goto('/settings/participants');
    await target.getByTestId('ParticipantPicker').selectOption('alex');
    await expect(target.getByTestId('ParticipantPicker')).toBeEnabled();
    await target.goto('/accounts/list');
    await expect(target.getByTestId('AccountSortList').locator(':scope > li').first()).toHaveAttribute(
      'data-id',
      'eur',
    );
    await expect(target.getByTestId('AccountSortList').locator(':scope > li[data-id="card"]')).toHaveClass(
      /personal-hidden/,
    );
    await target.goto('/wallets/list');
    await expect(target.getByTestId('WalletListItem').first()).toHaveAttribute('data-id', 'b');
    await target.goto('/wallets');
    await expect(target.getByTestId('WalletCard')).toHaveCount(2);
    await target.goto('/settings', { waitUntil: 'networkidle' });
    await target.reload({ waitUntil: 'networkidle' });
    await target.getByRole('button', { name: /Основная валюта/ }).click();
    await expect(target.getByTestId('MainCurrencyParticipant')).toHaveText('Алексей');
    await expect(target.getByTestId('MainCurrencyForm').locator('input[name=currency]')).toHaveValue('EUR');
    await target.getByTestId('MainCurrencyForm').getByRole('button', { name: 'Отмена', exact: true }).click();
    await target.goto('/settings/participants');
    await target.getByTestId('ParticipantPicker').selectOption('maria');
    await expect(target.getByTestId('ParticipantPicker')).toBeEnabled();
    await expect(target.getByTestId('ParticipantPicker')).toHaveValue('maria');
    await target.goto('/accounts/list');
    await expect(target.getByTestId('AccountSortList').locator(':scope > li').first()).toHaveAttribute(
      'data-id',
      'card',
    );
    await expect(target.getByTestId('AccountSortList').locator(':scope > li[data-id="card"]')).not.toHaveClass(
      /personal-hidden/,
    );
    await target.goto('/wallets');
    await expect(target.getByTestId('WalletCard')).toHaveCount(3);
    await source.reload();
    await source.goto('/settings/participants');
    await expect(source.getByTestId('ParticipantPicker')).toHaveValue('alex');
    expect(rows.filter((row) => JSON.parse(row.data).walletTransfer?.id === 'saving')).toHaveLength(1);
    await source.evaluate(async () => {
      const path = '/src/lib/data/index.ts';
      const { participantsService, journalService } = await import(path);
      await participantsService.save({ ...participantsService.getById('alex')!, deleted: true });
      await journalService.uploadQueue();
    });
    await target.evaluate(async () => {
      const path = '/src/lib/data/index.ts';
      const { journalService } = await import(path);
      await journalService.syncWithServer();
    });
    await target.goto('/settings/participants');
    await expect(target.getByTestId('ParticipantRow')).toHaveCount(1);
    await expect(target.getByTestId('ParticipantPicker')).toHaveValue('maria');
    await target.goto('/wallets?wallet=holiday');
    await expect(target.getByTestId('WalletContribution')).toContainText('Алексей');
    await source.goto('/settings/participants');
    await expect(source.getByTestId('ParticipantPicker')).toHaveValue('');
  } finally {
    await a.close();
    await b.close();
  }
});
