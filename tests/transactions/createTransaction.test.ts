import test, { expect } from '@playwright/test';
import { checkCommonInputs, getTransactionFormLocators } from '@tests/transactions/utils';
import { hasLocatorClassAsync, importMockDataAsync, useAuthAsync } from '@tests/utils';

test.describe('Transactions > Create', () => {
  test('outgoing is selected by default', async ({ page }) => {
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
    test('page has all required inputs', async ({ page }) => {
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
      await importMockDataAsync(page);

      await page.goto('/transactions/create', { waitUntil: 'networkidle' });

      const { typeSwitchInButton, amountInput, createButton } = getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      await amountInput.fill('10000');

      await createButton.click();

      const errorToast = page.getByTestId('AccountIsRequiredErrorToast');
      await errorToast.waitFor({ state: 'visible' });
    });

    test('category is required', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await importMockDataAsync(page);

      await page.goto('/transactions/create', { waitUntil: 'networkidle' });

      const {
        typeSwitchInButton,
        destinationAccountSelect,
        destinationAccountSelectPortal,
        amountInput,
        createButton,
      } = getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      const selectorButton = destinationAccountSelect.getByRole('button');
      await selectorButton.click();

      const accountButton = destinationAccountSelectPortal.getByRole('button').filter({ hasText: 'T_TST' });
      await accountButton.click();

      await amountInput.fill('10000');

      await createButton.click();

      const errorToast = page.getByTestId('CategoryIsRequiredErrorToast');
      await errorToast.waitFor({ state: 'visible' });
    });

    test('create incoming transaction', async ({ page, context }) => {
      await useAuthAsync(page, context);
      await importMockDataAsync(page);

      await page.locator('a[href="/accounts"]').click();
      await page.waitForURL(/accounts/);

      await page.getByTestId('AddOperationButton').click();

      const {
        typeSwitchInButton,
        categorySelect,
        destinationAccountSelect,
        destinationAccountSelectPortal,
        amountInput,
        commentInput,
        createButton,
      } = getTransactionFormLocators(page);

      await typeSwitchInButton.click();

      const categoryButton = categorySelect.getByRole('button').filter({ hasText: 'T_Work' });
      await categoryButton.click();

      const selectorButton = destinationAccountSelect.getByRole('button');
      await selectorButton.click();

      const accountButton = destinationAccountSelectPortal.getByRole('button').filter({ hasText: 'T_TST' });
      const accountId = await accountButton.getAttribute('data-id');

      expect(accountId).toBeDefined();

      await accountButton.click();

      await amountInput.fill('100');
      const comment = `Test ${new Date().toISOString()}`;
      await commentInput.fill(comment);

      await createButton.click();

      await page.waitForURL(`/accounts?account-card=${accountId}`, { waitUntil: 'networkidle' });

      const transactionListItem = page.getByTestId('TransactionListItem').filter({ hasText: comment });
      await transactionListItem.waitFor({ state: 'visible' });

      const transactionId = await transactionListItem.getAttribute('data-id');
      await transactionListItem.click();

      await page.waitForURL(`/transactions/edit?id=${transactionId}`);

      await page.getByTestId('DeleteTransactionButton').click();

      await page.waitForURL(`/accounts?account-card=${accountId}`);

      await page.getByTestId('DeleteTransactionSuccessToast').waitFor({ state: 'visible' });

      await page.waitForURL(/accounts/, { waitUntil: 'networkidle' });
    });
  });

  test.describe('Outgoing', () => {
    test('page has all required inputs', async ({ page }) => {
      await page.goto('/transactions/create', { waitUntil: 'networkidle' });

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
