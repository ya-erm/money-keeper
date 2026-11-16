# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transactions/createTransactionWithTags.test.ts >> Transactions with tags >> create transaction with imported tag
- Location: tests/transactions/createTransactionWithTags.test.ts:10:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  4429 pixels (ratio 0.02 of all image pixels) are different.

  Snapshot: 1-transaction-tag-selected.png

Call log:
  - Expect "toHaveScreenshot(1-transaction-tag-selected.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 4429 pixels (ratio 0.02 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 4429 pixels (ratio 0.02 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - main [ref=f1e3]:
    - generic [ref=f1e4]:
      - generic [ref=f1e6]:
        - button "Back" [ref=f1e8] [cursor=pointer]
        - generic [ref=f1e14]:
          - heading "New operation" [level=1] [ref=f1e15]
          - generic: Synchronizing
        - button "Done" [ref=f1e17] [cursor=pointer]
      - generic [ref=f1e20]:
        - group [ref=f1e21]:
          - button "Incoming" [ref=f1e22] [cursor=pointer]
          - button "Outgoing" [ref=f1e23] [cursor=pointer]
          - button "Transfer" [ref=f1e24] [cursor=pointer]
        - generic [ref=f1e25]:
          - generic [ref=f1e26]: Account
          - button "T_TST" [ref=f1e27] [cursor=pointer]:
            - generic [ref=f1e41]: 549.50 TST
        - generic [ref=f1e48]:
          - generic [ref=f1e49]: Category
          - generic [ref=f1e50]:
            - button "T_Shop" [ref=f1e51] [cursor=pointer]
            - button "T_Pets" [ref=f1e54] [cursor=pointer]
            - button "Add" [ref=f1e57] [cursor=pointer]
        - generic [ref=f1e60]:
          - generic [ref=f1e61]:
            - generic [ref=f1e62]: Date and time
            - button "Europe/Moscow (GMT+3)" [ref=f1e64] [cursor=pointer]:
              - generic [ref=f1e65]:
                - generic [ref=f1e66]: Europe/Moscow
                - generic [ref=f1e67]: (GMT+3)
          - generic [ref=f1e68]:
            - textbox [ref=f1e71]: 2024-02-03
            - textbox [ref=f1e74]: 13:15
        - generic [ref=f1e75]:
          - generic [ref=f1e76]:
            - generic [ref=f1e77]: Amount
            - button "Another currency" [ref=f1e78] [cursor=pointer]
          - generic [ref=f1e81]:
            - spinbutton "TST" [ref=f1e82]: "150"
            - generic [ref=f1e83]: TST
        - generic [ref=f1e85]:
          - generic [ref=f1e86]: Comment
          - generic [ref=f1e87]:
            - combobox "Comment Clear" [ref=f1e88]: E2E tag transaction
            - generic "Clear" [ref=f1e90]:
              - button "Clear" [ref=f1e91] [cursor=pointer]
        - generic [ref=f1e96]:
          - generic [ref=f1e97]: Tags
          - generic [ref=f1e98]:
            - button "T_Cat" [ref=f1e99] [cursor=pointer]
            - button "Add" [ref=f1e100] [cursor=pointer]
        - button "Purchase contents Show" [ref=f1e102] [cursor=pointer]:
          - heading "Purchase contents" [level=3] [ref=f1e103]
          - generic [ref=f1e104]: Show
        - button "Additional parameters Show" [ref=f1e112] [cursor=pointer]:
          - heading "Additional parameters" [level=3] [ref=f1e113]
          - generic [ref=f1e114]: Show
        - generic [ref=f1e121]:
          - generic [ref=f1e122]:
            - generic [ref=f1e123]: Geolocation
            - button "Detect" [ref=f1e125] [cursor=pointer]
          - generic [ref=f1e126]:
            - button "Known place" [ref=f1e128] [cursor=pointer]:
              - generic [ref=f1e129]: Not specified
            - button "Choose on map" [ref=f1e137] [cursor=pointer]
        - button "Create" [ref=f1e143] [cursor=pointer]
  - generic [ref=f1e144]: New operation
```

# Test source

```ts
  1  | import { expect, test } from '@tests/fixtures';
  2  | import { importMockDataAsync, openPathAsync } from '@tests/helpers';
  3  | import {
  4  |   assertTransactionVisibleAsync,
  5  |   getTransactionFormLocators,
  6  |   selectAccountAsync,
  7  | } from '@tests/transactions/utils';
  8  | 
  9  | test.describe('Transactions with tags', () => {
  10 |   test('create transaction with imported tag', async ({ page }) => {
  11 |     await openPathAsync(page);
  12 |     await importMockDataAsync(page);
  13 | 
  14 |     await page.locator('a[href="/accounts"]').click();
  15 |     await page.waitForURL(/accounts/);
  16 | 
  17 |     await page.getByTestId('AddOperationButton').click();
  18 | 
  19 |     const { categorySelect, sourceAccountSelect, amountInput, commentInput, createButton, tags } =
  20 |       getTransactionFormLocators(page);
  21 | 
  22 |     await sourceAccountSelect.waitFor({ state: 'visible' });
  23 |     await selectAccountAsync(page, 'SourceAccountSelect', 'T_TST');
  24 | 
  25 |     const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Shop' });
  26 |     await categoryButton.click();
  27 | 
  28 |     await amountInput.fill('150');
  29 | 
  30 |     const comment = 'E2E tag transaction';
  31 |     await commentInput.fill(comment);
  32 | 
  33 |     const tagButton = tags.getByRole('button').filter({ hasText: 'T_Cat' });
  34 |     const tagName = await tagButton.textContent();
  35 |     await tagButton.click();
  36 |     await page.getByRole('heading', { level: 1, name: 'New operation' }).click();
  37 |     await page.getByTestId('TransactionForm').evaluate((form) => form.scrollIntoView({ block: 'start' }));
> 38 |     await expect(page).toHaveScreenshot('1-transaction-tag-selected.png', {
     |                        ^ Error: expect(page).toHaveScreenshot(expected) failed
  39 |       maxDiffPixels: 30,
  40 |     });
  41 | 
  42 |     await createButton.click();
  43 | 
  44 |     await page.waitForURL(/accounts/, { waitUntil: 'networkidle' });
  45 | 
  46 |     await assertTransactionVisibleAsync(page, comment);
  47 | 
  48 |     const transactionItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
  49 |     await expect(page).toHaveScreenshot('2-transaction-with-tag-created.png');
  50 |     const tag = transactionItem.getByText(`#${tagName}`);
  51 | 
  52 |     await tag.waitFor({ state: 'visible' });
  53 |   });
  54 | });
  55 | 
```