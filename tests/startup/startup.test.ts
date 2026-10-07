import { expect, test, type Page } from '@playwright/test';

async function holdApplicationScripts(page: Page) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'script') await gate;
    await route.continue();
  });
  return release;
}

test('shows the inline shell before scripts and removes it after the root redirect', async ({ page }) => {
  const release = await holdApplicationScripts(page);
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#app-startup')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Money Keeper', exact: true })).toBeVisible();
    await expect(page.locator('#app-content')).toHaveAttribute('inert', '');
  } finally {
    release();
  }
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.locator('#app-content')).not.toHaveAttribute('inert', '');
});

test('uses the saved dark theme and Russian locale before application code', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mk_dark_mode', 'true');
    document.cookie = 'locale=ru-RU; path=/';
  });
  const release = await holdApplicationScripts(page);
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#app-startup')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.getByText('Всё готовим для вас', { exact: true })).toBeVisible();
    await expect(page.getByText('Getting things ready', { exact: true })).toBeHidden();
  } finally {
    release();
  }
});

test('offers recovery when local data initialization fails', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new DOMException('Test: storage unavailable', 'UnknownError');
    };
  });
  await page.goto('/');
  await expect(page.locator('#app-startup')).toHaveAttribute('data-startup-error', '');
  await expect(page.locator('#app-startup').getByRole('alert')).toContainText('Could not open the app');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(page.locator('#app-content')).toHaveAttribute('inert', '');
});

test('does not cover login or a real route error', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.locator('#app-content')).not.toHaveAttribute('inert', '');
  await page.goto('/not-a-real-route');
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});

test('keeps a retry available when scripts never finish', async ({ page }) => {
  const release = await holdApplicationScripts(page);
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#app-startup')).toBeVisible();
  } finally {
    release();
  }
});

test('starts from the installed public shell while offline', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.metadata.pwa, 'Requires the production PWA config; dev mode has no service worker.');
  await page.goto('/');
  await expect(page).toHaveURL(/\/accounts$/);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
    }
  });
  await context.setOffline(true);
  await page.goto('/');
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.locator('#app-startup')).toHaveCount(0);
  await expect(page.locator('main')).toBeVisible();
});
