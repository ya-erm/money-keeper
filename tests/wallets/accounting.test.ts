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
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
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
  await page.getByTestId('SourceWalletSelect').getByRole('button').click();
  await page.getByTestId('SourceWalletSelect.Portal').getByRole('button', { name: 'Алексей', exact: true }).click();
  await page.locator('[name=wallet-amount]').fill('20000');
  await page.getByTestId('WalletCurrencyButton').click();
  await page.getByTestId('RecentWalletCurrencies').getByRole('button', { name: 'RSD', exact: true }).click();
  await page.getByTestId('WalletCurrencyForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletCurrencyForm')).toHaveCount(0);
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
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
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
  await page.getByRole('link', { name: 'Добавить участника', exact: true }).click();
  await page.locator('[name=participant-name]').fill('Дмитрий');
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('ParticipantForm')).not.toBeVisible();
  await page.getByTestId('ParticipantPicker').selectOption({ label: 'Дмитрий' });
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await page.goto('/settings/wallets');
  await page.getByRole('link', { name: 'Создать кошелёк', exact: true }).click();
  await page.locator('[name=wallet-name]').fill('Резерв Дмитрия');
  await page.locator('[name=wallet-owner]').selectOption({ label: 'Дмитрий' });
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletCard').first()).toContainText('Резерв Дмитрия');
  await page.goto('/settings/participants');
  await page.getByRole('link', { name: 'Редактировать Дмитрий', exact: true }).click();
  await expect(page.getByTestId('ParticipantPreferences')).toHaveCount(0);
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
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
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await expect(page).toHaveURL(/\/wallets\/edit\?id=alex-wallet/);
  await page.getByRole('button', { name: 'Архивировать', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await expect(page.getByTestId('ActiveWallets').getByTestId('WalletCard')).toHaveCount(2);
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

test('card options open a separate editor, archive, restore and delete without changing bank operations', async ({
  page,
}) => {
  await page.goto('/settings/wallets', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await expect(page.getByTestId('WalletForm')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/16-settings-wallet-cards.png', animations: 'disabled' });
  const openEditor = async (name: string, archived = false) => {
    if (archived) await page.getByTestId('ArchivedWallets').locator('summary').click();
    await page
      .getByTestId('WalletCard')
      .filter({ hasText: name })
      .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
      .click();
    await expect(page).toHaveURL(/\/wallets\/edit\?id=alex-wallet/);
    await expect(page.getByTestId('EnableWallets')).toHaveCount(0);
  };
  await openEditor('Алексей');
  await expect(page.getByRole('button', { name: 'Удалить', exact: true })).toHaveCount(0);
  await page.locator('[name=wallet-name]').fill('Личный бюджет');
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await openEditor('Личный бюджет');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[name=wallet-name]')).toHaveValue('Личный бюджет');
  await page.screenshot({ path: 'output/virtual-wallets/17-edit-wallet-page.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Архивировать', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await expect(page.getByTestId('ActiveWallets').getByTestId('WalletCard')).toHaveCount(2);
  await openEditor('Личный бюджет', true);
  await page.getByRole('button', { name: 'Восстановить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await expect(page.getByTestId('ActiveWallets').getByTestId('WalletCard')).toHaveCount(3);
  await openEditor('Личный бюджет');
  await page.getByRole('button', { name: 'Архивировать', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await openEditor('Личный бюджет', true);
  await page.screenshot({ path: 'output/virtual-wallets/18-archived-wallet-editor.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  const confirmation = page.getByTestId('DeleteWalletConfirmation');
  await confirmation.getByRole('button', { name: 'Отмена', exact: true, includeHidden: true }).click();
  await expect(page.getByTestId('WalletForm')).toBeVisible();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Удалить', exact: true, includeHidden: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await expect(page.getByTestId('WalletCard')).toHaveCount(2);
  await page.goto('/accounts?account-card=rsd', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('TransactionListItem')).toHaveCount(1);
  await expect(page.getByTestId('OperationWalletAllocation')).toHaveAttribute(
    'aria-label',
    'Распределено между участниками: 50/50',
  );
});

test('create page supports cancel and main-card editing returns to wallet history', async ({ page }) => {
  await page.goto('/settings/wallets', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Создать кошелёк', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\/create/);
  await expect(page.getByTestId('WalletCard')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/19-create-wallet-page.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\?wallet=alex-wallet$/);
  await page.goto('/wallets/edit?id=missing', { waitUntil: 'networkidle' });
  await expect(page.getByText('Кошелёк не найден', { exact: true })).toBeVisible();
  await expect(page.getByTestId('WalletForm')).toHaveCount(0);
});

test('participant dropdown selects device profiles and avatar rows open editors without changing the selection', async ({
  page,
}) => {
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantRow')).toHaveCount(2);
  await expect(page.getByTestId('ParticipantAvatar')).toHaveCount(2);
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('alex');
  await expect(page.locator('[data-testid=ParticipantRow][data-id=alex]')).toHaveClass(/selected/);
  await expect(page.locator('[data-testid=ParticipantRow][data-id=alex] strong')).toHaveText('Алексей');
  await page.screenshot({ path: 'output/virtual-wallets/36-participants-list.png', animations: 'disabled' });
  await page.getByRole('link', { name: 'Редактировать Мария', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants\/edit\?id=maria$/);
  await page.locator('[name=participant-name]').fill('Мария Иванова');
  await expect(page.locator('[name=participant-currency]')).toHaveCount(0);
  await page.locator('[name=allocation-preset]').selectOption('other');
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('alex');
  await page.getByRole('link', { name: 'Редактировать Мария Иванова', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants\/edit\?id=maria$/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[name=participant-currency]')).toHaveCount(0);
  await expect(page.locator('[name=allocation-preset]')).toHaveValue('other');
  await page.screenshot({ path: 'output/virtual-wallets/37-participant-editor.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await page.getByTestId('ParticipantPicker').selectOption('maria');
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('maria');
  await page.getByTestId('ParticipantPicker').selectOption('');
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('');
});

test('deleting the selected participant preserves wallets, bank operations and contribution names after reload', async ({
  page,
}) => {
  const data = JSON.parse(backup);
  data.walletTransfers.push({
    id: 'saved-by-alex',
    currency: 'RSD',
    amount: 10000,
    date: '2026-11-21T10:00:00Z',
    fromWalletId: 'alex-wallet',
    toWalletId: 'holiday',
    contributorParticipantId: 'alex',
  });
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Редактировать Алексей', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  const confirmation = page.getByTestId('DeleteParticipantConfirmation');
  await confirmation.getByRole('button', { name: 'Отмена', exact: true, includeHidden: true }).click();
  await expect(page.getByTestId('ParticipantForm')).toBeVisible();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Удалить', exact: true, includeHidden: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  await expect(page.getByTestId('ParticipantRow')).toHaveCount(1);
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantRow')).toHaveCount(1);
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await expect(page.getByTestId('WalletCard').filter({ hasText: 'Алексей' })).toContainText('90\u00a0000');
  await page.goto('/wallets?wallet=holiday', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('WalletContribution')).toContainText('Алексей');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const backupAfterDeletion = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(backupAfterDeletion.participants).toContainEqual(
    expect.objectContaining({ id: 'alex', name: 'Алексей', deleted: true }),
  );
  await page.goto('/accounts?account-card=rsd', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('TransactionListItem')).toHaveCount(1);
  await page.goto('/settings/participants');
  await page.getByTestId('ParticipantPicker').selectOption('maria');
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('ParticipantPicker')).toHaveValue('maria');
  await page.goto('/transactions/create?type=OUT', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('WalletAllocation').locator('input')).toHaveCount(1);
  await page.goto('/settings/participants', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Редактировать Мария', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await page
    .getByTestId('DeleteParticipantConfirmation')
    .getByRole('button', { name: 'Удалить', exact: true, includeHidden: true })
    .click();
  await expect(page.getByTestId('ParticipantRow')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/38-participants-empty.png', animations: 'disabled' });
  await page.getByRole('link', { name: 'Добавить участника', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants\/create$/);
  await expect(page.getByTestId('ParticipantRow')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/39-create-participant.png', animations: 'disabled' });
  await page.locator('[name=participant-name]').fill('Иван');
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('ParticipantRow')).toContainText('Иван');
  await expect(page.getByTestId('ParticipantPicker').locator('option:checked')).toHaveText('Иван');
});

test('main currency is saved per participant from Settings and recent badges scroll in one row', async ({ page }) => {
  const data = JSON.parse(backup);
  for (const [index, currency] of ['USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NOK', 'SEK'].entries()) {
    data.accounts.push({ id: currency, name: currency, currency });
    data.operations.push({
      id: `recent-${currency}`,
      accountId: currency,
      categoryId: 'income',
      date: new Date(Date.UTC(2026, 10, 21, 12, 0, -index)).toISOString(),
      amount: 1,
    });
  }
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Основная валюта/ }).click();
  const form = page.getByTestId('MainCurrencyForm');
  await expect(page.getByTestId('MainCurrencyParticipant')).toHaveText('Алексей');
  const badges = page.getByTestId('RecentMainCurrencies');
  await expect(badges.getByRole('button').first()).toHaveText('USD');
  const dimensions = await badges.getByTestId('TagsContainer').evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
    tops: Array.from(element.querySelectorAll('button')).map((button) => button.getBoundingClientRect().top),
  }));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
  expect(new Set(dimensions.tops).size).toBe(1);
  await page.screenshot({ path: 'output/virtual-wallets/42-main-currency-badges.png', animations: 'disabled' });
  await badges.getByRole('button', { name: 'SEK', exact: true }).click();
  await expect(form.locator('input[name=currency]')).toHaveValue('SEK');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(form).toHaveCount(0);
  await page.getByRole('button', { name: /Основная валюта/ }).click();
  await expect(form.locator('input[name=currency]')).toHaveValue('SEK');
  await badges.getByRole('button', { name: 'GBP', exact: true }).click();
  await form.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(form).toHaveCount(0);
  await page.getByRole('button', { name: /Основная валюта/ }).click();
  await expect(form.locator('input[name=currency]')).toHaveValue('SEK');
  await form.getByRole('button', { name: 'Отмена', exact: true }).click();
  await page.goto('/settings/participants');
  await page.getByTestId('ParticipantPicker').selectOption('maria');
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Основная валюта/ }).click();
  await expect(page.getByTestId('MainCurrencyParticipant')).toHaveText('Мария');
  await expect(form.locator('input[name=currency]')).not.toHaveValue('SEK');
  await form.locator('input[name=currency]').fill('eur');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(form).toHaveCount(0);
  await page.goto('/settings/participants');
  await page.getByTestId('ParticipantPicker').selectOption('alex');
  await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  await page.getByRole('link', { name: 'Редактировать Алексей', exact: true }).click();
  await expect(page.locator('[name=participant-currency]')).toHaveCount(0);
  await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/participants$/);
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Основная валюта/ }).click();
  await expect(form.locator('input[name=currency]')).toHaveValue('SEK');
});

test('personal sorting remains available and legacy hiding preferences do not hide accounts or wallets', async ({
  page,
}) => {
  test.setTimeout(90000);
  const data = JSON.parse(backup);
  data.participants[0].hiddenAccountIds = ['rsd', 'eur'];
  data.participants[0].hiddenWalletIds = ['alex-wallet', 'maria-wallet', 'holiday'];
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/accounts', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('AccountCard')).toHaveCount(2);
  await page.goto('/');
  await expect(page).toHaveURL(/\/wallets\?wallet=alex-wallet$/);
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await page.goto('/transactions/create?type=OUT', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('SourceAccountSelect')).toContainText('Карта RSD');
  await expect(page.getByTestId('WalletAllocation').locator('select')).toHaveValue('alex-wallet');
  await page.getByTestId('SourceAccountSelect').getByRole('button').click();
  await expect(
    page.getByTestId('SourceAccountSelect.Portal').getByTestId('AccountSortList').locator(':scope > li'),
  ).toHaveCount(2);
  await page.getByTestId('SourceAccountSelect.Portal').getByRole('button', { name: 'Счёт EUR', exact: true }).click();
  await expect(page.getByTestId('SourceAccountSelect')).toContainText('Счёт EUR');
  const selectParticipant = async (id: string) => {
    await page.goto('/settings/participants');
    await page.getByTestId('ParticipantPicker').selectOption(id);
    await expect(page.getByTestId('ParticipantPicker')).toBeEnabled();
  };
  const moveUp = async (listId: string, id: string) => {
    const row = page.getByTestId(listId).locator(`:scope > li[data-id="${id}"]`);
    await expect(row).toHaveAttribute('tabindex', '0');
    await row.focus();
    await row.press('Space');
    await row.press('ArrowUp');
    await expect(page.getByTestId(listId).locator(':scope > li').first()).toHaveAttribute('data-id', id);
    await row.press('Space');
  };
  await page.goto('/accounts/list');
  await page.getByRole('button', { name: 'Сортировка счетов', exact: true }).click();
  await moveUp('AccountSortList', 'eur');
  await expect(page.getByRole('button', { name: 'Показать Карта RSD', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Карта RSD', exact: true })).toBeInViewport();
  await page.screenshot({ path: 'output/virtual-wallets/44-account-sort.png', animations: 'disabled' });
  await page.locator('.sorting').getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByTestId('AccountSortList').locator(':scope > li').first()).toHaveAttribute('data-id', 'rsd');
  await page.getByRole('button', { name: 'Сортировка счетов', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Скрыть Карта RSD', exact: true })).toHaveCount(0);
  await moveUp('AccountSortList', 'eur');
  await page.locator('.sorting').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).not.toHaveURL(/action=sort/);
  await page.reload();
  await expect(page.getByTestId('AccountSortList').locator(':scope > li').first()).toHaveAttribute('data-id', 'eur');
  await page.goto('/accounts');
  await expect(page.getByTestId('AccountCard')).toHaveCount(2);
  await page.goto('/analytics/accounts');
  await expect(page.getByRole('cell', { name: 'Карта RSD RSD', exact: true })).toBeVisible();
  await selectParticipant('maria');
  await page.goto('/accounts');
  await expect(page.getByTestId('AccountCard')).toHaveCount(2);
  await page.goto('/wallets');
  await page.getByRole('link', { name: 'Список кошельков', exact: true }).click();
  await expect(page.getByTestId('WalletListItem').first()).toContainText('Мария');
  await page.screenshot({ path: 'output/virtual-wallets/45-wallet-list.png', animations: 'disabled' });
  await selectParticipant('alex');
  await page.goto('/wallets/list');
  await page.getByRole('button', { name: 'Сортировка кошельков', exact: true }).click();
  await moveUp('WalletSortList', 'maria-wallet');
  await expect(page.getByRole('button', { name: 'Показать Алексей', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('WalletListItem').first()).toBeInViewport();
  await page.screenshot({ path: 'output/virtual-wallets/46-wallet-sort.png', animations: 'disabled' });
  await page.locator('.sorting-bar').getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByTestId('WalletListItem').first()).toHaveAttribute('data-id', 'alex-wallet');
  await page.getByRole('button', { name: 'Сортировка кошельков', exact: true }).click();
  await moveUp('WalletSortList', 'maria-wallet');
  await page.locator('.sorting-bar').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\/list$/);
  await page.reload();
  await expect(page.getByTestId('WalletListItem').first()).toHaveAttribute('data-id', 'maria-wallet');
  await page.goto('/wallets');
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await selectParticipant('maria');
  await page.goto('/wallets');
  await expect(page.getByTestId('WalletCard')).toHaveCount(3);
  await page.goto('/wallets/list');
  await page.getByRole('link', { name: 'Создать кошелёк', exact: true }).click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\/list$/);
  await page.getByRole('link', { name: 'Создать кошелёк', exact: true }).click();
  await page.locator('[name=wallet-name]').fill('Новый резерв');
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\/list$/);
  await expect(page.getByTestId('WalletListItem').filter({ hasText: 'Новый резерв' })).toBeVisible();
});

test('reallocation is separate from settings, uses wallet previews and recent currencies, and preserves edited timestamps', async ({
  page,
}) => {
  test.setTimeout(60000);
  const data = JSON.parse(backup);
  for (const currency of ['USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NOK', 'SEK']) {
    data.accounts.push({ id: currency, name: currency, currency });
  }
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/settings/wallets', { waitUntil: 'networkidle' });
  const explanation = page.getByText(
    'Виртуальные кошельки позволяют распределить деньги со счетов без реальных операций',
    { exact: true },
  );
  await expect(explanation).toBeVisible();
  const toggleBox = await page.getByTestId('EnableWallets').boundingBox();
  const hintBox = await explanation.boundingBox();
  const headingBox = await page.getByRole('heading', { name: 'Кошельки', exact: true }).boundingBox();
  expect(hintBox!.y).toBeGreaterThan(toggleBox!.y);
  expect(hintBox!.y + hintBox!.height).toBeLessThan(headingBox!.y);
  await expect(page.getByTestId('WalletTransferForm')).toHaveCount(0);
  await page.screenshot({ path: 'output/virtual-wallets/51-wallet-settings-explanation.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Перераспределить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\/transfer\?from=settings$/);
  await expect(page.getByTestId('EnableWallets')).toHaveCount(0);
  await expect(page.getByTestId('ActiveWallets')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Отмена', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await page.goto('/wallets?wallet=holiday', { waitUntil: 'networkidle' });
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Отпуск' })
    .getByRole('link', { name: 'Перераспределить', exact: true })
    .click();
  await expect(page).toHaveURL(/\/wallets\/transfer\?to=holiday$/);
  await expect(page.getByTestId('DestinationWalletSelect')).toContainText('Куда');
  await expect(page.getByTestId('DestinationWalletSelect')).toContainText('Отпуск');
  await page.getByTestId('SourceWalletSelect').getByRole('button').click();
  const chooser = page.getByTestId('SourceWalletSelect.Portal');
  await expect(chooser.getByTestId('WalletListItem')).toHaveCount(4);
  await expect(chooser.getByRole('button', { name: 'Алексей', exact: true })).toContainText('100\u00a0000');
  await page.screenshot({ path: 'output/virtual-wallets/52-wallet-selector.png', animations: 'disabled' });
  await chooser.getByPlaceholder('Поиск', { exact: true }).fill('Алексей');
  await chooser.getByRole('button', { name: 'Алексей', exact: true }).click();
  await expect(page.getByTestId('SourceWalletSelect')).toContainText('Откуда');
  await page.getByTestId('WalletCurrencyButton').click();
  const currencies = page.getByTestId('RecentWalletCurrencies');
  const dimensions = await currencies.getByTestId('TagsContainer').evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
    tops: Array.from(element.querySelectorAll('button')).map((button) => button.getBoundingClientRect().top),
  }));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
  expect(new Set(dimensions.tops).size).toBe(1);
  await currencies.getByRole('button', { name: 'RSD', exact: true }).click();
  await page.screenshot({ path: 'output/virtual-wallets/53-wallet-currencies.png', animations: 'disabled' });
  await page.getByTestId('WalletCurrencyForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletCurrencyForm')).toHaveCount(0);
  await page.locator('[name=wallet-amount]').fill('5000');
  await page.locator('[name=wallet-date]').fill('2026-11-21');
  await page.locator('[name=wallet-time]').fill('14:37');
  await page.locator('[name=wallet-comment]').fill('Перевод на отпуск');
  await expect(page.locator('[name=wallet-amount]')).toHaveValue('5000');
  await expect(page.locator('[name=wallet-comment]')).toHaveValue('Перевод на отпуск');
  await page.screenshot({ path: 'output/virtual-wallets/54-wallet-transfer-page.png', animations: 'disabled' });
  await page.getByTestId('WalletTransferForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\?wallet=holiday$/);
  const entry = page.getByTestId('WalletHistoryEntry').filter({ hasText: 'Перевод на отпуск' });
  await expect(entry).toContainText('5\u00a0000');
  await entry.getByRole('button').click();
  await expect(page).toHaveURL(/\/wallets\/transfer\?transfer=/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[name=wallet-date]')).toHaveValue('2026-11-21');
  await expect(page.locator('[name=wallet-time]')).toHaveValue('14:37');
  await page.locator('[name=wallet-time]').fill('15:42');
  await page.getByTestId('WalletTransferForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\?wallet=holiday$/);
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const saved = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(saved.operations).toHaveLength(1);
  expect(saved.walletTransfers).toHaveLength(1);
  expect(saved.walletTransfers[0]).toMatchObject({
    date: '2026-11-21T12:42:00.000Z',
    amount: 5000,
    contributorParticipantId: 'alex',
  });
  await page.goto(`/settings/wallets?action=transfer&transfer=${saved.walletTransfers[0].id}`);
  await expect(page).toHaveURL(/\/wallets\/transfer\?transfer=/);
  await expect(page.locator('[name=wallet-time]')).toHaveValue('15:42');
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\?wallet=holiday$/);
  await expect(page.getByTestId('WalletHistoryEntry')).toHaveCount(0);
  await page.goto('/wallets/transfer?transfer=missing');
  await expect(page.getByText('Перераспределение не найдено', { exact: true })).toBeVisible();
  await expect(page.getByTestId('WalletTransferForm')).toHaveCount(0);
});

test('wallet dots open editing directly and icons support recommendations and custom sets', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/settings/wallets', { waitUntil: 'networkidle' });
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await expect(page).toHaveURL(/\/wallets\/edit\?id=alex-wallet/);
  await expect(page.getByTestId('WalletOptions')).toHaveCount(0);
  await page.getByTestId('WalletIconButton').click();
  const icons = page.getByTestId('WalletIconPicker');
  await page.screenshot({ path: 'output/virtual-wallets/55-wallet-icons.png', animations: 'disabled' });
  await icons.locator('[data-testid=IconChoice][data-id="mdi:piggy-bank-outline"]').click();
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await page.getByTestId('WalletIconButton').click();
  await icons.getByText('Пользовательский', { exact: true }).click();
  await icons.locator('[name=icon]').fill('ion:people');
  await icons.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(icons).toHaveCount(0);
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: 'output/virtual-wallets/56-custom-wallet-icon.png', animations: 'disabled' });
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await page.getByTestId('WalletIconButton').click();
  await expect(icons.locator('[name=icon]')).toHaveValue('ion:people');
  await icons.locator('[name=icon]').fill('mdi:home-outline');
  await icons.getByRole('button', { name: 'Назад', exact: true }).click();
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/wallets$/);
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('button', { name: 'Редактировать кошелёк', exact: true })
    .click();
  await expect(page).toHaveURL(/\/wallets\/edit\?id=alex-wallet/);
  await page.getByTestId('WalletForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets\?wallet=alex-wallet$/);
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const saved = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(saved.virtualWallets.find((wallet: { id: string }) => wallet.id === 'alex-wallet').icon).toBe('ion:people');
});

test('shared operation metadata shows outlined percentages and tags without a dot prefix in bank and wallet histories', async ({
  page,
}) => {
  const data = JSON.parse(backup);
  data.knownPlaces = [{ id: 'home', name: 'Дом', latitude: 44.8, longitude: 20.4 }];
  data.debtContacts = [{ id: 'oleg', name: 'Олег' }];
  data.operationTags = [
    { id: 'food', name: 'Еда' },
    { id: 'family', name: 'Семья' },
  ];
  const operation = (id: string, comment: string, amounts: number[], extra = {}) => ({
    id,
    comment,
    accountId: 'rsd',
    categoryId: 'rent',
    amount: amounts.reduce((sum, amount) => sum + amount, 0),
    date: '2026-11-21T10:00:00Z',
    tagIds: ['food', 'family'],
    walletAllocation: {
      shares: amounts.map((amount, index) => ({ walletId: ['alex-wallet', 'maria-wallet', 'holiday'][index], amount })),
    },
    ...extra,
  });
  data.operations.push(
    operation('even', 'Поровну', [500, 500]),
    operation('uneven', 'Неравные доли', [367, 633], {
      locationLat: 44.8,
      locationLng: 20.4,
      debt: { kind: 'expense', shares: [{ contactId: 'oleg', amount: 200 }] },
    }),
    operation('thirds', 'Три кошелька', [1, 1, 1]),
    operation('personal', 'Личное с тегами', [1000], { locationLat: 44.8, locationLng: 20.4 }),
    operation('debt-tags', 'Долг с тегами', [1000], {
      debt: { kind: 'expense', shares: [{ contactId: 'oleg', amount: 200 }] },
    }),
  );
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/accounts?account-card=rsd', { waitUntil: 'networkidle' });
  const row = (id: string) => page.locator(`[data-testid=TransactionListItem][data-id="${id}"]`);
  for (const [id, ratio] of [
    ['even', '50/50'],
    ['uneven', '37/63'],
    ['thirds', '34/33/33'],
  ]) {
    const indicator = row(id).getByTestId('OperationWalletAllocation');
    await expect(indicator).toHaveText(ratio);
    await expect(indicator).toHaveAttribute('aria-label', `Распределено между участниками: ${ratio}`);
    await expect(indicator.locator('svg path[fill=none][stroke=currentColor]')).not.toHaveCount(0);
    await expect(row(id).getByTestId('OperationMetadata')).not.toContainText(/·\s*#/);
    await expect(row(id).locator('.tag')).toHaveText(['#Еда', '#Семья']);
  }
  const combined = row('uneven').getByTestId('OperationMetadata');
  await expect(combined).toContainText(/Дом.*Олег.*37\/63.*#Еда/);
  const positions = await combined.evaluate((element) => {
    const place = element.querySelector('[data-testid=OperationPlaceName]')!.getBoundingClientRect();
    const debt = element.querySelector('[data-testid=TransactionDebtInfo]')!.getBoundingClientRect();
    const allocation = element.querySelector('[data-testid=OperationWalletAllocation]')!.getBoundingClientRect();
    return {
      place: place.x,
      debt: debt.x,
      allocation: allocation.x,
      right: allocation.right,
      containerRight: element.getBoundingClientRect().right,
      height: element.getBoundingClientRect().height,
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    };
  });
  expect(positions.place).toBeLessThan(positions.debt);
  expect(positions.debt).toBeLessThan(positions.allocation);
  expect(positions.right).toBeLessThanOrEqual(positions.containerRight + 1);
  expect(positions.height).toBeLessThanOrEqual(positions.fontSize * 1.5);
  for (const id of ['personal', 'debt-tags']) {
    await expect(row(id).getByTestId('OperationWalletAllocation')).toHaveCount(0);
    await expect(row(id).getByTestId('OperationMetadata')).not.toContainText(/·\s*#/);
  }
  await page.screenshot({ path: 'output/virtual-wallets/59-shared-operation-ratios.png', animations: 'disabled' });
  await page.goto('/wallets?wallet=alex-wallet', { waitUntil: 'networkidle' });
  await expect(row('even').getByTestId('OperationWalletAllocation')).toHaveText('50/50');
  await expect(row('uneven').getByTestId('OperationWalletAllocation')).toHaveText('37/63');
  await expect(row('even').getByTestId('OperationMetadata')).not.toContainText(/·\s*#/);
  await page.screenshot({ path: 'output/virtual-wallets/60-wallet-operation-ratios.png', animations: 'disabled' });
});

test('currency dialog stays centered above the keyboard and follows visible viewport offsets', async ({
  page,
  browserName,
}) => {
  test.setTimeout(60000);
  await page
    .getByTestId('WalletCard')
    .filter({ hasText: 'Алексей' })
    .getByRole('link', { name: 'Перераспределить', exact: true })
    .click();
  await page.evaluate(() => {
    const viewport = Object.assign(new EventTarget(), {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetTop: 0,
      offsetLeft: 0,
    });
    Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
  });
  await page.getByTestId('WalletCurrencyButton').click();
  const dialog = page.getByRole('dialog', { name: 'Валюта', exact: true });
  const center = async () => {
    const box = (await dialog.boundingBox())!;
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  };
  const resize = async (height: number, top: number, width = 390, left = 0, event = 'resize') => {
    await page.evaluate(
      ({ height, top, width, left, event }) => {
        Object.assign(window.visualViewport!, { height, width, offsetTop: top, offsetLeft: left });
        window.visualViewport!.dispatchEvent(new Event(event));
      },
      { height, top, width, left, event },
    );
  };
  await expect.poll(center).toEqual({ x: 195, y: 422 });
  await page.getByTestId('WalletCurrencyForm').locator('[name=wallet-currency]').focus();
  await resize(420, 0);
  await expect.poll(center).toEqual({ x: 195, y: 210 });
  await resize(360, 80, 390, 0, 'scroll');
  await expect.poll(center).toEqual({ x: 195, y: 260 });
  let box = (await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(96);
  expect(box.y + box.height).toBeLessThanOrEqual(424);
  await page.screenshot({
    path: `output/virtual-wallets/65-currency-visible-viewport-${browserName}.png`,
    clip: { x: 0, y: 80, width: 390, height: 360 },
    animations: 'disabled',
  });
  await resize(220, 90, 320, 20);
  await expect.poll(center).toEqual({ x: 180, y: 200 });
  box = (await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(106);
  expect(box.y + box.height).toBeLessThanOrEqual(294);
  expect(box.x).toBeGreaterThanOrEqual(36);
  expect(box.x + box.width).toBeLessThanOrEqual(324);
  expect(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.getByTestId('WalletCurrencyForm').locator('[name=wallet-currency]').fill('RSD');
  await dialog.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('WalletCurrencyForm')).toHaveCount(0);
  await expect(page.getByTestId('WalletCurrencyButton')).toHaveText('RSD');
  await resize(844, 0);
  await page.getByTestId('WalletCurrencyButton').click();
  await expect.poll(center).toEqual({ x: 195, y: 422 });
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByTestId('WalletCurrencyForm')).toHaveCount(0);
  await page.evaluate(() => Object.defineProperty(window, 'visualViewport', { value: null, configurable: true }));
  await page.getByTestId('WalletCurrencyButton').click();
  await page.setViewportSize({ width: 390, height: 600 });
  await expect.poll(center).toEqual({ x: 195, y: 300 });
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByTestId('WalletCurrencyForm')).toHaveCount(0);
});
