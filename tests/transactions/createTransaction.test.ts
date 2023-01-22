import test, { expect } from '@playwright/test';
import { hasLocatorClassAsync, useAuthAsync } from '@tests/utils';
import { checkCommonInputs, getTransactionFormLocators } from '@tests/transactions/utils';

test.describe('Transactions > Create', () => {
  test('outgoing is selected by default', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/transactions/create');

    const { form, typeSwitch, typeSwitchInButton, typeSwitchOutButton, typeSwitchTransferButton } =
      getTransactionFormLocators(page);

    expect(await form.isVisible()).toBe(true);
    expect(await typeSwitch.isVisible()).toBe(true);

    expect(await hasLocatorClassAsync(typeSwitchInButton, 'active')).toBe(false);
    expect(await hasLocatorClassAsync(typeSwitchOutButton, 'active')).toBe(true);
    expect(await hasLocatorClassAsync(typeSwitchTransferButton, 'active')).toBe(false);
  });

  test.describe('Incoming', () => {
    test('page has all required inputs', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await page.goto('/transactions/create');

      const { typeSwitchInButton, sourceAccountSelect, destinationAccountSelect, categorySelect } =
        getTransactionFormLocators(page);

      await typeSwitchInButton.click();
      expect(await hasLocatorClassAsync(typeSwitchInButton, 'active')).toBe(true);

      expect(await sourceAccountSelect.isVisible()).toBe(false);
      expect(await categorySelect.isVisible()).toBe(true);
      expect(await destinationAccountSelect.isVisible()).toBe(true);

      await checkCommonInputs(page);
    });

    test('account is required', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await page.goto('/transactions/create');

      const { typeSwitchInButton, amountInput, createButton } = getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      await amountInput.fill('10000');

      await createButton.click();

      const errorToast = page.getByTestId('AccountIsRequiredErrorToast');
      await errorToast.waitFor({ state: 'visible' });
    });

    test('category is required', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await page.goto('/transactions/create');

      const { typeSwitchInButton, destinationAccountSelect, amountInput, createButton } =
        getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      const accountButton = destinationAccountSelect.getByRole('button').filter({ hasText: 'T_TST' });
      await accountButton.click();

      await amountInput.fill('10000');

      await createButton.click();

      const errorToast = page.getByTestId('CategoryIsRequiredErrorToast');
      await errorToast.waitFor({ state: 'visible' });
    });

    test('create incoming transaction', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await page.goto('/transactions/create');

      const { typeSwitchInButton, categorySelect, destinationAccountSelect, amountInput, commentInput, createButton } =
        getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Work' });
      await categoryButton.click();

      const accountButton = destinationAccountSelect.getByRole('button').filter({ hasText: 'T_TST' });
      await accountButton.click();

      await amountInput.fill('10000');
      await commentInput.fill(`Test ${new Date().getTime()}`);

      await createButton.click();

      const successToast = page.getByTestId('CreateTransactionSuccessToast');
      await successToast.waitFor({ state: 'visible' });
    });
  });

  test.describe('Outgoing', () => {
    test('page has all required inputs', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await page.goto('/transactions/create');

      const { typeSwitchOutButton, sourceAccountSelect, destinationAccountSelect, categorySelect } =
        getTransactionFormLocators(page);

      await typeSwitchOutButton.click();
      expect(await hasLocatorClassAsync(typeSwitchOutButton, 'active')).toBe(true);

      expect(await sourceAccountSelect.isVisible()).toBe(true);
      expect(await categorySelect.isVisible()).toBe(true);
      expect(await destinationAccountSelect.isVisible()).toBe(false);

      await checkCommonInputs(page);
    });
  });
});
