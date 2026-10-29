import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import type { Category, Transaction, WithOwner } from '#lib/data/interfaces.js';
import type { ReceiptDetails } from '#lib/receipts/serbianReceipt.js';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';

const receiptUrl = readFileSync(
  new URL('../../src/lib/receipts/fixtures/serbian-receipt.txt', import.meta.url),
  'utf8',
).trim();
const shopCategory = '0a6e4a28-93cf-42a3-be3a-6d6cc9b2da56';
const petsCategory = '67d697eb-bef0-467b-a9e7-18c9c69b2ce9';
const incomeCategory = '38eaf1fa-f514-4649-b6d1-c83ab9324f24';
const organizationName = 'LIDL SRBIJA KD';

function details(merchant = organizationName, store = '1057443-Prodavnica br. 0153'): ReceiptDetails {
  return {
    merchant,
    store,
    address: 'Test address',
    city: 'Test city',
    taxId: '000000001',
    journal: `${merchant}\n${store}\nTest item 525.70 RSD`,
    items: [{ name: 'Test item', quantity: 1, unitPrice: 525.7, total: 525.7 }],
    itemsAvailable: true,
  };
}

function operation(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'receipt-test-account',
    categoryId: shopCategory,
    date: '2026-10-15T10:00:00Z',
    amount: 100,
    receiptOrganizationName: organizationName,
    comment: 'Weekly shopping',
    ...overrides,
  };
}

async function seed(
  page: Page,
  operations: Transaction[] = [],
  deletedCategory = false,
  extraCategories: Category[] = [],
) {
  const data = JSON.parse(mockData);
  data.accounts.push({ id: 'receipt-test-account', name: 'T_RSD', currency: 'RSD' });
  data.operations = operations;
  data.categories.push(...extraCategories);
  if (deletedCategory)
    data.categories.push({ id: 'deleted-category', name: 'Old category', type: 'OUT', deleted: true });
  await importMockDataAsync(page, JSON.stringify(data));
}

async function openReadyPath(page: Page, path: string) {
  await openPathAsync(page, path);
  // Native fill/dispatchEvent can run before hydration attaches the form's handlers.
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.locator('#app-content')).not.toHaveAttribute('inert', '');
}

async function openForm(page: Page) {
  await openReadyPath(page, '/transactions/create?accountId=receipt-test-account');
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
}

async function openScanner(page: Page) {
  const contents = page.getByTestId('PurchaseContentsSection');
  const urlInput = page.getByTestId('ReceiptUrlInput');
  if (!(await urlInput.isVisible())) await contents.getByRole('button', { name: /Purchase contents/ }).click();
  if (await urlInput.inputValue()) await page.getByTestId('ReceiptUrlInput.ClearButton').click();
  await page.getByTestId('ScanReceiptQrButton').click();
  const scanner = page.getByTestId('ReceiptScanner');
  await scanner.locator('input[name="receipt-link"]').fill(receiptUrl);
  return scanner;
}

async function applyScan(page: Page, organization = organizationName) {
  const scanner = await openScanner(page);
  await expect(page.getByTestId('ReceiptPreview')).toContainText(organization);
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(scanner).toHaveCount(0);
}

async function storedOperations(page: Page): Promise<WithOwner<Transaction>[]> {
  return page.evaluate(async () => {
    const request = indexedDB.open('mk-2');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<WithOwner<Transaction>[]>((resolve, reject) => {
        const rows = db.transaction('transactions').objectStore('transactions').getAll();
        rows.onsuccess = () => resolve(rows.result);
        rows.onerror = () => reject(rows.error);
      });
    } finally {
      db.close();
    }
  });
}

async function expectCategory(page: Page, categoryId: string | null) {
  await expect(page.getByTestId('TransactionForm').locator('input[name="categoryId"]')).toHaveValue(categoryId ?? '');
}

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime('2026-10-17T11:30:00Z');
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Denied in test', 'NotAllowedError');
      };
    }
  });
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: details() }));
  await openPathAsync(page);
});

