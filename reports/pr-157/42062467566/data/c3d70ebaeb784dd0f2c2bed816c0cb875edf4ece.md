# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accounts/receiptScanButton.test.ts >> defaults to hidden and saves the preference independently for each account
- Location: tests/accounts/receiptScanButton.test.ts:90:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Edit', exact: true })

```

# Page snapshot

```yaml
- main [ref=f2e3]:
  - generic [ref=f2e4]:
    - generic [ref=f2e6]:
      - button [ref=f2e8] [cursor=pointer]
      - generic [ref=f2e13]:
        - heading "Accounts" [level=1] [ref=f2e14]
        - generic: Synchronizing
      - generic [ref=f2e16]:
        - button [ref=f2e17] [cursor=pointer]:
          - link "Account list" [ref=f2e18]:
            - /url: /accounts/list
        - button [ref=f2e23] [cursor=pointer]:
          - link "Create account" [ref=f2e24]:
            - /url: http://127.0.0.1:4173/accounts?account-card=qr-scan-account&action=create
    - generic [ref=f2e32]:
      - generic [ref=f2e34]:
        - generic [ref=f2e35] [cursor=pointer]:
          - generic [ref=f2e36]:
            - generic [ref=f2e42]: Other account
            - button "Additional options" [ref=f2e44]
          - button "Hide amount" [ref=f2e49]:
            - generic [ref=f2e50]: 0 EUR
        - generic [ref=f2e51] [cursor=pointer]:
          - generic [ref=f2e52]:
            - generic [ref=f2e58]: Receipt account
            - button "Additional options" [active] [ref=f2e60]
          - button "Hide amount" [ref=f2e65]:
            - generic [ref=f2e66]: 0 RSD
        - dialog [aria-hidden] [ref=f2e68] [cursor=pointer]:
          - generic [ref=f2e69]: Additional options
          - generic [ref=f2e70]:
            - button [ref=f2e71]:
              - generic [ref=f2e72]: Edit
            - button [ref=f2e78]:
              - generic [ref=f2e79]: Hide amount
            - button [ref=f2e86]:
              - generic [ref=f2e87]: Correct balance
            - button [ref=f2e93]:
              - generic [ref=f2e94]: Cancel
      - generic [ref=f2e96]:
        - generic [ref=f2e97]:
          - heading "Operations 0 pcs." [level=3] [ref=f2e98]
          - link "Add" [ref=f2e100] [cursor=pointer]:
            - /url: /transactions/create?accountId=qr-scan-account
        - textbox [ref=f2e111]:
          - /placeholder: Search
        - list [ref=f2e112]
  - navigation [ref=f2e113]:
    - link "Categories" [ref=f2e114] [cursor=pointer]:
      - /url: /categories
    - link "Accounts" [ref=f2e120] [cursor=pointer]:
      - /url: /accounts
    - link "Analytics" [ref=f2e126] [cursor=pointer]:
      - /url: /analytics
    - link "Settings" [ref=f2e132] [cursor=pointer]:
      - /url: /settings
