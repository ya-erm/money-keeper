import { test, expect } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';
import { fileURLToPath } from 'node:url';

test.use({ locale: 'ru-RU' });
const backup = JSON.stringify({
  walletsEnabled: true,
  participants: [
    {
      id: 'alex',
      name: 'Алексей',
      accountsOrder: ['rsd', 'eur'],
      walletsOrder: ['alex-wallet', 'maria-wallet', 'holiday'],
    },
    {
      id: 'maria',
      name: 'Мария',
      accountsOrder: ['eur', 'rsd'],
      walletsOrder: ['maria-wallet', 'alex-wallet', 'holiday'],
      allocationPreset: 'equal',
    },
  ],
  virtualWallets: [
    { id: 'alex-wallet', name: 'Алексей', participantId: 'alex' },
    { id: 'maria-wallet', name: 'Мария', participantId: 'maria' },
    { id: 'holiday', name: 'Отпуск' },
  ],
  walletTransfers: [],
  categories: [
    { id: 'income', name: 'Зарплата', type: 'IN' },
    { id: 'rent', name: 'Аренда', type: 'OUT' },
  ],
  accounts: [
    { id: 'rsd', name: 'Карта RSD', currency: 'RSD' },
    { id: 'eur', name: 'Счёт EUR', currency: 'EUR' },
  ],
  operations: [
    {
      id: 'salary',
      accountId: 'rsd',
      categoryId: 'income',
      date: '2026-11-01T09:00:00Z',
      amount: 200000,
      walletAllocation: {
        shares: [
          { walletId: 'alex-wallet', amount: 100000 },
          { walletId: 'maria-wallet', amount: 100000 },
        ],
      },
    },
  ],
  accountTags: [],
  operationTags: [],
  currencyRates: [],
  groupings: [],
  repeatings: [],
});

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.clock.setSystemTime('2026-11-22T12:00:00Z');
  await importMockDataAsync(page, backup);
  await page.goto('/settings/participants');
  await page.getByTestId('ParticipantPicker').selectOption('alex');
  await page.goto('/wallets');
});

test('participants, shared expense, holiday contributions, reload and export', async ({ page }, testInfo) => {
  await expect(page.getByTestId('MenuItem')).toHaveText(['Долги', 'Счета', 'Кошельки', 'Аналитика', 'Настройки']);
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Алексей' })).toContainText('100\u00a0000');
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('link', { name: /Алексей/ })
    .click();
  await page.getByTestId('WalletAddExpense').click();
  await expect(page.getByTestId('SourceAccountSelect')).toContainText('Карта RSD');
  await page.locator('input[name=amount]').fill('10000');
  await page.getByTestId('WalletAllocation').getByRole('button', { name: 'Поровну', exact: true }).click();
  await expect(page.getByTestId('WalletAllocation').locator('input')).toHaveCount(2);
  await expect(page.getByTestId('WalletAllocation').locator('input').first()).toHaveValue('5000');
  await page.getByTestId('CategorySelect.Item').first().click();
  await page.locator('input[name=comment]').fill('Общая покупка');
  await page.screenshot({ path: testInfo.outputPath('shared-expense-390.png'), fullPage: true });
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('WalletDetails')).toBeVisible();
  await expect(
    page.getByTestId('WalletCard').filter({ hasText: 'Алексей' }).getByTestId('WalletBalance'),
  ).toContainText('95\u00a0000');
  await expect(page.getByTestId('WalletHistoryEntry').filter({ hasText: 'Общая покупка' })).toContainText('5\u00a0000');
  await page.goto('/wallets?wallet=holiday');
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Отпуск' })
    .getByRole('link', { name: 'Перераспределить', exact: true })
    .click();
  await page.locator('[name=from-wallet]').selectOption('alex-wallet');
  await page.locator('[name=wallet-amount]').fill('20000');
  await page.locator('[name=wallet-currency]').fill('RSD');
  expect(
    await page.getByTestId('WalletTransferForm').evaluate((form) =>
      Array.from((form as HTMLFormElement).elements)
        .map((element) => ({
          name: (element as HTMLInputElement).name,
          valid: (element as HTMLInputElement).validity?.valid,
          message: (element as HTMLInputElement).validationMessage,
        }))
        .filter((element) => element.valid === false),
    ),
  ).toEqual([]);
  await page.getByTestId('WalletTransferForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletContribution')).toContainText('Алексей');
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Отпуск' }).getByTestId('WalletBalance')).toContainText(
    '20\u00a0000',
  );
  await page.reload();
  await expect(page.getByTestId('WalletContribution')).toContainText('20\u00a0000');
  await page.screenshot({ path: testInfo.outputPath('holiday-contributions-390.png'), fullPage: true });
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const saved = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(saved.virtualWallets).toHaveLength(3);
  expect(saved.walletTransfers).toHaveLength(1);
  expect(saved.operations).toHaveLength(2);
  expect(saved.operations[0]).not.toHaveProperty('account');
  expect(saved.operations[0]).not.toHaveProperty('category');
  expect(
    saved.operations
      .find((op: { comment: string }) => op.comment === 'Общая покупка')
      .walletAllocation.shares.map((s: { amount: number }) => s.amount),
  ).toEqual([5000, 5000]);
});

