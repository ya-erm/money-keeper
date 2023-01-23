import test, { expect } from '@playwright/test';
import { useAuthAsync } from '@tests/utils';
import { getTransactionFormLocators } from '@tests/transactions/utils';

test.describe('Transactions with tags', () => {
  test('create transaction with tag', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/transactions/create');

    const { categorySelect, sourceAccountSelect, amountInput, commentInput, createButton, tags } =
      getTransactionFormLocators(page);

    const accountButton = sourceAccountSelect.getByRole('button').filter({ hasText: 'T_TST' });
    await accountButton.click();

    const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Shop' });
    await categoryButton.click();

    await amountInput.fill('150');

    const transactionComment = `T_WithTag ${new Date().getTime()}`;
    await commentInput.fill(transactionComment);

    const tagButton = tags.getByRole('button').filter({ hasText: 'T_Tag' });
    const tagName = await tagButton.textContent();
    await tagButton.click();

    await createButton.click();

    const successToast = page.getByTestId('CreateTransactionSuccessToast');
    await successToast.waitFor({ state: 'visible' });

    await page.waitForNavigation();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/accounts');

    const transactionItem = page.getByRole('link').filter({ hasText: transactionComment });
    const tag = transactionItem.getByText(`#${tagName}`);

    expect(await tag.isVisible()).toBe(true);
  });
});