test('remembers the organization separately through save, reload, edit and JSON export/import', async ({ page }) => {
  await seed(page);
  await openForm(page);
  await applyScan(page);
  const comment = page.locator('input[name="comment"]');
  await expect(comment).toHaveValue(organizationName);
  await expect(page.locator('input[name="receiptOrganizationName"]')).toHaveCount(0);
  await comment.fill('Лидл');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () => (await storedOperations(page)).find((item) => item.comment === 'Лидл'))
    .toMatchObject({ receiptOrganizationName: organizationName, categoryId: shopCategory, owner: 'guest' });
  const saved = (await storedOperations(page)).find((item) => item.comment === 'Лидл')!;

  await page.reload();
  await openReadyPath(page, `/transactions/edit?id=${saved.id}`);
  await expect(comment).toHaveValue('Лидл');
  await comment.fill('Pet supplies');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Pets', exact: true }).click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () => (await storedOperations(page)).find((item) => item.id === saved.id))
    .toMatchObject({ receiptOrganizationName: organizationName, comment: 'Pet supplies', categoryId: petsCategory });

  await openReadyPath(page, '/settings/import-export');
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  const exported = JSON.parse(await page.locator('textarea').nth(1).inputValue());
  expect(exported.operations.find((item: Transaction) => item.id === saved.id)).toMatchObject({
    receiptOrganizationName: organizationName,
    comment: 'Pet supplies',
    categoryId: petsCategory,
  });
  // A separate id and name ensure this next match can only come from the imported data.
  const importedName = 'Imported Organization';
  exported.operations = [
    { ...saved, id: 'imported-receipt', receiptOrganizationName: importedName, comment: 'Imported groceries' },
  ];
  await importMockDataAsync(page, JSON.stringify(exported));
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: details(importedName) }));
  await openForm(page);
  await applyScan(page, importedName);
  await expect(comment).toHaveValue('Imported groceries');
  await expectCategory(page, shopCategory);

  await page.route('**/api/receipts/serbia', (route) =>
    route.fulfill({ json: details(' lidl   SRBIJA KD ', '1057443-Prodavnica br. 0001') }),
  );
  await openForm(page);
  await applyScan(page, 'lidl SRBIJA KD');
  await expect(comment).toHaveValue('Pet supplies');
  await expectCategory(page, petsCategory);
});

test('uses the latest matching operation only within the active workspace and receipt type', async ({ page }) => {
  await seed(page, [
    operation('older', { date: '2026-10-14T12:00:00Z', comment: 'Old groceries' }),
    operation('latest', {
      receiptOrganizationName: ' LIDL  Srbija KD ',
      comment: 'Latest groceries',
      categoryId: petsCategory,
    }),
    operation('other-organization', {
      date: '2026-10-16T10:00:00Z',
      receiptOrganizationName: 'Other Organization',
      comment: 'Wrong organization',
    }),
    operation('no-metadata', {
      date: '2026-10-16T11:00:00Z',
      receiptOrganizationName: undefined,
      comment: organizationName,
    }),
    operation('income', { date: '2026-10-16T12:00:00Z', categoryId: incomeCategory, comment: 'Wrong type' }),
    operation('deleted', { date: '2026-10-16T13:00:00Z', deleted: true, comment: 'Deleted purchase' }),
    operation('transfer', { date: '2026-10-16T14:00:00Z', linkedTransactionId: 'older', comment: 'Transfer' }),
  ]);
  // A locally cached different workspace must never contribute defaults.
  await page.evaluate(
    async (foreign) => {
      const request = indexedDB.open('mk-2');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
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
    operation('foreign', { date: '2026-10-16T15:00:00Z', comment: 'Other workspace' }),
  );
  await openForm(page);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Latest groceries');
  await expectCategory(page, petsCategory);
});

test('reuses the latest comment without restoring a deleted category or an older category', async ({ page }) => {
  await seed(
    page,
    [
      operation('older', { date: '2026-10-14T10:00:00Z' }),
      operation('legacy-comment-match', { receiptOrganizationName: undefined, comment: 'Latest comment' }),
      operation('latest', { comment: 'Latest comment', categoryId: 'deleted-category' }),
    ],
    true,
  );
  await openForm(page);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Latest comment');
  await expectCategory(page, null);
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('CategoryIsRequiredErrorToast')).toBeVisible();
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
  expect(await storedOperations(page)).toHaveLength(3);
});

test('keeps a manually entered comment and category when applying a receipt', async ({ page }) => {
  await seed(page, [operation('previous')]);
  await openForm(page);
  await page.locator('input[name="comment"]').fill('My own comment');
  await expect(page.locator('input[name="comment"]')).toHaveValue('My own comment');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Pets', exact: true }).click();
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('My own comment');
  await expectCategory(page, petsCategory);
});