test('currency conversion uses both wallet balances and participant defaults', async ({ page }, testInfo) => {
  await page.goto('/transactions/create?type=TRANSFER');
  await page.getByTestId('DestinationAccountSelect').click();
  await page.getByTestId('DestinationAccountSelect.Portal').getByText('Счёт EUR', { exact: true }).click();
  await page.locator('input[name=amount]').fill('120000');
  await page.locator('input[name=destinationAmount]').fill('1000');
  await page.getByTestId('WalletAllocation').getByRole('button', { name: 'Поровну', exact: true }).click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/wallets?wallet=alex-wallet');
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Алексей' })).toContainText('40\u00a0000');
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Алексей' })).toContainText('500\u00a0EUR');
  const conversion = page.getByTestId('WalletHistoryEntry').filter({ hasText: '60\u00a0000' });
  await expect(conversion).toHaveCount(1);
  await expect(conversion).toContainText('60\u00a0000');
  await expect(conversion).toContainText('500');
  await page.screenshot({ path: testInfo.outputPath('wallet-currency-exchange-390.png'), fullPage: true });
  await page.goto('/settings/participants');
  await page.getByTestId('ParticipantPicker').selectOption('maria');
  await page.goto('/');
  await expect(page).toHaveURL(/wallet=maria-wallet/);
  await page.getByTestId('WalletAddExpense').click();
  await expect(page.getByTestId('SourceAccountSelect')).toContainText('Счёт EUR');
  await page.locator('input[name=amount]').fill('1000');
  await expect(page.getByTestId('WalletAllocation').locator('input').first()).toHaveValue('500');
  await expect(page.getByTestId('WalletAllocation').locator('input').nth(1)).toHaveValue('500');
  await page.getByTestId('CategorySelect.Item').first().click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/wallets');
  await expect(page.getByTestId('UnallocatedBalance').filter({ hasText: 'EUR' })).toContainText('0');
  await page.reload();
  await page.goto('/settings/participants');
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('maria');
});

test('QR shortcut opens the scanner with bank account and allocation ready', async ({ page }, testInfo) => {
  await page.route('**/api/receipts/serbia', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.goto('/wallets?wallet=alex-wallet');
  await page.getByTestId('WalletScanReceipt').click();
  await expect(page).toHaveURL(/scan-receipt=1/);
  await expect(page.getByTestId('ReceiptScanner')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('wallet-qr-390.png'), fullPage: true });
  await page
    .getByTestId('ReceiptPhotoInput')
    .setInputFiles(fileURLToPath(new URL('../../src/lib/receipts/fixtures/serbian-receipt.png', import.meta.url)));
  await expect(page.getByTestId('ReceiptPreview')).toContainText('525,70 RSD');
  await page.getByTestId('ReceiptScanner').getByRole('button', { name: 'Заполнить операцию', exact: true }).click();
  await expect(page.getByTestId('ReceiptScanner')).not.toBeVisible();
  await expect(page.getByTestId('SourceAccountSelect')).toContainText('Карта RSD');
  await expect(page.locator('input[name=amount]')).toHaveValue('525.7');
  await expect(page.getByTestId('WalletAllocation').locator('input')).toHaveValue('525.7');
  await page.getByTestId('CategorySelect.Item').first().click();
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('WalletDetails')).toBeVisible();
  await expect(
    page.getByTestId('WalletCard').filter({ hasText: 'Алексей' }).getByTestId('WalletBalance'),
  ).toContainText('99\u00a0474.3');
});

