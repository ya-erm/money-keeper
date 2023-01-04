import test, { expect, type Page } from '@playwright/test';
import { useAuthAsync } from '@tests/utils';

const getLocators = (page: Page) => {
  const form = page.getByTestId('CreateAccountForm');
  return {
    form,
    nameInput: form.locator('input[name="name"]'),
    currencyInput: form.locator('input[name="currency"]'),
    submitButton: form.locator('button[type="submit"]'),
  };
};

test.describe('Accounts. Create', () => {
  test('name and currency are required', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/accounts/create');

    const { nameInput, currencyInput } = getLocators(page);

    expect(await nameInput.getAttribute('required')).toBe('');
    expect(await currencyInput.getAttribute('required')).toBe('');
  });

  test('create new account', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/accounts/create');

    const { nameInput, currencyInput, submitButton } = getLocators(page);

    await nameInput.fill('Account-1');
    await currencyInput.fill('TST');
    await submitButton.click();

    const successToast = page.getByTestId('CreateAccountSuccessToast');
    await successToast.waitFor({ state: 'visible' });

    await page.waitForNavigation();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/accounts');
  });
});
