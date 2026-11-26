import type { Page } from '@playwright/test';
import { expect, test } from '@tests/fixtures';

const setting = (page: Page) => page.getByRole('button', { name: /^Theme/ });
async function choose(page: Page, mode: 'Light' | 'Dark' | 'System') {
  await setting(page).click();
  await page.getByRole('option', { name: mode, exact: true }).click();
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(setting(page)).toContainText(mode);
}

test('follows the device live in System mode and preserves explicit choices after reload', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await expect(setting(page)).toContainText('System');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  await page.screenshot({ path: testInfo.outputPath('system-theme-light-390px.png') });
  await choose(page, 'Dark');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(setting(page)).toContainText('Dark');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await choose(page, 'Light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  await choose(page, 'System');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(setting(page)).toContainText('System');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await expect(page.locator('#app-theme-color')).toHaveAttribute('content', '#121212');
  await setting(page).click();
  await expect(page.getByRole('option')).toHaveCount(3);
  await expect(page.getByRole('option', { name: 'System', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({ path: testInfo.outputPath('system-theme-options-390px.png') });
});

for (const legacy of [true, false]) {
  test(`migrates the previous ${legacy ? 'dark' : 'light'} preference without following the opposite device theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: legacy ? 'light' : 'dark' });
    await page.addInitScript((value) => localStorage.setItem('mk_dark_mode', JSON.stringify(value)), legacy);
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expect(setting(page)).toContainText(legacy ? 'Dark' : 'Light');
    expect(await page.locator('body').evaluate((body) => body.classList.contains('dark-mode'))).toBe(legacy);
  });
}

for (const mode of ['system', 'light'] as const) {
  test(`applies ${mode} before application scripts when the device is dark`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript((value) => {
      localStorage.setItem('mk_theme', JSON.stringify(value));
      localStorage.setItem('mk_dark_mode', 'true');
    }, mode);
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script') await gate;
      await route.continue();
    });
    try {
      await page.goto('/settings', { waitUntil: 'commit' });
      await expect(page.locator('#app-startup')).toBeVisible();
      await expect(page.locator('#app-startup')).toHaveCSS(
        'background-color',
        mode === 'system' ? 'rgb(0, 0, 0)' : 'rgb(242, 242, 242)',
      );
    } finally {
      release();
    }
    await expect(page.locator('#app-startup')).toHaveCount(0);
    await expect(setting(page)).toContainText(mode === 'system' ? 'System' : 'Light');
  });
}

test('falls back to the previous preference when the saved theme is malformed', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mk_theme', 'broken-json');
    localStorage.setItem('mk_dark_mode', 'true');
  });
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await expect(setting(page)).toContainText('Dark');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  expect(await page.evaluate(() => localStorage.getItem('mk_theme'))).toBe(JSON.stringify('dark'));
});

test('shows the three theme choices in Russian at mobile width', async ({ page, context, baseURL }, testInfo) => {
  if (!baseURL) throw new Error('A base URL is required');
  await context.addCookies([{ name: 'locale', value: 'ru-RU', url: baseURL }]);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/settings', { waitUntil: 'networkidle' });
  const theme = page.getByRole('button', { name: /^Тема/ });
  await expect(theme).toContainText('Системная');
  await theme.click();
  await expect(page.getByRole('option')).toHaveCount(3);
  for (const name of ['Светлая', 'Тёмная', 'Системная'])
    await expect(page.getByRole('option', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отмена', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Принять', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('system-theme-options-ru-390px.png') });
});

test('cancelling or dismissing a pending theme choice keeps the saved mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await setting(page).click();
  await page.getByRole('option', { name: 'Light', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(setting(page)).toContainText('System');
  await setting(page).click();
  await expect(page.getByRole('option', { name: 'System', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('option', { name: 'Light', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('mk_theme'))).toBe(JSON.stringify('system'));
});

test('language uses the same chooser and preserves accepted values when a later selection is cancelled', async ({
  page,
}) => {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  const language = page.getByRole('button', { name: /^(Language|Язык)/ });
  await language.click();
  await page.getByRole('option', { name: 'Русский', exact: true }).click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(language).toContainText('English');
  await language.click();
  await page.getByRole('option', { name: 'Русский', exact: true }).click();
  await page.getByRole('button', { name: 'Принять', exact: true }).click();
  await expect(language).toContainText('Русский');
  await language.click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(language).toContainText('Русский');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(language).toContainText('Русский');
});