test('refreshes previous autofill on another scan but preserves later manual edits and clearing', async ({ page }) => {
  const secondOrganization = 'Other Organization';
  await seed(page, [
    operation('first', { comment: 'Лидл' }),
    operation('second', {
      receiptOrganizationName: secondOrganization,
      comment: 'Other shopping',
      categoryId: petsCategory,
    }),
  ]);
  await openForm(page);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Лидл');
  await expectCategory(page, shopCategory);

  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: details(secondOrganization) }));
  await applyScan(page, secondOrganization);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Other shopping');
  await expectCategory(page, petsCategory);

  await page.locator('input[name="comment"]').fill('');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
  await applyScan(page, secondOrganization);
  await expect(page.locator('input[name="comment"]')).toHaveValue('');
  await expectCategory(page, shopCategory);
});

test('does not let details from a dismissed scanner overwrite subsequent user input', async ({ page }) => {
  await seed(page, [operation('previous')]);
  const pending: { route?: Route } = {};
  await page.route('**/api/receipts/serbia', (route) => {
    pending.route = route;
  });
  await openForm(page);
  const scanner = await openScanner(page);
  await expect(scanner.getByRole('status')).toHaveText('Loading receipt details…');
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(scanner).toHaveCount(0);
  await page.locator('input[name="comment"]').fill('Typed while details were pending');
  await expect(page.locator('input[name="comment"]')).toHaveValue('Typed while details were pending');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Pets', exact: true }).click();
  await pending.route?.fulfill({ json: details() }).catch(() => {});
  await expect(page.locator('input[name="comment"]')).toHaveValue('Typed while details were pending');
  await expectCategory(page, petsCategory);
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () =>
      (await storedOperations(page)).find((item) => item.comment === 'Typed while details were pending'),
    )
    .toMatchObject({ categoryId: petsCategory });
  const saved = (await storedOperations(page)).find((item) => item.comment === 'Typed while details were pending')!;
  expect(saved.receiptOrganizationName).toBeUndefined();
});

test('preserves hidden organization metadata when duplicating an operation', async ({ page }) => {
  const original = operation('receipt-to-copy', { receiptUrl, comment: 'Receipt to duplicate' });
  await seed(page, [original]);
  await openReadyPath(page, '/accounts?account-card=receipt-test-account');
  const item = page.getByTestId('TransactionListItem').filter({ hasText: original.comment! });
  await expect(item).toBeVisible();
  // Long press opens the account list's operation menu without clicking through to editing.
  await item.dispatchEvent('pointerdown');
  await expect(page.getByRole('button', { name: 'Duplicate', exact: true, includeHidden: true })).toBeVisible();
  await item.dispatchEvent('pointerup');
  await page.getByRole('button', { name: 'Duplicate', exact: true, includeHidden: true }).click();
  await expect
    .poll(async () => (await storedOperations(page)).filter((operation) => operation.comment === original.comment))
    .toHaveLength(2);
  const copy = (await storedOperations(page)).find((operation) => operation.id !== original.id)!;
  expect(copy).toMatchObject({
    receiptOrganizationName: organizationName,
    receiptUrl,
    comment: original.comment,
    categoryId: original.categoryId,
  });
  await page.reload();
  expect((await storedOperations(page)).find((operation) => operation.id === copy.id)?.receiptOrganizationName).toBe(
    organizationName,
  );
});

test('clears stale organization metadata when the receipt URL is manually replaced', async ({ page }) => {
  const original = operation('replace-receipt-url', { receiptUrl });
  await seed(page, [original]);
  await openReadyPath(page, `/transactions/edit?id=${original.id}`);
  await page
    .getByTestId('PurchaseContentsSection')
    .getByRole('button', { name: /Purchase contents/ })
    .click();
  const replacement = 'https://example.com/replacement-receipt';
  await page.getByTestId('ReceiptUrlInput').fill(replacement);
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () => (await storedOperations(page)).find((operation) => operation.id === original.id)?.receiptUrl)
    .toBe(replacement);
  const updated = (await storedOperations(page)).find((operation) => operation.id === original.id)!;
  expect(updated.receiptOrganizationName).toBeUndefined();
  expect(updated.comment).toBe(original.comment);
  expect(updated.categoryId).toBe(original.categoryId);
});

test('reveals an autofilled category beyond the collapsed category rows', async ({ page }) => {
  const extraCategories: Category[] = Array.from({ length: 20 }, (_, index) => ({
    id: `extra-category-${index}`,
    name: `Extra category ${index}`,
    type: 'OUT',
  }));
  const remembered = extraCategories.at(-1)!;
  await seed(page, [operation('hidden-category', { categoryId: remembered.id })], false, extraCategories);
  await openForm(page);
  const category = page.getByTestId('CategorySelect').getByRole('button', { name: remembered.name, exact: true });
  await expect(page.getByTestId('CategorySelect').getByRole('button', { name: 'More', exact: true })).toBeVisible();
  await expect(category).toHaveCount(0);
  await applyScan(page);
  await expectCategory(page, remembered.id);
  await expect(category).toBeVisible();
  await expect(category).toHaveClass(/selected/);
});

