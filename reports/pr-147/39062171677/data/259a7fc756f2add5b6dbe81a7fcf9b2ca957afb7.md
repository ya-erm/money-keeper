# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import/importData.test.ts >> Import / Export >> imports seed data into guest indexedDB and shows it in the UI
- Location: tests/import/importData.test.ts:6:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  2589 pixels (ratio 0.01 of all image pixels) are different.

  Snapshot: 2-imported-transactions-list.png

Call log:
  - Expect "toHaveScreenshot(2-imported-transactions-list.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 2589 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 2589 pixels (ratio 0.01 of all image pixels) are different.

```

# Page snapshot

```yaml
- main [ref=f2e3]:
  - generic [ref=f2e4]:
    - generic [ref=f2e6]:
      - generic [ref=f2e8]:
        - heading "Operations" [level=1] [ref=f2e9]
        - generic: Synchronizing
      - button [ref=f2e11] [cursor=pointer]:
        - link "Create operation" [ref=f2e12]:
          - /url: /transactions/create
    - list [ref=f2e21]:
      - generic [ref=f2e22]: 26 May 2023
      - listitem [ref=f2e23]:
        - button "T_TST T_USD Transfer -400 TST" [ref=f2e24] [cursor=pointer]:
          - generic [ref=f2e30]:
            - generic [ref=f2e31]:
              - generic [ref=f2e32]: T_TST
              - generic [ref=f2e37]: T_USD
            - generic [ref=f2e38]: Transfer
          - generic [ref=f2e39]: "-400 TST"
      - listitem [ref=f2e41]:
        - button "T_TST T_USD Transfer +100 USD" [ref=f2e42] [cursor=pointer]:
          - generic [ref=f2e48]:
            - generic [ref=f2e49]:
              - generic [ref=f2e50]: T_TST
              - generic [ref=f2e55]: T_USD
            - generic [ref=f2e56]: Transfer
          - generic [ref=f2e57]: +100 USD
      - listitem [ref=f2e59]:
        - 'button "T_TST T_Pets Food for pets #T_Cat -50.50 TST" [ref=f2e60] [cursor=pointer]':
          - generic [ref=f2e66]:
            - generic [ref=f2e67]:
              - generic [ref=f2e68]: T_TST
              - generic [ref=f2e73]: T_Pets
            - generic [ref=f2e74]: Food for pets
            - generic [ref=f2e75]: "#T_Cat"
          - generic [ref=f2e77]: "-50.50 TST"
      - listitem [ref=f2e79]:
        - button "T_Work T_TST Income +1 000 TST" [ref=f2e80] [cursor=pointer]:
          - generic [ref=f2e86]:
            - generic [ref=f2e87]:
              - generic [ref=f2e88]: T_Work
              - generic [ref=f2e93]: T_TST
            - generic [ref=f2e94]: Income
          - generic [ref=f2e95]: +1 000 TST
  - navigation [ref=f2e97]:
    - link "Categories" [ref=f2e98] [cursor=pointer]:
      - /url: /categories
    - link "Accounts" [ref=f2e104] [cursor=pointer]:
      - /url: /accounts
    - link "Analytics" [ref=f2e110] [cursor=pointer]:
      - /url: /analytics
    - link "Settings" [ref=f2e116] [cursor=pointer]:
      - /url: /settings
```

# Test source

```ts
  1  | import { expect, test } from '@tests/fixtures';
  2  | 
  3  | import { importMockDataAsync, openPathAsync } from '@tests/helpers';
  4  | 
  5  | test.describe('Import / Export', () => {
  6  |   test('imports seed data into guest indexedDB and shows it in the UI', async ({ page }) => {
  7  |     await openPathAsync(page);
  8  |     await importMockDataAsync(page);
  9  | 
  10 |     await expect(page.getByText('Categories: 3,')).toBeVisible();
  11 |     await expect(page.getByText('Accounts: 2,')).toBeVisible();
  12 |     await expect(page.getByText('Operations: 4,')).toBeVisible();
  13 |     await expect(page).toHaveScreenshot('1-import-summary.png');
  14 | 
  15 |     await page.goto('/transactions', { waitUntil: 'networkidle' });
  16 | 
  17 |     await expect(page.getByTestId('TransactionListItem').filter({ hasText: 'Income' })).toBeVisible();
  18 |     await expect(page.getByTestId('TransactionListItem').filter({ hasText: 'Food for pets' })).toBeVisible();
> 19 |     await expect(page).toHaveScreenshot('2-imported-transactions-list.png');
     |                        ^ Error: expect(page).toHaveScreenshot(expected) failed
  20 |   });
  21 | });
  22 | 
```