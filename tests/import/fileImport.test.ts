import { expect, test } from '@tests/fixtures';
import { mockData } from '@tests/mock';

test('loads a JSON file with BOM, previews it and imports only after confirmation', async ({ page }) => {
  await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  await page.getByTestId('ShowExportTextAreaButton').click();
  const before = await page.getByTestId('ExportTextArea').inputValue();
  const chooserReady = page.waitForEvent('filechooser');
  await page.getByTestId('ChooseImportFileButton').click();
  const chooser = await chooserReady;
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles({
    name: 'money-keeper-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('\uFEFF' + mockData),
  });
  await expect(page.getByTestId('ImportFileName')).toHaveText('money-keeper-backup.json');
  await expect(page.getByTestId('AddToJournalButton')).toBeVisible();
  expect(JSON.parse(await page.getByTestId('ImportTextArea').inputValue())).toEqual(JSON.parse(mockData));
  await expect(page.getByText('Categories: 3,').first()).toBeVisible();
  await expect(page.getByText('Accounts: 2,').first()).toBeVisible();
  await expect(page.getByText('Operations: 4,').first()).toBeVisible();
  await expect(page.getByTestId('ExportTextArea')).toHaveValue(before);
  await expect(page.getByTestId('ImportSuccessToast')).toHaveCount(0);
  await expect(page).toHaveScreenshot('json-file-preview-390px.png');

  await page.getByTestId('AddToJournalButton').click();
  await expect(page.getByTestId('ImportSuccessToast')).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(exported.operations).toHaveLength(4);
  expect(exported.accounts).toHaveLength(2);
  await page.goto('/transactions', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('TransactionListItem').filter({ hasText: 'Food for pets' })).toBeVisible();
});

test('rejects malformed files without retaining an old preview and supports selecting the same file and pasting', async ({
  page,
}) => {
  await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  const input = page.getByTestId('ImportFileInput');
  const select = (content: string) =>
    input.setInputFiles({ name: 'backup.json', mimeType: '', buffer: Buffer.from(content) });
  await select(mockData);
  await expect(page.getByTestId('AddToJournalButton')).toBeVisible();

  for (const invalid of ['{', 'null', '[]', '{"accounts":"not an array"}']) {
    await select(invalid);
    await expect(page.getByTestId('ImportTextArea')).toHaveValue(invalid);
    await expect(page.getByTestId('ImportParseErrorToast').last()).toBeVisible();
    await expect(page.getByTestId('AddToJournalButton')).toHaveCount(0);
    await expect(page.getByTestId('ChooseImportFileButton')).toBeEnabled();
  }
  await select(mockData);
  await expect(page.getByTestId('AddToJournalButton')).toBeVisible();
  await page.getByTestId('ImportTextArea').fill('{"operations":[]}');
  await expect(page.getByTestId('AddToJournalButton')).toHaveCount(0);
  await expect(page.getByTestId('ImportFileName')).toHaveCount(0);
  await page.getByTestId('ParseJsonButton').click();
  await expect(page.getByTestId('AddToJournalButton')).toBeVisible();
  await expect(page.getByText('Operations: 0,').first()).toBeVisible();
  await page.getByTestId('ShowExportTextAreaButton').click();
  expect(JSON.parse(await page.getByTestId('ExportTextArea').inputValue()).operations).toHaveLength(0);
});

test('recovers from a file read error and lets the same file be selected again', async ({ page }) => {
  await page.addInitScript(() => {
    const read = File.prototype.text;
    File.prototype.text = async () => {
      throw new DOMException('Test read failure', 'NotReadableError');
    };
    window.addEventListener('restore-file-reader', () => (File.prototype.text = read), { once: true });
  });
  await page.goto('/settings/import-export', { waitUntil: 'networkidle' });
  const file = { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(mockData) };
  await page.getByTestId('ImportFileInput').setInputFiles(file);
  await expect(page.getByTestId('ImportFileErrorToast')).toBeVisible();
  await expect(page.getByTestId('ChooseImportFileButton')).toBeEnabled();
  await expect(page.getByTestId('AddToJournalButton')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('restore-file-reader')));
  await page.getByTestId('ImportFileInput').setInputFiles(file);
  await expect(page.getByTestId('ImportFileName')).toHaveText('backup.json');
  await expect(page.getByTestId('AddToJournalButton')).toBeVisible();
});