test('reuses a saved Russian comment for the same organization at another branch', async ({ page }) => {
  await seed(page);
  await openForm(page);
  await applyScan(page);
  await page.locator('input[name="comment"]').fill('Лидл');
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Shop', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () => (await storedOperations(page)).find((item) => item.comment === 'Лидл'))
    .toMatchObject({ receiptOrganizationName: organizationName });
  await page.reload();
  const differentBranch = '1057443-Prodavnica br. 0001';
  await page.route('**/api/receipts/serbia', (route) =>
    route.fulfill({ json: details(organizationName, differentBranch) }),
  );
  await openForm(page);
  const scanner = await openScanner(page);
  await expect(page.getByTestId('ReceiptPreview')).toContainText(differentBranch);
  await scanner.getByRole('button', { name: 'Fill operation', exact: true }).click();
  await expect(page.locator('input[name="comment"]')).toHaveValue('Лидл');
  await expectCategory(page, shopCategory);
});

test('never treats a branch or a free-form comment as the missing organization', async ({ page }) => {
  const branch = '1057443-Prodavnica br. 0153';
  await seed(page, [
    operation('branch-is-not-organization', { receiptOrganizationName: branch, comment: 'Wrong branch match' }),
    operation('legacy-comment', { receiptOrganizationName: undefined, comment: 'Лидл' }),
  ]);
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: details('', branch) }));
  await openForm(page);
  await applyScan(page, branch);
  await expect(page.locator('input[name="comment"]')).toHaveValue('');
  await expectCategory(page, null);
  await page.locator('input[name="comment"]').fill('Лидл');
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('CategoryIsRequiredErrorToast')).toBeVisible();
  await page.getByTestId('CategorySelect').getByRole('button', { name: 'T_Pets', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect.poll(async () => (await storedOperations(page)).length).toBe(3);
  const saved = (await storedOperations(page)).find((item) => item.categoryId === petsCategory)!;
  expect(saved.receiptOrganizationName).toBeUndefined();
});

test('clears automatic defaults when a subsequent scan has no matching organization', async ({ page }) => {
  await seed(page, [operation('previous', { comment: 'Лидл' })]);
  await openForm(page);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Лидл');
  await expectCategory(page, shopCategory);
  const unknownOrganization = 'New organization';
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: details(unknownOrganization) }));
  await applyScan(page, unknownOrganization);
  await expect(page.locator('input[name="comment"]')).toHaveValue(unknownOrganization);
  await expectCategory(page, null);
});

test('keeps the existing comment and category when rescanning during editing', async ({ page }) => {
  const original = operation('editing-receipt', {
    receiptUrl,
    comment: 'My original comment',
    categoryId: petsCategory,
  });
  await seed(page, [original, operation('newer', { date: '2026-10-16T10:00:00Z', comment: 'Different defaults' })]);
  await openReadyPath(page, `/transactions/edit?id=${original.id}`);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue(original.comment!);
  await expectCategory(page, petsCategory);
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toHaveCount(0);
  await expect
    .poll(async () => (await storedOperations(page)).find((item) => item.id === original.id))
    .toMatchObject({ receiptOrganizationName: organizationName, comment: original.comment, categoryId: petsCategory });
});

test('fills category independently of a manually entered comment', async ({ page }) => {
  await seed(page, [operation('previous')]);
  await openForm(page);
  await page.locator('input[name="comment"]').fill('My manual comment');
  await expect(page.locator('input[name="comment"]')).toHaveValue('My manual comment');
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('My manual comment');
  await expectCategory(page, shopCategory);
});

test('fills comment independently of a preselected compatible category', async ({ page }) => {
  await seed(page, [operation('previous', { comment: 'Лидл' })]);
  await openReadyPath(page, `/transactions/create?accountId=receipt-test-account&categoryId=${petsCategory}`);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Лидл');
  await expectCategory(page, petsCategory);
});

test('replaces an incompatible preselected category when the receipt changes direction', async ({ page }) => {
  await seed(page, [operation('previous', { comment: 'Лидл' })]);
  await openReadyPath(page, `/transactions/create?accountId=receipt-test-account&type=IN&categoryId=${incomeCategory}`);
  await expectCategory(page, incomeCategory);
  await applyScan(page);
  await expect(page.locator('input[name="comment"]')).toHaveValue('Лидл');
  await expectCategory(page, shopCategory);
});
