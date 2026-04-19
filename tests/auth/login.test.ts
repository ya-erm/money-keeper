import { expect, test } from '@tests/fixtures';
import type { Page } from '@playwright/test';

const runAuthE2E = process.env.RUN_AUTH_E2E === 'true';

const getLocators = (page: Page) => ({
  form: page.getByTestId('LoginForm'),
  loginInput: page.getByTestId('LoginInput'),
  passwordInput: page.getByTestId('PasswordInput'),
  submitButton: page.getByTestId('SignInButton'),
});

test.describe('Login page', () => {
  test.skip(!runAuthE2E, 'Auth e2e is disabled by default because the main CI flow uses guest/indexedDB mode.');

  test('login page has expected inputs', async ({ page }) => {
    await page.goto('/login');

    const { loginInput, passwordInput } = getLocators(page);

    expect(await loginInput.count()).toBe(1);
    expect(await passwordInput.count()).toBe(1);

    expect(await passwordInput.getAttribute('type')).toBe('password');
  });

  test('login with wrong credentials', async ({ page, context }) => {
    await page.goto('/login');

    const { loginInput, passwordInput, submitButton } = getLocators(page);

    await loginInput.fill('test');
    await passwordInput.fill('wrongPassword');
    await submitButton.click();

    const errorToast = page.getByTestId('IncorrectLoginOrPasswordToast');
    await errorToast.waitFor({ state: 'visible' });

    const cookies = await context.cookies(page.url());
    const sessionCookie = cookies.find((x) => x.name === 'session.v2');
    expect(sessionCookie?.value).not.toBeDefined();
  });

  test('login with correct credentials', async ({ page }) => {
    await page.goto('/login');

    const { TEST_LOGIN, TEST_PASSWORD } = process.env;

    expect(TEST_LOGIN).toBeDefined();
    expect(TEST_PASSWORD).toBeDefined();

    const { loginInput, passwordInput, submitButton } = getLocators(page);

    if (TEST_LOGIN) await loginInput.fill(TEST_LOGIN);
    if (TEST_PASSWORD) await passwordInput.fill(TEST_PASSWORD);

    await submitButton.click();

    await page.waitForURL(/.*/);
  });
});
