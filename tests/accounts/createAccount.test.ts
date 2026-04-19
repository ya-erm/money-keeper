import test, { expect, type Page } from '@playwright/test';
import { openGuestAppAsync } from '@tests/helpers';

const getLocators = (page: Page) => {
  const form = page.getByTestId('AccountForm');
  return {
    form,
    nameInput: form.locator('input[name="name"]'),
    currencyInput: form.locator('input[name="currency"]'),
    submitButton: form.locator('button[type="submit"]'),
    accountCardName: page.locator('[data-testId="AccountName"]'),
  };
};

test.describe('Accounts > Create', () => {
  test('name and currency are required', async ({ page }) => {
    await openGuestAppAsync(page, '/accounts?action=create');

    const { nameInput, currencyInput } = getLocators(page);

    expect(await nameInput.getAttribute('required')).toBe('');
    expect(await currencyInput.getAttribute('required')).toBe('');
  });

  test('create new account in guest mode', async ({ page }) => {
    await openGuestAppAsync(page, '/accounts?action=create');

    const { nameInput, currencyInput, submitButton, accountCardName } = getLocators(page);

    const accountName = `Account-${Date.now()}`;

    await nameInput.fill(accountName);
    await currencyInput.fill('TST');
    await submitButton.click();

    await expect(accountCardName.filter({ hasText: accountName })).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });

    await expect(accountCardName.filter({ hasText: accountName })).toBeVisible();
  });
});
