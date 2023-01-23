import test, { expect, type Page } from '@playwright/test';
import { hasLocatorClassAsync, useAuthAsync } from '@tests/utils';
import { checkCommonInputs, getTransactionFormLocators } from '@tests/transactions/utils';

test.describe('Transactions. Create. Transfer', () => {
  test('page has all required inputs', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/transactions/create');

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

    await typeSwitchTransferButton.click();
    expect(await hasLocatorClassAsync(typeSwitchTransferButton, 'active')).toBe(true);

    expect(await sourceAccountSelect.isVisible()).toBe(true);
    expect(await categorySelect.isVisible()).toBe(false);
    expect(await destinationAccountSelect.isVisible()).toBe(true);

    await checkCommonInputs(page);

    expect(await destinationAmountInput.isVisible()).toBe(true);
    expect(await destinationAmountInput.getAttribute('required')).toBe('');
  });
});
