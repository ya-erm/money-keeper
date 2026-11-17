import { test, expect } from '@tests/fixtures';
import type { BrowserContext, Page, Route } from '@playwright/test';

test('two devices keep contacts, debts and operations saved during an in-flight upload', async ({
  browser,
}, testInfo) => {
  test.setTimeout(60000);
  const owner = 'sync-test-member';
  const snapshot = {
    debtContacts: [{ id: 'anna', name: 'Anna' }],
    debtRecords: [],
    categories: [{ id: 'food', name: 'Food', type: 'OUT' }],
    accounts: [{ id: 'card', name: 'Test card', currency: 'EUR' }],
    operations: [],
    accountTags: [],
    operationTags: [],
    currencyRates: [],
    groupings: [],
    repeatings: [],
  };
  type Row = { order: number; encryption: string; data: string };
  const rows: Row[] = [{ order: 1, encryption: 'none', data: JSON.stringify({ snapshot }) }];
  let releaseUpload!: () => void;
  const uploadGate = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  let firstFinished!: () => void;
  const firstComplete = new Promise<void>((resolve) => {
    firstFinished = resolve;
  });
  let uploads = 0;
  async function api(route: Route) {
    const request = route.request();
    if (request.url().endsWith('/get-updates')) {
      const { start } = request.postDataJSON();
      await route.fulfill({ json: { journal: rows.filter((row) => row.order > start) } });
      return;
    }
    const batch = request.postDataJSON().items as Row[];
    const first = uploads++ === 0;
    if (first) await uploadGate;
    else await firstComplete;
    if (Math.min(...batch.map((item) => item.order)) <= rows.at(-1)!.order) {
      await route.fulfill({ status: 409, json: { code: 'CONFLICT', message: 'Concurrent update' } });
    } else {
      rows.push(...batch);
      await route.fulfill({ json: { syncNumber: rows.at(-1)!.order } });
    }
    if (first) firstFinished();
  }
  async function device(context: BrowserContext) {
    const page = await context.newPage();
    await page.clock.setSystemTime('2026-11-17T12:00:00Z');
    await page.route('**/api/v2/journal', api);
    await page.route('**/api/v2/journal/get-updates', api);
    await page.goto('/accounts', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('AddOperationButton')).toBeVisible();
    await page.evaluate(async (member) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('mk-2');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction(['members', 'globalSettings', 'memberSettings'], 'readwrite');
      tx.objectStore('members').put({ uuid: member, login: 'sync-test', publicKey: '', privateKey: '' });
      tx.objectStore('globalSettings').put({ id: 'global', selectedMember: member });
      tx.objectStore('memberSettings').put({ owner: member, syncNumber: 0, encryption: 'none', currency: 'EUR' });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    }, owner);
    await page.reload({ waitUntil: 'networkidle' });
    await page.goto('/debts');
    await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
    return page;
  }
  const a = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  const b = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  try {
    const source = await device(a);
    const destination = await device(b);
    await source.evaluate(async () => {
      const module = '/src/lib/data/index.ts';
      const { debtContactsService } = await import(module);
      await debtContactsService.save({ id: 'max', name: 'Max' });
    });
    await expect.poll(() => uploads).toBe(1);
    await source.evaluate(async () => {
      const module = '/src/lib/data/index.ts';
      const { debtContactsService, debtRecordsService, operationsService } = await import(module);
      await debtContactsService.save({ id: 'lucy', name: 'Lucy' });
      await debtRecordsService.save({
        id: 'manual-debt',
        contactId: 'max',
        amount: 20,
        currency: 'EUR',
        date: '2026-11-17T10:00:00Z',
      });
      await operationsService.save({
        id: 'shared-payment',
        accountId: 'card',
        categoryId: 'food',
        amount: 10,
        date: '2026-11-17T11:00:00Z',
        debt: { kind: 'expense', shares: [{ contactId: 'lucy', amount: 5 }] },
      });
    });
    releaseUpload();
    await expect.poll(() => rows.some((row) => JSON.parse(row.data).transaction?.id === 'shared-payment')).toBe(true);
    await source.evaluate(async () => {
      const module = '/src/lib/data/index.ts';
      const { journalService } = await import(module);
      await journalService.uploadQueue();
    });
    await source.reload({ waitUntil: 'networkidle' });
    await destination.reload({ waitUntil: 'networkidle' });
    for (const page of [source, destination]) {
      await expect(page.getByTestId('DebtPerson')).toHaveCount(3);
      await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Max' })).toContainText('20');
      await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Lucy' })).toContainText('5');
    }
    await destination.screenshot({ path: testInfo.outputPath('synced-debts-390px.png') });
    const exportData = async (page: Page) => {
      await page.goto('/settings/import-export');
      await page.getByTestId('ShowExportTextAreaButton').click();
      return JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
    };
    const left = await exportData(source),
      right = await exportData(destination);
    for (const key of ['debtContacts', 'debtRecords', 'operations']) {
      const normalize = (items: { id: string; owner?: string }[]) =>
        items.map(({ owner: _owner, ...item }) => item).sort((a, b) => a.id.localeCompare(b.id));
      expect(normalize(right[key])).toEqual(normalize(left[key]));
    }
    expect(right.debtContacts).toHaveLength(3);
    expect(right.debtRecords).toHaveLength(1);
    expect(right.operations).toHaveLength(1);
  } finally {
    releaseUpload();
    firstFinished();
    await a.close();
    await b.close();
  }
});