```

# Test source

```ts
  1   | import { readFileSync } from 'node:fs';
  2   | import type { Page } from '@playwright/test';
  3   | import type { Account, Transaction } from '#lib/data/interfaces.js';
  4   | import { expect, test } from '@tests/fixtures';
  5   | import { importMockDataAsync, openPathAsync } from '@tests/helpers';
  6   | import { mockData } from '@tests/mock';
  7   | 
  8   | const accountId = 'qr-scan-account';
  9   | const otherAccountId = 'other-account';
  10  | const accountName = 'Receipt account';
  11  | const preferenceLabel = 'Show QR code scan button';
  12  | const receiptUrl = readFileSync(
  13  |   new URL('../../src/lib/receipts/fixtures/serbian-receipt.txt', import.meta.url),
  14  |   'utf8',
  15  | ).trim();
  16  | const receiptDetails = {
  17  |   merchant: 'LIDL SRBIJA KD',
  18  |   store: 'Test branch',
  19  |   address: 'Test address',
  20  |   city: 'Test city',
  21  |   taxId: '000000001',
  22  |   journal: 'Test receipt',
  23  |   items: [{ name: 'Test item', quantity: 1, unitPrice: 525.7, total: 525.7 }],
  24  |   itemsAvailable: true,
  25  | };
  26  | 
  27  | async function openReadyPath(page: Page, path: string) {
  28  |   await openPathAsync(page, path);
  29  |   await expect(page.locator('#app-startup')).toHaveCount(0);
  30  |   await expect(page.locator('#app-content')).not.toHaveAttribute('inert', '');
  31  | }
  32  | 
  33  | async function seed(page: Page, enabled?: boolean) {
  34  |   const data = JSON.parse(mockData);
  35  |   data.accounts = [
  36  |     { id: accountId, name: accountName, currency: 'RSD', showReceiptScanButton: enabled },
  37  |     { id: otherAccountId, name: 'Other account', currency: 'EUR' },
  38  |   ];
  39  |   data.operations = [];
  40  |   await importMockDataAsync(page, JSON.stringify(data));
  41  |   await openReadyPath(page, `/accounts?account-card=${accountId}`);
  42  | }
  43  | 
  44  | async function openAccountOptions(page: Page) {
  45  |   await page
  46  |     .getByTestId('AccountCard')
  47  |     .filter({ hasText: accountName })
  48  |     .getByRole('button', { name: 'Additional options', exact: true })
  49  |     .click();
  50  | }
  51  | 
  52  | async function editAccount(page: Page) {
  53  |   await openAccountOptions(page);
> 54  |   await page.getByRole('button', { name: 'Edit', exact: true }).click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  55  |   return page.getByTestId('AccountForm');
  56  | }
  57  | 
  58  | async function storedRows<T>(page: Page, store: string): Promise<T[]> {
  59  |   return page.evaluate(async (store) => {
  60  |     const request = indexedDB.open('mk-2');
  61  |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  62  |       request.onsuccess = () => resolve(request.result);
  63  |       request.onerror = () => reject(request.error);
  64  |     });
  65  |     try {
  66  |       return await new Promise<T[]>((resolve, reject) => {
  67  |         const rows = db.transaction(store).objectStore(store).getAll();
  68  |         rows.onsuccess = () => resolve(rows.result);
  69  |         rows.onerror = () => reject(rows.error);
  70  |       });
  71  |     } finally {
  72  |       db.close();
  73  |     }
  74  |   }, store);
  75  | }
  76  | 
  77  | test.beforeEach(async ({ page }) => {
  78  |   await page.clock.setSystemTime('2026-11-05T12:00:00Z');
  79  |   await page.addInitScript(() => {
  80  |     if (navigator.mediaDevices) {
  81  |       navigator.mediaDevices.getUserMedia = async () => {
  82  |         throw new DOMException('Denied in test', 'NotAllowedError');
  83  |       };
  84  |     }
  85  |   });
  86  |   await page.route('**/api/receipts/serbia', (route) => route.fulfill({ json: receiptDetails }));
  87  |   await openReadyPath(page, '/accounts');
  88  | });
  89  | 
  90  | test('defaults to hidden and saves the preference independently for each account', async ({ page }) => {
  91  |   await seed(page);
  92  |   const shortcut = page.getByTestId('AccountScanReceiptButton');
  93  |   await expect(shortcut).toHaveCount(0);
  94  |   let form = await editAccount(page);
  95  |   await expect(form.getByRole('checkbox', { name: preferenceLabel })).not.toBeChecked();
  96  |   await form.getByRole('checkbox', { name: preferenceLabel }).check();
  97  |   await form.getByRole('button', { name: 'Save', exact: true }).click();
  98  |   await expect(form).toHaveCount(0);
  99  |   await expect(shortcut).toBeVisible();
  100 |   await expect(shortcut).toHaveText('QR code');
  101 |   await expect(shortcut.locator('svg')).toHaveCount(1);
  102 |   await expect(shortcut).toHaveAttribute('href', `/transactions/create?accountId=${accountId}&scan-receipt=1`);
  103 |   const qrBox = await shortcut.boundingBox();
  104 |   const addBox = await page.getByTestId('AddOperationButton').boundingBox();
  105 |   expect(qrBox!.x + qrBox!.width).toBeLessThan(addBox!.x);
  106 | 
  107 |   await page.reload();
  108 |   await expect(shortcut).toBeVisible();
  109 |   form = await editAccount(page);
  110 |   await expect(form.getByRole('checkbox', { name: preferenceLabel })).toBeChecked();
  111 |   await form.getByRole('button', { name: 'Save', exact: true }).click();
  112 | 
  113 |   // The balance-visibility action writes a complete account, so it must retain this preference.
  114 |   await openAccountOptions(page);
  115 |   await page.getByRole('button', { name: 'Hide amount', exact: true }).click();
  116 |   await expect(shortcut).toBeVisible();
  117 |   await page.reload();
  118 |   await expect(shortcut).toBeVisible();
  119 |   await expect
  120 |     .poll(async () => (await storedRows<Account>(page, 'accounts')).find((a) => a.id === accountId))
  121 |     .toMatchObject({ showReceiptScanButton: true, hideBalance: true });
  122 | 
  123 |   await openReadyPath(page, `/accounts?account-card=${otherAccountId}`);
  124 |   await expect(shortcut).toHaveCount(0);
  125 |   await openReadyPath(page, `/accounts?account-card=${accountId}`);
  126 |   form = await editAccount(page);
  127 |   await form.getByRole('checkbox', { name: preferenceLabel }).uncheck();
  128 |   await form.getByRole('button', { name: 'Save', exact: true }).click();
  129 |   await expect(shortcut).toHaveCount(0);
  130 |   await page.reload();
  131 |   await expect(shortcut).toHaveCount(0);
  132 | });
  133 | 
  134 | test('can enable the shortcut when creating an account and retains it in JSON export', async ({ page }) => {
  135 |   await openReadyPath(page, '/accounts?action=create');
  136 |   const form = page.getByTestId('AccountForm');
  137 |   await expect(form.getByRole('checkbox', { name: preferenceLabel })).not.toBeChecked();
  138 |   await form.locator('input[name="name"]').fill(accountName);
  139 |   await form.locator('input[name="currency"]').fill('RSD');
  140 |   await form.getByRole('checkbox', { name: preferenceLabel }).check();
  141 |   await form.getByRole('button', { name: 'Save', exact: true }).click();
  142 |   await expect(form).toHaveCount(0);
  143 |   await page.reload();
  144 |   await expect(page.getByTestId('AccountScanReceiptButton')).toBeVisible();
  145 |   await openReadyPath(page, '/settings/import-export');
  146 |   await page.getByText('Show', { exact: true }).click();
  147 |   const exported = JSON.parse(await page.locator('textarea').nth(1).inputValue());
  148 |   expect(exported.accounts).toEqual([expect.objectContaining({ name: accountName, showReceiptScanButton: true })]);
  149 | });
  150 | 
  151 | for (const width of [390, 1440]) {
  152 |   test(`opens the scanner with the selected account and saves the reviewed operation at ${width}px`, async ({
  153 |     page,
  154 |   }) => {
```