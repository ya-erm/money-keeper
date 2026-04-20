import { expect, test } from '@tests/fixtures';
import type { Page } from '@playwright/test';
import { openPathAsync } from '@tests/helpers';

const getLocators = (page: Page) => {
  const form = page.getByTestId('AccountForm');
  return {
    form,
    nameInput: form.locator('input[name="name"]'),
    iconInput: form.locator('input[name="icon"]'),
    currencyInput: form.locator('input[name="currency"]'),
    colorInput: form.locator('input[name="color"]'),
    submitButton: form.locator('button[type="submit"]'),
    accountCardName: page.locator('[data-testId="AccountName"]'),
  };
};

test.describe('Accounts > Create', () => {
  test('name and currency are required', async ({ page }) => {
    await openPathAsync(page, '/accounts?action=create');

    const { nameInput, currencyInput } = getLocators(page);

    expect(await nameInput.getAttribute('required')).toBe('');
    expect(await currencyInput.getAttribute('required')).toBe('');
  });

  test('create new account', async ({ page }) => {
    await openPathAsync(page, '/accounts?action=create');

    const { nameInput, currencyInput, iconInput, colorInput, submitButton, accountCardName } = getLocators(page);

    const accountName = 'Bank card';

    await nameInput.fill(accountName);
    await currencyInput.fill('USD');
    await iconInput.fill('mdi:credit-card');
    await colorInput.fill('#cccccc');
    await expect(page).toHaveScreenshot('1-account-create-form-filled.png');
    await submitButton.click();

    await expect(accountCardName.filter({ hasText: accountName })).toBeVisible();
    await expect(page).toHaveScreenshot('2-account-created-card.png');

    await page.reload({ waitUntil: 'networkidle' });

    await expect(accountCardName.filter({ hasText: accountName })).toBeVisible();
  });
});
