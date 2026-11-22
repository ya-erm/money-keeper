import { expect, test } from '@tests/fixtures';
import { openPathAsync } from '@tests/helpers';

async function openIconPicker(page: import('@playwright/test').Page) {
  await openPathAsync(page, '/categories?action=create');
  await page.locator('.modal input[list="categories"]').fill('Test category');
  await page.locator('.modal button.grid-item').click();
  await expect(page.getByRole('heading', { name: 'Select icon', exact: true, includeHidden: true })).toBeVisible();
}

test('recommended icon returns to the category form and is saved', async ({ page }) => {
  await openIconPicker(page);
  await page.locator('.sub-screen button.grid-item').first().click();
  await expect(page.getByRole('heading', { name: 'Select icon', exact: true, includeHidden: true })).toHaveCount(0);
  await expect(page.locator('.modal input[list="categories"]')).toHaveValue('Test category');
  await page
    .getByTestId('CategoryForm')
    .getByRole('button', { name: 'Save', exact: true, includeHidden: true })
    .click();
  await expect(page.getByRole('button', { name: 'Test category', exact: true })).toBeVisible();
});

test('back closes only the icon picker and preserves the category draft', async ({ page }) => {
  await openIconPicker(page);
  await page.locator('.sub-screen .back-button button').click();
  await expect(page.getByRole('heading', { name: 'Select icon', exact: true, includeHidden: true })).toHaveCount(0);
  await expect(page.locator('.modal input[list="categories"]')).toHaveValue('Test category');
});

test('custom icon Continue returns to the form and is saved', async ({ page }) => {
  await openIconPicker(page);
  await page.getByText('Custom', { exact: true }).click();
  await page.locator('input[name="icon"]').fill('mdi:wallet-outline');
  await page.getByRole('button', { name: 'Continue', exact: true, includeHidden: true }).click();
  await expect(page.getByRole('heading', { name: 'Select icon', exact: true, includeHidden: true })).toHaveCount(0);
  await page
    .getByTestId('CategoryForm')
    .getByRole('button', { name: 'Save', exact: true, includeHidden: true })
    .click();
  await expect(page.getByRole('button', { name: 'Test category', exact: true })).toBeVisible();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page).toHaveURL(/\/categories$/);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Test category', exact: true }).click();
  await page.locator('.modal button.grid-item').click();
  await expect(page.locator('input[name="icon"]')).toHaveValue('mdi:wallet-outline');
  await page.screenshot({ path: 'output/category-icons/custom-icon-390.png' });
  await page.locator('.sub-screen .back-button button').click();
  await expect(page.locator('.sub-screen')).toHaveCount(0);
  await page.screenshot({ path: 'output/category-icons/category-form-390.png', animations: 'disabled' });
});

test('browser Back and Forward navigate the picker without skipping the category form', async ({ page }) => {
  await openIconPicker(page);
  await page.goBack();
  await expect(page.locator('.sub-screen')).toHaveCount(0);
  await expect(page.locator('.modal input[list="categories"]')).toHaveValue('Test category');
  await expect(page).toHaveURL(/\/categories\?action=create$/);
  await page.goForward();
  await expect(page.locator('.sub-screen')).toBeVisible();
  await expect(page).toHaveURL(/iconSelecting=true/);
});

test('opening the picker adds exactly one history step', async ({ page }) => {
  await openPathAsync(page, '/categories?action=create');
  const before = await page.evaluate(() => history.length);
  await page.locator('.modal button.grid-item').click();
  await expect(page.locator('.sub-screen')).toBeVisible();
  // Wait until SvelteKit has published the routed screen's state.
  await expect.poll(() => page.evaluate(() => JSON.stringify(history.state))).toContain('categoryIconPicker');
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test('direct icon-picker link closes without leaving the category draft', async ({ page }) => {
  await openPathAsync(page, '/categories?action=create&iconSelecting=true');
  await expect(page.locator('.sub-screen')).toBeVisible();
  await page.locator('.sub-screen .back-button button').click();
  await expect(page.locator('.sub-screen')).toHaveCount(0);
  await expect(page).toHaveURL(/\/categories\?action=create$/);
  await expect(page.locator('.modal input[list="categories"]')).toBeVisible();
});

test('creating a category inside an operation preserves the operation draft', async ({ page }) => {
  await openPathAsync(page, '/transactions/create');
  await page.getByTestId('TransactionForm').locator('input[name="amount"]').fill('123');
  await page.getByTestId('CategorySelect.Item.Add').click();
  await page.locator('.modal input[list="categories"]').fill('Operation category');
  await page.locator('.modal button.grid-item').click();
  await page.locator('.sub-screen button.grid-item').first().click();
  await expect(page.locator('.sub-screen')).toHaveCount(0);
  await expect(page).toHaveURL(/\/transactions\/create$/);
  await expect(page.locator('.modal input[list="categories"]')).toHaveValue('Operation category');
  await page
    .getByTestId('CategoryForm')
    .getByRole('button', { name: 'Save', exact: true, includeHidden: true })
    .click();
  await expect(page.getByTestId('CategorySelect.Item').filter({ hasText: 'Operation category' })).toBeVisible();
  await expect(page.getByTestId('TransactionForm').locator('input[name="amount"]')).toHaveValue('123');
});
