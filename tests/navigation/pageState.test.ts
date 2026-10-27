import { expect, test } from '@tests/fixtures';
import { openPathAsync } from '@tests/helpers';

test('updates menu and query-driven modals during client navigation and history changes', async ({ page }) => {
  await openPathAsync(page, '/accounts');
  const errors: string[] = [];
  let documentRequests = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests++;
  });

  const categories = page.getByTestId('MenuItem').filter({ hasText: 'Categories' });
  const accounts = page.getByTestId('MenuItem').filter({ hasText: 'Accounts' });
  await categories.click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(categories).toHaveClass(/active/);
  await expect(accounts).not.toHaveClass(/active/);

  await accounts.click();
  await expect(accounts).toHaveClass(/active/);
  await page.locator('a[aria-label="Create account"]').click();
  await expect(page.getByTestId('AccountForm')).toBeVisible();
  await expect(page).toHaveURL(/action=create/);

  await page.goBack();
  await expect(page.getByTestId('AccountForm')).toHaveCount(0);
  await page.goForward();
  await expect(page.getByTestId('AccountForm')).toBeVisible();
  expect(documentRequests).toBe(0);
  expect(errors).toEqual([]);
});
