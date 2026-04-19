import test, { expect } from '@playwright/test';
import { assertTransactionVisibleAsync, importMockDataAsync, openGuestAppAsync, selectAccountAsync } from '@tests/helpers';
import { checkCommonInputs, getTransactionFormLocators } from '@tests/transactions/utils';
import { hasLocatorClassAsync } from '@tests/utils';

test.describe('Transactions. Create. Transfer', () => {
  test('page has all required inputs', async ({ page }) => {
    await openGuestAppAsync(page, '/transactions/create');

    const {
      form,
      typeSwitch,
      typeSwitchTransferButton,
      sourceAccountSelect,
      destinationAccountSelect,
      categorySelect,
      destinationAmountInput,
    } = getTransactionFormLocators(page);

    expect(await form.isVisible()).toBe(true);
    expect(await typeSwitch.isVisible()).toBe(true);

    await typeSwitchTransferButton.click({ delay: 100 });
    await page.waitForURL('/transactions/create?type=TRANSFER');
    expect(await hasLocatorClassAsync(typeSwitchTransferButton, 'active')).toBe(true);

    expect(await sourceAccountSelect.isVisible()).toBe(true);
    expect(await categorySelect.isVisible()).toBe(false);
    expect(await destinationAccountSelect.isVisible()).toBe(true);

    await checkCommonInputs(page);

    expect(await destinationAmountInput.isVisible()).toBe(true);
    expect(await destinationAmountInput.getAttribute('required')).toBe('');
  });

  test('create transfer between imported accounts', async ({ page }) => {
    await openGuestAppAsync(page);
    await importMockDataAsync(page);

    await page.goto('/accounts', { waitUntil: 'networkidle' });
    await page.getByTestId('AddOperationButton').click();

    const {
      typeSwitchTransferButton,
      sourceAccountSelect,
      destinationAccountSelect,
      amountInput,
      destinationAmountInput,
      commentInput,
      createButton,
    } = getTransactionFormLocators(page);

    await typeSwitchTransferButton.click();
    await sourceAccountSelect.waitFor({ state: 'visible' });
    await selectAccountAsync(page, 'SourceAccountSelect', 'T_TST');
    await selectAccountAsync(page, 'DestinationAccountSelect', 'T_USD');

    await amountInput.fill('200');
    await destinationAmountInput.fill('50');

    const comment = `T_Transfer ${new Date().toISOString()}`;
    await commentInput.fill(comment);

    await createButton.click();

    await page.waitForURL(/accounts/, { waitUntil: 'networkidle' });
    await assertTransactionVisibleAsync(page, comment);

    const transactionItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
    await expect(transactionItem).toContainText('T_TST');
    await expect(transactionItem).toContainText('T_USD');
  });
});
