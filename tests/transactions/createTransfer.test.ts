import test, { expect } from '@playwright/test';
import { checkCommonInputs, getTransactionFormLocators } from '@tests/transactions/utils';
import { hasLocatorClassAsync } from '@tests/utils';

test.describe('Transactions. Create. Transfer', () => {
  test('page has all required inputs', async ({ page }) => {
    await page.goto('/transactions/create', { waitUntil: 'networkidle' });

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
});
