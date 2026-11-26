import { expect, test } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';
import { mockData } from '@tests/mock';
import type { Page } from '@playwright/test';

const profile = { id: 'alex', name: 'Alex User', currency: 'EUR', allocationPreset: 'first', accountsOrder: [] };
async function seed(page: Page) {
  await importMockDataAsync(page, JSON.stringify({ ...JSON.parse(mockData), participants: [profile] }));
}
async function exportData(page: Page) {
  await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  await page.getByTestId('ShowExportTextAreaButton').click();
  return JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
}
async function pickIcon(page: Page, icon = 'mdi:cat') {
  await page.getByTestId('ParticipantIconButton').click();
  await page.getByTestId('ParticipantIconPicker').locator(`[data-testid=IconChoice][data-id="${icon}"]`).click();
  await expect(page.getByTestId('ParticipantIconPicker')).toHaveCount(0);
}
async function pickColor(page: Page, color: string) {
  await page.getByRole('button', { name: /^Avatar color/ }).click();
  await page.locator('[name=participant-avatar-color]').fill(color);
  await page.getByTestId('ParticipantColorPicker').getByRole('button', { name: 'Continue', exact: true }).click();
}

test('saves participant avatar color and icon through reload and JSON export/import', async ({
  page,
  context,
}, testInfo) => {
  await seed(page);
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  await page.getByTestId('ParticipantPicker').selectOption('alex');
  await page.getByRole('link', { name: 'Edit Alex User', exact: true }).click();
  await pickColor(page, '#2563eb');
  const avatar = page.getByTestId('ParticipantAvatar');
  await expect(avatar).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(avatar).toHaveCSS('color', 'rgb(255, 255, 255)');
  await pickIcon(page);
  await expect(avatar).toHaveAttribute('data-icon', 'mdi:cat');
  await expect(avatar.locator('svg')).toBeVisible();
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('alex');
  const row = page.locator('[data-testid=ParticipantRow][data-id=alex]');
  await expect(row.getByTestId('ParticipantAvatar')).toHaveAttribute('data-icon', 'mdi:cat');
  await expect(row.getByTestId('ParticipantAvatar')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  const data = await exportData(page);
  const saved = data.participants.find((item: { id: string }) => item.id === 'alex');
  expect(saved).toMatchObject({ ...profile, avatarColor: '#2563eb', avatarIcon: 'mdi:cat' });
  data.participants = [{ ...saved, id: 'imported-profile', name: 'Imported profile' }];
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  const imported = page.locator('[data-testid=ParticipantRow][data-id=imported-profile]');
  await expect(imported.getByTestId('ParticipantAvatar')).toHaveAttribute('data-icon', 'mdi:cat');
  await expect(imported.getByTestId('ParticipantAvatar')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await context.addCookies([{ name: 'locale', value: 'ru-RU', url: new URL(page.url()).origin }]);
  await page.goto('/settings/participants/edit?id=alex', { waitUntil: 'networkidle' });
  await expect(page.getByText('Цвет аватарки', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('participant-avatar-editor-ru-390px.png') });
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  await page.screenshot({ path: testInfo.outputPath('participant-avatar-list-390px.png') });
});

test('new participants can choose a custom icon and restore initials and automatic color', async ({ page }) => {
  await seed(page);
  await page.goto('/settings/participants/create', { waitUntil: 'networkidle' });
  await page.locator('[name=participant-name]').fill('Jane Doe');
  await pickColor(page, '#000000');
  await page.getByTestId('ParticipantIconButton').click();
  const picker = page.getByTestId('ParticipantIconPicker');
  await picker.getByRole('button', { name: 'Custom', exact: true }).click();
  await picker.locator('[name=icon]').fill('mdi:dog');
  await picker.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.getByTestId('ParticipantAvatar')).toHaveAttribute('data-icon', 'mdi:dog');
  await expect(page.getByTestId('ParticipantAvatar')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.getByTestId('ParticipantIconButton').click();
  await page.getByTestId('ParticipantIconPicker').getByRole('button', { name: 'Recommended', exact: true }).click();
  await page.getByTestId('ParticipantIconPicker').locator('[data-testid=IconChoice][data-id=none]').click();
  await page.getByRole('button', { name: /^Avatar color/ }).click();
  await page.getByTestId('ParticipantAutomaticColor').click();
  await expect(page.getByTestId('ParticipantAvatar')).toHaveText('JD');
  await expect(page.getByTestId('ParticipantAvatar')).not.toHaveAttribute('data-icon');
  await expect(page.getByRole('button', { name: /^Avatar color/ })).toContainText('Automatic color');
  await expect(page.getByTestId('ResetParticipantIconButton')).toHaveCount(0);
  await expect(page.getByTestId('ResetParticipantColorButton')).toHaveCount(0);
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  const data = await exportData(page);
  const saved = data.participants.find((item: { name: string }) => item.name === 'Jane Doe');
  expect(saved).toBeDefined();
  expect(saved).not.toHaveProperty('avatarColor');
  expect(saved).not.toHaveProperty('avatarIcon');
});

test('back from icon selection preserves the draft and leaving without Save keeps the stored avatar unchanged', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/settings/participants/edit?id=alex', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantAvatar')).toHaveText('AU');
  await page.locator('[name=participant-name]').fill('Unsaved profile');
  await pickColor(page, '#ff0000');
  await page.getByTestId('ParticipantIconButton').click();
  await page.goBack();
  await expect(page.getByTestId('ParticipantIconPicker')).toHaveCount(0);
  await expect(page.locator('[name=participant-name]')).toHaveValue('Unsaved profile');
  await expect(page.getByTestId('ParticipantAvatar')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  const data = await exportData(page);
  expect(data.participants.find((item: { id: string }) => item.id === 'alex')).toMatchObject(profile);
  expect(data.participants.find((item: { id: string }) => item.id === 'alex')).not.toHaveProperty('avatarColor');
});
