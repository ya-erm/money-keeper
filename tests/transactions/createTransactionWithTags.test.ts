import test from '@playwright/test';
import { getTransactionFormLocators } from '@tests/transactions/utils';
import { importMockDataAsync, useAuthAsync } from '@tests/utils';

test.describe('Transactions with tags', () => {
  test('create transaction with tag', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await importMockDataAsync(page);

    await page.locator('a[href="/accounts"]').click();
    await page.waitForURL(/accounts/);

    await page.getByTestId('AddOperationButton').click();

    const {
      categorySelect,
      sourceAccountSelect,
      sourceAccountSelectPortal,
      amountInput,
      commentInput,
      createButton,
      tags,
    } = getTransactionFormLocators(page);

    const selectorButton = sourceAccountSelect.getByRole('button');
    await selectorButton.click();

    const accountButton = sourceAccountSelectPortal.getByRole('button').filter({ hasText: 'T_TST' });
    await accountButton.click();

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

    const transactionItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
    const tag = transactionItem.getByText(`#${tagName}`);

    await tag.waitFor({ state: 'visible' });
  });
});
