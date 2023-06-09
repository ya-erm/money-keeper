import test, { expect, type Page } from '@playwright/test';

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
    await page.goto('/accounts?action=create');

    const { nameInput, currencyInput } = getLocators(page);

    expect(await nameInput.getAttribute('required')).toBe('');
    expect(await currencyInput.getAttribute('required')).toBe('');
  });

  test.skip('create new account', async ({ page }) => {
    await page.goto('/accounts?action=create');

    const { nameInput, currencyInput, submitButton, accountCardName } = getLocators(page);

    await nameInput.fill('Account-1');
    await currencyInput.fill('TST');
    await submitButton.click();

    await page.waitForURL(/accounts/);

    await accountCardName.filter({ hasText: 'Account-1' }).waitFor({ state: 'visible' });
  });
});