test('create named profiles and wallets, personalize order, and disable the feature without losing data', async ({
  page,
}) => {
  await page.goto('/settings/participants');
  await page.getByRole('button', { name: 'Добавить участника', exact: true }).click();
  await page.locator('[name=participant-name]').fill('Дмитрий');
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('ParticipantForm')).not.toBeVisible();
  await page.getByTestId('ParticipantPicker').selectOption({ label: 'Дмитрий' });
  await page.goto('/settings/wallets');
  await page.getByRole('button', { name: 'Создать кошелёк', exact: true }).click();
  await page.locator('[name=wallet-name]').fill('Резерв Дмитрия');
  await page.locator('[name=wallet-owner]').selectOption({ label: 'Дмитрий' });
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletCard').first()).toContainText('Резерв Дмитрия');
  await page.goto('/settings/participants');
  await page.locator('[name=participant-currency]').fill('EUR');
  await page.locator('[name=participant-currency]').blur();
  await page.getByRole('button', { name: 'Выше Счёт EUR', exact: true }).click();
  await page.getByRole('button', { name: 'Готово', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('ParticipantPicker').locator('option:checked')).toHaveText('Дмитрий');
  await page.goto('/settings/wallets');
  await expect(page.getByTestId('EnableWallets')).toBeChecked();
  await page.getByTestId('EnableWallets').uncheck();
  await expect(page.getByTestId('MenuItem')).toHaveText(['Долги', 'Счета', 'Аналитика', 'Настройки']);
  await expect(page.getByTestId('WalletCard')).toHaveCount(4);
  await page.goto('/');
  await expect(page).toHaveURL(/\/accounts/);
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: 'Категории', exact: true })).toBeVisible();
});

test('swiping wallet cards changes history and archived wallets remain readable', async ({ page }) => {
  await page.getByTestId('WalletCards').evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
  await expect(page).toHaveURL(/wallet=holiday/);
  await page.goto('/settings/wallets');
  const row = page.locator('.wallet-management > .row').filter({ hasText: 'Алексей' });
  await row.getByRole('button', { name: 'Архивировать', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Восстановить', exact: true })).toBeVisible();
  await page.goto('/wallets?wallet=alex-wallet');
  await expect(page.getByTestId('WalletHistoryEntry')).toHaveCount(1);
  await expect(page.getByTestId('WalletAddExpense')).toHaveCount(0);
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Алексей' })).toContainText('100\u00a0000');
});

test('wallets match account counters and day headers, totaling only wallet spending shares', async ({ page }) => {
  const data = JSON.parse(backup);
  const split = (amount: number) => ({
    shares: [
      { walletId: 'alex-wallet', amount },
      { walletId: 'maria-wallet', amount },
    ],
  });
  const date = '2026-11-22T09:00:00Z';
  data.accounts[0].showReceiptScanButton = true;
  data.operations.push(
    { id: 'dinner', accountId: 'rsd', categoryId: 'rent', amount: 10000, date, walletAllocation: split(5000) },
    { id: 'lunch', accountId: 'rsd', categoryId: 'rent', amount: 3000, date, walletAllocation: split(1500) },
    { id: 'eur-rent', accountId: 'eur', categoryId: 'rent', amount: 900, date, walletAllocation: split(450) },
    {
      id: 'exchange-out',
      accountId: 'rsd',
      categoryId: '00000000-0001-0002-8ff6-187bca92f3f9',
      amount: 120000,
      date,
      linkedTransactionId: 'exchange-in',
      walletAllocation: split(60000),
    },
    {
      id: 'exchange-in',
      accountId: 'eur',
      categoryId: '00000000-0001-0001-b91e-1a1822f82ab9',
      amount: 1000,
      date,
      linkedTransactionId: 'exchange-out',
      walletAllocation: split(500),
    },
    {
      id: 'excluded',
      accountId: 'rsd',
      categoryId: 'rent',
      amount: 1000,
      date,
      excludeFromAnalysis: true,
      walletAllocation: split(500),
    },
  );
  data.walletTransfers.push({
    id: 'saving',
    currency: 'RSD',
    fromWalletId: 'alex-wallet',
    toWalletId: 'holiday',
    amount: 10000,
    date,
  });
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('OperationsHeader')).toContainText('7 шт.');
  const days = page.getByTestId('WalletDayGroup');
  await expect(days).toHaveCount(2);
  await expect(days.first()).toContainText('22 ноября 2026, воскресенье');
  await expect(days.first().getByTestId('DayExpenses')).toHaveText('-6\u00a0500\u00a0RSD-450\u00a0EUR');
  await expect(days.last().getByTestId('DayExpenses')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/12-wallet-day-totals.png', animations: 'disabled' });
  await page.goto('/accounts?account-card=rsd', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('OperationsHeader')).toContainText('5 шт.');
  await expect(page.getByTestId('DayExpenses').first()).toHaveText('-13\u00a0000\u00a0RSD');
  await page.screenshot({ path: 'output/virtual-wallets/13-account-day-totals.png', animations: 'disabled' });
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Поиск', { exact: true }).fill('Аренда');
  await expect(page.getByTestId('OperationsHeader')).toContainText('4 шт.');
});

test('create a wallet directly from the wallet header', async ({ page }) => {
  await page.getByRole('link', { name: 'Создать кошелёк', exact: true }).click();
  const form = page.getByTestId('WalletForm');
  await expect(form).toBeVisible();
  await form.locator('input[name="wallet-name"]').fill('На дом');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(form).toHaveCount(0);
  await page.goto('/wallets', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'На дом' })).toBeAttached();
});
