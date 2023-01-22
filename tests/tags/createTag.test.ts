import test, { expect, type Page } from '@playwright/test';
import { useAuthAsync } from '@tests/utils';

const getLocators = (page: Page) => {
  const addTagForm = page.getByTestId('AddTagForm');
  return {
    tagsContainer: page.getByTestId('TagsContainer'),
    addTagButton: page.getByTestId('AddTagButton'),
    addTagForm,
    titleInput: addTagForm.locator('input[name="title"]'),
    submitButton: addTagForm.locator('button[type="submit"]'),
  };
};

test.describe('Tags', () => {
  test('add tag modal has expected inputs', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/transactions/create');

    const { addTagButton, addTagForm, titleInput, submitButton } = getLocators(page);

    expect(await addTagButton.isVisible()).toBe(true);

    await addTagButton.click();
    await addTagForm.waitFor({ state: 'visible' });

    expect(await titleInput.isVisible()).toBe(true);
    expect(await titleInput.getAttribute('required')).toBe('');
    expect(await submitButton.isVisible()).toBe(true);
  });

  test('create new tag', async ({ page, context }) => {
    await useAuthAsync(page, context);
    await page.goto('/transactions/create');

    const { tagsContainer, addTagButton, addTagForm, titleInput, submitButton } = getLocators(page);

    await addTagButton.click();

    const tagName = `Test ${new Date().getTime()}`;
    await addTagForm.waitFor({ state: 'visible' });
    await titleInput.fill(tagName);
    await submitButton.click();

    await addTagForm.waitFor({ state: 'hidden' });

    const tagButtonVisible = await tagsContainer.locator('button', { hasText: tagName }).isVisible();
    expect(tagButtonVisible).toBe(true);
  });
});
