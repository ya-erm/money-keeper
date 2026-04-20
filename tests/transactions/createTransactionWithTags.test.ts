import { expect, test } from '@tests/fixtures';
import { importMockDataAsync, openPathAsync } from '@tests/helpers';
import {
  assertTransactionVisibleAsync,
  getTransactionFormLocators,
  selectAccountAsync,
} from '@tests/transactions/utils';

test.describe('Transactions with tags', () => {
  test('create transaction with imported tag', async ({ page }) => {
    await openPathAsync(page);
    await importMockDataAsync(page);

    await page.locator('a[href="/accounts"]').click();
    await page.waitForURL(/accounts/);

    await page.getByTestId('AddOperationButton').click();

    const { categorySelect, sourceAccountSelect, amountInput, commentInput, createButton, tags } =
      getTransactionFormLocators(page);

    await sourceAccountSelect.waitFor({ state: 'visible' });
    await selectAccountAsync(page, 'SourceAccountSelect', 'T_TST');

    const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Shop' });
    await categoryButton.click();

    await amountInput.fill('150');

    const comment = 'E2E tag transaction';
    await commentInput.fill(comment);

    const tagButton = tags.getByRole('button').filter({ hasText: 'T_Cat' });
    const tagName = await tagButton.textContent();
    await tagButton.click();
    await page.getByRole('heading', { level: 1, name: 'New operation' }).click();
    await expect(page).toHaveScreenshot('1-transaction-tag-selected.png', {
      maxDiffPixels: 30,
    });

    await createButton.click();

    await page.waitForURL(/accounts/, { waitUntil: 'networkidle' });

    await assertTransactionVisibleAsync(page, comment);

    const transactionItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
    await expect(page).toHaveScreenshot('2-transaction-with-tag-created.png');
    const tag = transactionItem.getByText(`#${tagName}`);

    await tag.waitFor({ state: 'visible' });
  });
});
