import test from '@playwright/test';
import { assertTransactionVisibleAsync, importMockDataAsync, openGuestAppAsync, selectAccountAsync } from '@tests/helpers';
import { getTransactionFormLocators } from '@tests/transactions/utils';

test.describe('Transactions with tags', () => {
  test('create transaction with imported tag', async ({ page }) => {
    await openGuestAppAsync(page);
    await importMockDataAsync(page);

    await page.locator('a[href="/accounts"]').click();
    await page.waitForURL(/accounts/);

    await page.getByTestId('AddOperationButton').click();

    const {
      categorySelect,
      sourceAccountSelect,
      amountInput,
      commentInput,
      createButton,
      tags,
    } = getTransactionFormLocators(page);

    await sourceAccountSelect.waitFor({ state: 'visible' });
    await selectAccountAsync(page, 'SourceAccountSelect', 'T_TST');

    const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Shop' });
    await categoryButton.click();

    await amountInput.fill('150');

    const comment = `T_WithTag ${new Date().toISOString()}`;
    await commentInput.fill(comment);

    const tagButton = tags.getByRole('button').filter({ hasText: 'T_Cat' });
    const tagName = await tagButton.textContent();
    await tagButton.click();

    await createButton.click();

    await page.waitForURL(/accounts/, { waitUntil: 'networkidle' });

    await assertTransactionVisibleAsync(page, comment);

    const transactionItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
    const tag = transactionItem.getByText(`#${tagName}`);

    await tag.waitFor({ state: 'visible' });
  });
});
