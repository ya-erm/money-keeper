import { test, expect } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';
import type { Page } from '@playwright/test';

test.use({ locale: 'ru-RU' });

async function setDebtCurrency(page: Page, currency: string) {
  await page.getByTestId('DebtCurrencyButton').click();
  await page.locator('[name=debt-currency]').fill(currency);
  await page.getByTestId('SaveDebtCurrency').click();
  await expect(page.getByTestId('DebtCurrencyForm')).not.toBeVisible();
}

const backup = JSON.stringify({
  categories: [
    { id: 'food', name: 'Рестораны', type: 'OUT' },
    { id: 'income', name: 'Доход', type: 'IN' },
  ],
  accountTags: [],
  operationTags: [],
  currencyRates: [{ id: 'test-rate', cur1: 'USD', cur2: 'EUR', rate: 1 }],
  groupings: [],
  repeatings: [],
  accounts: [{ id: 'card', name: 'Карта EUR', currency: 'EUR' }],
  debtContacts: [
    { id: 'anna', name: 'Анна' },
    { id: 'max', name: 'Максим' },
    { id: 'misha', name: 'Миша' },
    ...Array.from({ length: 12 }, (_, i) => ({ id: `unused-${i}`, name: `Контакт ${i + 1}` })),
  ],
  debtRecords: [{ id: 'old-loan', contactId: 'misha', amount: -45, currency: 'EUR', date: '2026-11-10T12:00:00Z' }],
  operations: [
    {
      id: 'funding',
      accountId: 'card',
      categoryId: 'income',
      date: '2026-11-01T12:00:00Z',
      amount: 1000,
      comment: 'Пополнение',
    },
    {
      id: 'dinner',
      accountId: 'card',
      categoryId: 'food',
      date: '2026-11-14T12:00:00Z',
      amount: 90,
      comment: 'Ужин с друзьями',
      debt: {
        kind: 'expense',
        shares: [
          { contactId: 'anna', amount: 35 },
          { contactId: 'max', amount: 20 },
        ],
      },
    },
    {
      id: 'bank-return',
      accountId: 'card',
      categoryId: 'income',
      date: '2026-11-15T09:00:00Z',
      amount: 20,
      comment: 'Перевод от Анны',
    },
  ],
});

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime('2026-11-15T12:00:00Z');
  await importMockDataAsync(page, backup);
});

test('debts include all contacts and allow searching, renaming and adding without a separate directory', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('35');
  await page.screenshot({ path: testInfo.outputPath('debts-mobile.png') });
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Контакт 12' })).toContainText('Нет записей');
  await page.locator('input[name=debt-search]').fill('Анна');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await page.getByTestId('DebtPerson').click();
  await expect(page.getByTestId('ContactDetails')).toBeVisible();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Редактировать', exact: true }).click();
  await page.getByTestId('ContactForm').locator('input[name=name]').fill('Анна Петрова');
  await page.screenshot({ path: testInfo.outputPath('contact-editor-mobile.png') });
  await page.getByTestId('SaveContact').click();
  await expect(
    page.getByTestId('ContactDetails').getByRole('heading', { name: 'Анна Петрова', exact: true }),
  ).toBeVisible();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Назад', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('contacts-actions-mobile.png') });
  await page.locator('input[name=debt-search]').fill('');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.screenshot({ path: testInfo.outputPath('contacts-mobile.png') });
  await expect(page.getByTestId('AddContact')).toHaveCount(0);
  await page.getByTestId('AddDebtEntry').click();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Новый контакт');
  await page.getByTestId('PickerAddContact').click();
  await expect(page.getByTestId('ContactEditor')).toBeVisible();
  await page.getByTestId('SaveContact').click();
  await expect(page.getByTestId('ContactPicker')).not.toBeVisible();
  await expect(page.getByTestId('PaymentContact')).toContainText('Новый контакт');
  await page.getByTestId('DebtPaymentForm').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(16);
  await page.goto('/debts/contacts');
  await expect(page).toHaveURL(/\/debts$/);
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна Петрова' })).toContainText('35');
  await page.reload();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна Петрова' })).toContainText('35');
});

test('contact history owns its header, retains navigation and opens editors above a pinned mobile header', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  // Emulate the fixed header enabled by iOS CSS, including its stacking context.
  await page.addStyleTag({
    content: '.navigation-bar { position: fixed !important; top: 0; left: 0; right: 0; z-index: 10; }',
  });
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await expect(page).toHaveURL(/contact-id=anna/);
  const details = page.getByTestId('ContactDetails');
  await expect(details.getByRole('heading', { name: 'Анна', exact: true })).toBeVisible();
  await expect(details.locator('.menu-bar .menu-item')).toHaveText([
    'Долги',
    'Категории',
    'Счета',
    'Аналитика',
    'Настройки',
  ]);
  await expect(page.getByTestId('RecordDebt')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('contact-history-navigation-mobile.png') });
  await details.getByRole('button', { name: 'Редактировать', exact: true }).click();
  await expect(page.getByTestId('ContactEditor')).toBeVisible();
  await expect(
    page.getByTestId('ContactEditor').getByRole('heading', { name: 'Редактировать контакт', exact: true }),
  ).toBeVisible();
  const editorTitle = page.getByTestId('ContactEditor').locator('.navigation-title');
  await expect(editorTitle).toBeInViewport();
  expect(
    await editorTitle.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }),
  ).toBe(true);
  await page.getByTestId('ContactEditor').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('ContactEditor')).not.toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/debts$/);
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.goForward();
  await expect(details).toBeVisible();
  await page.reload();
  await expect(details.getByRole('heading', { name: 'Анна', exact: true })).toBeVisible();
  await details.getByRole('link', { name: 'Счета', exact: true }).click();
  await expect(page).toHaveURL(/\/accounts(?:\?|$)/);
  await page.getByRole('link', { name: 'Долги', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
});

test('browser back closes one nested debt screen at a time and preserves the parent draft', async ({ page }) => {
  await page.goto('/accounts');
  await page.getByRole('link', { name: 'Долги', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  const historyLength = await page.evaluate(() => history.length);
  await page.getByTestId('AddDebtEntry').click();
  await page.locator('[name=debt-amount]').fill('17');
  await page.getByTestId('PaymentContact').click();
  await page.getByTestId('PickerAddContact').click();
  await page.getByTestId('ContactForm').locator('[name=name]').fill('Черновик контакта');
  await expect.poll(() => page.evaluate(() => history.length)).toBe(historyLength + 3);
  await page.goBack();
  await expect(page.getByTestId('ContactEditor')).not.toBeVisible();
  await expect(page.getByTestId('ContactPicker')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('ContactPicker')).not.toBeVisible();
  await expect(page.locator('[name=debt-amount]')).toHaveValue('17');
  await page.getByTestId('PaymentContact').click();
  await page.getByTestId('PickContact').filter({ hasText: 'Анна' }).click();
  await expect(page.getByTestId('ContactPicker')).not.toBeVisible();
  await expect(page.getByTestId('PaymentContact')).toContainText('Анна');
  await page.getByTestId('DebtCurrencyButton').click();
  await page.locator('[name=debt-currency]').fill('USD');
  await page.goBack();
  await expect(page.getByTestId('DebtCurrencyForm')).not.toBeVisible();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('EUR');
  await page.getByTestId('DebtPaymentMethod').selectOption('new');
  await page.getByTestId('DebtAccount').getByRole('button', { name: 'Карта EUR', exact: true }).click();
  await expect(page.getByTestId('DebtAccount.Portal')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('DebtAccount.Portal')).not.toBeVisible();
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('ExistingDebtPayment').click();
  await expect(page.getByTestId('DebtOperationPicker')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('DebtOperationPicker')).not.toBeVisible();
  await expect(page.locator('[name=debt-amount]')).toHaveValue('17');
  await page.goBack();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('AddDebtEntry')).toBeVisible();
  await page.getByTestId('AddDebtEntry').click();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.getByTestId('DebtPaymentForm').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/accounts(?:\?|$)/);
  await page.getByRole('link', { name: 'Долги', exact: true }).click();
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await expect(page).toHaveURL(/contact-id=anna/);
  await page.reload();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page).toHaveURL(/\/debts$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/accounts(?:\?|$)/);
});

test('routed operation editors keep a single back step while participant selection has its own step', async ({
  page,
}) => {
  await page.goto('/transactions');
  await page.getByTestId('TransactionListItem').filter({ hasText: 'Ужин с друзьями' }).click();
  await expect(page).toHaveURL(/operation-id=dinner/);
  await page.getByTestId('AddDebtParticipant').click();
  await expect(page.getByTestId('ContactPicker')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('ContactPicker')).not.toBeVisible();
  await expect(page.getByTestId('SaveTransactionButton')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
});

test('editing an expense and linking an existing repayment updates debt and personal analytics', async ({
  page,
}, testInfo) => {
  await page.goto('/transactions?operation-id=dinner');
  await expect(page.getByTestId('OwnShare')).toContainText('35');
  await page
    .getByTestId('DebtShare')
    .filter({ has: page.locator('[name=debt-share-anna]') })
    .locator('input')
    .fill('40');
  await expect(page.getByTestId('OwnShare')).toContainText('30');
  await page.getByTestId('DebtAllocationEditor').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('split-expense-mobile.png') });
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await page.getByTestId('RecordRepayment').click();
  await page.locator('input[name=debt-amount]').fill('20');
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('ExistingDebtPayment').click();
  await page
    .getByTestId('DebtOperationPicker')
    .getByTestId('TransactionListItem')
    .filter({ hasText: 'Перевод от Анны' })
    .click();
  await expect(page.getByTestId('DebtOperationPicker')).not.toBeVisible();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('repayment-mobile.png') });
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('20');
  await page.reload();
  await expect(page.getByTestId('ContactDetails')).toContainText('20');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(exported.operations).toHaveLength(3);
  expect(exported.operations.find((op: { id: string }) => op.id === 'bank-return').debt.kind).toBe('repayment');
  await page.goto('/analytics/categories');
  await expect(page.locator('li[data-id=food] .amount')).toContainText('30');
  await expect(page.locator('li[data-id=income] .amount')).toContainText('1\u00a0000');
  await page.goto('/accounts');
  await expect(page.getByTestId('AccountBalanceToggle')).toContainText('930');
});

test('expense picker is bounded and can find or create a person in place', async ({ page }, testInfo) => {
  await page.goto('/transactions?operation-id=dinner');
  await page.getByTestId('AddDebtParticipant').click();
  await expect(page.getByTestId('PickContact')).toHaveCount(13);
  await expect(
    page.getByTestId('ContactPicker').getByRole('button', { name: 'Все контакты', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('contacts-picker-mobile.png') });
  await page.locator('input[name=contact-search]').fill('Контакт 12');
  await expect(page.getByTestId('PickContact')).toHaveCount(1);
  await page.getByTestId('PickContact').click();
  await page.locator('input[name=debt-share-unused-11]').fill('5');
  await page.getByTestId('AddDebtParticipant').click();
  await page.locator('input[name=contact-search]').fill('Никита');
  await page.getByTestId('PickerAddContact').click();
  await page.getByTestId('SaveContact').click();
  await expect(page.getByTestId('DebtShare')).toHaveCount(4);
});

test('full repayment keeps the settled contact in the list and deletion of its payment restores the balance', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Миша' }).click();
  await page.getByTestId('RecordRepayment').click();
  await page.locator('input[name=debt-amount]').fill('45');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('Вы рассчитались');
  await page.reload();
  await expect(page.getByTestId('ContactDetails')).toContainText('Вы рассчитались');
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Миша' })).toContainText('Рассчитались');
  await page.getByTestId('DebtFiltersButton').click();
  await page.locator('#debt-filters').getByRole('button', { name: 'Рассчитались', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await expect(page.getByTestId('DebtPerson')).toContainText('Миша');
  await page.screenshot({ path: testInfo.outputPath('debts-settled-mobile.png') });
  await page.getByTestId('DebtPerson').click();
  await expect(page.getByTestId('DebtHistoryEntry')).toHaveCount(2);
  await page.goto('/transactions');
  await page.getByTestId('TransactionListItem').filter({ hasText: 'Расчёты по долгам' }).click();
  await page.getByTestId('DeleteTransactionButton').click();
  await page.getByTestId('ConfirmDebtDeletion').click();
  await expect(page.getByTestId('DeleteTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Миша' })).toContainText('45');
});

for (const direction of ['receivable', 'payable'] as const) {
  for (const method of ['existing', 'new', 'manual'] as const) {
    test(`overpayment reverses the ${direction} balance using ${method} without splitting the payment`, async ({
      page,
    }, testInfo) => {
      const incoming = direction === 'receivable';
      const name = incoming ? 'Анна' : 'Миша';
      const contactId = incoming ? 'anna' : 'misha';
      const label = incoming ? 'Я должен' : 'Мне должны';
      const data = JSON.parse(backup);
      const dinner = data.operations.find((operation: { id: string }) => operation.id === 'dinner');
      dinner.amount = 147;
      dinner.debt.shares[0].amount = 92;
      data.debtRecords[0].amount = -92;
      const original = {
        id: 'overpayment',
        accountId: 'card',
        categoryId: incoming ? 'income' : 'food',
        date: '2026-11-15T10:00:00Z',
        amount: 150,
        comment: 'Возврат с запасом',
      };
      if (method === 'existing') data.operations.push(original);
      await importMockDataAsync(page, JSON.stringify(data));
      await page.goto('/debts');
      await page.getByTestId('DebtPerson').filter({ hasText: name }).click();
      await page.getByTestId('RecordRepayment').click();
      await expect(page.getByTestId('DebtDirection')).toHaveValue(direction);
      await page.getByTestId('DebtPaymentMethod').selectOption(method);
      if (method === 'existing') {
        await page.getByTestId('ExistingDebtPayment').click();
        await page
          .getByTestId('DebtOperationPicker')
          .getByTestId('TransactionListItem')
          .filter({ hasText: original.comment })
          .click();
        await expect(page.getByTestId('DebtOperationPicker')).not.toBeVisible();
      } else {
        await page.locator('[name=debt-amount]').fill('150');
      }
      await expect(page.getByTestId('DebtRemaining')).toContainText(label);
      await expect(page.getByTestId('DebtRemaining')).toContainText('58\u00a0EUR');
      if (method === 'existing') {
        await page.getByTestId('SaveDebtPayment').scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`overpayment-${direction}-390px.png`) });
      }
      await page.getByTestId('SaveDebtPayment').click();
      await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
      await expect(page.getByTestId('ContactDetails').locator('.balance-row')).toContainText(label);
      await expect(page.getByTestId('ContactDetails').locator('.balance')).toContainText('58\u00a0EUR');
      await page.reload();
      await expect(page.getByTestId('ContactDetails').locator('.balance-row')).toContainText(label);
      await expect(page.getByTestId('ContactDetails').locator('.balance')).toContainText('58\u00a0EUR');
      if (method === 'existing' && incoming)
        await page.screenshot({ path: testInfo.outputPath('overpayment-history-390px.png') });
      await page.goto('/settings/import-export');
      await page.getByTestId('ShowExportTextAreaButton').click();
      const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
      expect(exported.operations).toHaveLength(data.operations.length + (method === 'new' ? 1 : 0));
      expect(exported.debtRecords).toHaveLength(data.debtRecords.length + (method === 'manual' ? 1 : 0));
      if (method === 'manual') {
        expect(exported.debtRecords).toContainEqual(
          expect.objectContaining({ contactId, kind: 'repayment', amount: incoming ? -150 : 150, currency: 'EUR' }),
        );
      } else {
        const linked = exported.operations.filter(
          (operation: { debt?: { kind: string; shares: { contactId: string }[] } }) =>
            operation.debt?.kind === 'repayment' && operation.debt.shares[0]?.contactId === contactId,
        );
        expect(linked).toHaveLength(1);
        expect(linked[0]).toMatchObject({
          amount: 150,
          accountId: 'card',
          debt: { kind: 'repayment', shares: [{ contactId, amount: 150 }] },
        });
        if (method === 'existing') expect(linked[0]).toMatchObject(original);
      }
    });
  }
}

test('new loan and manual debt can be saved offline and survive reload', async ({ page }) => {
  // Before noon, a date-only debt must take effect immediately rather than become a future operation.
  await page.clock.setSystemTime('2026-11-15T05:00:00Z');
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.context().setOffline(true);
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('input[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.locator('input[name=debt-amount]').fill('25');
  await setDebtCurrency(page, 'EUR');
  await page.getByTestId('DebtPaymentMethod').selectOption('new');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('60');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('input[name=contact-search]').fill('Максим');
  await page.getByTestId('PickContact').click();
  await page.locator('input[name=debt-amount]').fill('10');
  await setDebtCurrency(page, 'RSD');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('60');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Максим' })).toContainText('RSD');
  await page.goto('/accounts');
  await expect(page.getByTestId('AccountBalanceToggle')).toContainText('885');
});

test('archiving preserves outstanding debts but removes a contact from the picker', async ({ page }, testInfo) => {
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.getByTestId('DebtFiltersButton').click();
  const filters = page.locator('#debt-filters');
  await filters.getByRole('button', { name: 'Архивные контакты', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(0);
  await expect(page.getByTestId('DebtEmptyState')).toHaveText('Архивных контактов нет.');
  await page.screenshot({ path: testInfo.outputPath('contacts-empty-archive-mobile.png') });
  await filters.getByRole('button', { name: 'Все контакты', exact: true }).click();
  await page.locator('input[name=debt-search]').fill('Анна');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await page.getByTestId('DebtPerson').click();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Редактировать', exact: true }).click();
  await page.getByRole('button', { name: 'В архив', exact: true }).click();
  await expect(page.getByTestId('ContactEditor')).not.toBeVisible();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('35');
  await filters.getByRole('button', { name: 'Архивные контакты', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await expect(page.getByTestId('DebtPerson')).toContainText('Анна');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('input[name=contact-search]').fill('Анна');
  await expect(page.getByTestId('PickContact')).toHaveCount(0);
});

test('debt screens fit mobile and desktop, and follow the dark theme', async ({ page }, testInfo) => {
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  const menu = page.locator('.menu-bar .menu-item');
  await expect(menu).toHaveText(['Долги', 'Категории', 'Счета', 'Аналитика', 'Настройки']);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
          right: el.getBoundingClientRect().right,
          text: el.textContent?.slice(0, 30),
        }))
        .slice(0, 12),
    }));
    expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: testInfo.outputPath('debts-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem('mk_dark_mode', 'true'));
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.screenshot({ path: testInfo.outputPath('debts-dark-mobile.png') });
});

test('debt fields belong to additional parameters and my share is only a partial expense', async ({
  page,
}, testInfo) => {
  await page.goto('/transactions?operation-id=dinner');
  const additional = page.getByTestId('AdditionalParameters');
  await expect(additional.getByRole('checkbox', { name: 'Связано с долгами', exact: true })).toHaveCount(0);
  await expect(additional.getByTestId('DebtAllocationEditor')).toBeVisible();
  await expect(page.getByTestId('DebtKind')).toHaveCount(0);
  await page.locator('[name=debt-share-anna]').fill('70');
  await expect(page.getByTestId('OwnShare')).toHaveCount(0);
  await page.getByRole('button', { name: 'Убрать участника', exact: true }).first().click();
  await page.getByRole('button', { name: 'Убрать участника', exact: true }).first().click();
  await expect(page.getByTestId('DebtShare')).toHaveCount(0);
  await expect(page.getByTestId('AddDebtParticipant')).toBeVisible();
  for (const name of ['Анна', 'Максим']) {
    await page.getByTestId('AddDebtParticipant').click();
    await page.locator('[name=contact-search]').fill(name);
    await expect(page.getByTestId('PickContact')).toHaveCount(1);
    await page.getByTestId('PickContact').click();
  }
  await expect(page.getByTestId('DebtShare')).toHaveCount(2);
  await expect(page.getByTestId('DebtShare').locator('.avatar')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Убрать участника', exact: true }).first()).toHaveClass(/danger/);
  await page.locator('[name=debt-share-anna]').fill('40');
  await page.locator('[name=debt-share-max]').fill('20');
  await expect(page.getByTestId('OwnShare')).toContainText('30');
  await additional.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('operation-debt-additional-mobile.png') });
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('40');
});

test('income needs only a person and amount, allowing repayment to turn into a new debt', async ({ page }) => {
  await page.goto('/transactions?operation-id=bank-return');
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
  await expect(page.getByTestId('DebtAllocationEditor')).not.toBeVisible();
  await page
    .getByTestId('AdditionalParameters')
    .getByRole('button', { name: /Дополнительные параметры/ })
    .click();
  await page.getByTestId('AddDebtParticipant').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await expect(page.getByTestId('PickContact')).toHaveCount(1);
  await page.getByTestId('PickContact').click();
  await page.locator('[name=amount]').fill('50');
  await page.locator('[name=debt-share-anna]').fill('50');
  await expect(page.getByTestId('OwnShare')).toHaveCount(0);
  await expect(page.getByTestId('DebtKind')).toHaveCount(0);
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  const anna = page.getByTestId('DebtPerson').filter({ hasText: 'Анна' });
  await expect(anna).toContainText('Я должен');
  await expect(anna).toContainText('15');
  await page.reload();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('15');
});

test('cancelling participant selection leaves the operation unlinked and removing the last person clears debts', async ({
  page,
}) => {
  await page.goto('/transactions?operation-id=bank-return');
  await page
    .getByTestId('AdditionalParameters')
    .getByRole('button', { name: /Дополнительные параметры/ })
    .click();
  await page.getByTestId('AddDebtParticipant').click();
  await page.getByTestId('ContactPicker').getByRole('button', { name: /Назад/ }).click();
  await expect(page.getByTestId('ContactPicker')).not.toBeVisible();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/transactions?operation-id=dinner');
  await page.getByRole('button', { name: 'Убрать участника', exact: true }).first().click();
  await page.getByRole('button', { name: 'Убрать участника', exact: true }).first().click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('Нет записей');
  await page.goto('/analytics/categories');
  await expect(page.locator('li[data-id=food] .amount')).toContainText('90');
});

test('switching the operation direction keeps participants and changes the debt direction', async ({ page }) => {
  await page.goto('/transactions?operation-id=dinner');
  await expect(page.getByTestId('DebtShare')).toHaveCount(2);
  await page.getByTestId('TypeSwitch').getByRole('button', { name: 'Доход', exact: true }).click();
  await expect(page.getByTestId('OwnShare')).toHaveCount(0);
  await expect(page.getByTestId('DebtShare')).toHaveCount(2);
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('CategoryIsRequiredErrorToast')).toBeVisible();
  await page.getByTestId('CategorySelect').getByRole('button').filter({ hasText: 'Доход' }).click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('SaveTransactionButton')).not.toBeVisible();
  await page.goto('/debts');
  const anna = page.getByTestId('DebtPerson').filter({ hasText: 'Анна' });
  await expect(anna).toContainText('Я должен');
  await expect(anna).toContainText('35');
});

test('contact details use a header edit icon and a single add entry action by the balance', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  const details = page.getByTestId('ContactDetails');
  await expect(details.getByRole('button', { name: 'Добавить запись', exact: true })).toBeVisible();
  await expect(details.getByRole('button', { name: 'Записать долг', exact: true })).toHaveCount(0);
  const edit = details.locator('.navigation-right-button').getByRole('button', { name: 'Редактировать', exact: true });
  await expect(edit.locator('svg')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('contact-details-mobile.png') });
  await edit.click();
  await expect(page.getByTestId('ContactForm').locator('[name=name]')).toHaveValue('Анна');
});

test('add entry offers debt and repayment, shows the person as a list row and supports manual repayments', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Добавить запись', exact: true }).click();
  await expect(page.getByTestId('DebtEntryType')).toHaveValue('repayment');
  await expect(
    page.getByTestId('DebtPaymentForm').getByRole('heading', { name: 'Добавить запись', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('DebtDirection')).toBeVisible();
  await expect(page.getByTestId('DebtPaymentForm')).toContainText('Кто');
  await expect(page.getByTestId('PaymentContact').locator('.avatar')).toHaveText('А');
  await page.getByTestId('DebtEntryType').selectOption('debt');
  await page.getByTestId('DebtDirection').selectOption('receivable');
  await page.locator('[name=debt-amount]').fill('10');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('45');
  await page.getByTestId('RecordRepayment').click();
  await page.getByTestId('DebtPaymentMethod').selectOption('manual');
  await page.locator('[name=debt-amount]').fill('20');
  await page.screenshot({ path: testInfo.outputPath('manual-repayment-mobile.png') });
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('25');
  await page.getByTestId('DebtHistoryEntry').filter({ hasText: 'Возврат' }).click();
  await expect(page.locator('[name=debt-amount]')).toHaveValue('20');
  await page.locator('[name=debt-amount]').fill('15');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('30');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(exported.operations).toHaveLength(3);
  expect(
    exported.debtRecords.some(
      (entry: { kind?: string; amount: number }) => entry.kind === 'repayment' && entry.amount === -15,
    ),
  ).toBe(true);
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('30');
});

test('manual debt deletion uses the app modal and supports cancellation', async ({ page }, testInfo) => {
  let systemDialog = false;
  page.on('dialog', (dialog) => {
    systemDialog = true;
    void dialog.dismiss();
  });
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Миша' }).click();
  await expect(
    page.getByTestId('ContactDetails').getByRole('button', { name: 'Удалить запись', exact: true }),
  ).toHaveCount(0);
  await page.getByTestId('DebtHistoryEntry').click();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('manual-debt-edit-mobile.png') });
  await page.getByTestId('DeleteDebtRecordButton').click();
  await expect(page.getByTestId('DebtDeleteConfirm')).toBeVisible();
  await expect(page.locator('.modal-background')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('delete-debt-modal-mobile.png') });
  await page.goBack();
  await expect(page.getByTestId('DebtDeleteConfirm')).not.toBeVisible();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.getByTestId('DeleteDebtRecordButton').click();
  await expect(page.getByTestId('DebtDeleteConfirm')).toBeVisible();
  await page.getByTestId('CancelDebtDeletion').click();
  await expect(page.getByTestId('DebtDeleteConfirm')).not.toBeVisible();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await expect(page.locator('[name=debt-amount]')).toHaveValue('45');
  await page.getByTestId('DeleteDebtRecordButton').click();
  await page.getByTestId('ConfirmDebtDeletion').click();
  await expect(page.getByTestId('DebtDeleteConfirm')).not.toBeVisible();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('ContactDetails')).toContainText('Нет записей');
  expect(systemDialog).toBe(false);
  await page.reload();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Миша' })).toContainText('Нет записей');
});

test('contact picker shows per-currency debt balances even when the linked account is hidden', async ({
  page,
}, testInfo) => {
  await importMockDataAsync(
    page,
    JSON.stringify({
      debtRecords: [{ id: 'rsd-debt', contactId: 'anna', amount: 2400, currency: 'RSD', date: '2026-11-15T10:00:00Z' }],
    }),
  );
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  const anna = page.getByTestId('PickContact').filter({ hasText: 'Анна' });
  await expect(anna.getByTestId('PickerDebtStatus')).toContainText('Мне должны');
  await expect(anna.getByTestId('PickerDebtStatus')).toContainText('35\u00a0EUR');
  await expect(anna.getByTestId('PickerDebtStatus')).toContainText('2\u00a0400\u00a0RSD');
  const misha = page.getByTestId('PickContact').filter({ hasText: 'Миша' });
  await expect(misha.getByTestId('PickerDebtStatus')).toContainText('Я должен');
  await expect(misha.getByTestId('PickerDebtStatus')).toContainText('45\u00a0EUR');
  await expect(
    page.getByTestId('PickContact').filter({ hasText: 'Контакт 2' }).getByTestId('PickerDebtStatus'),
  ).toHaveText('Рассчитались');
  await page.screenshot({ path: testInfo.outputPath('contacts-picker-balances-mobile.png') });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await importMockDataAsync(
    page,
    JSON.stringify({ accounts: [{ id: 'card', name: 'Карта EUR', currency: 'EUR', hideBalance: true }] }),
  );
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  const balances = page.getByTestId('PickContact').filter({ hasText: 'Анна' }).getByTestId('PickerDebtStatus');
  await expect(balances).not.toContainText('******');
  await expect(balances).toContainText('35\u00a0EUR');
  await expect(balances).toContainText('2\u00a0400\u00a0RSD');
});

test('debt totals, history and contact picker follow global visibility independently of a locally hidden account', async ({
  page,
}) => {
  await page.goto('/accounts');
  const account = page.getByTestId('AccountCard').filter({ hasText: 'Карта EUR' });
  await account.getByRole('button', { name: 'Скрыть сумму', exact: true }).click();
  await expect(account.getByRole('button', { name: 'Показать сумму', exact: true })).toContainText('******');

  for (const [index, hidden] of [false, true, false].entries()) {
    if (index > 0) {
      await page.goto('/settings');
      const toggle = page.locator('.theme-switch').filter({ hasText: 'Скрывать суммы' });
      await toggle.getByText('Скрывать суммы', { exact: true }).click();
      await expect(toggle.locator(':scope > input')).toBeChecked({ checked: hidden });
    }
    await page.getByRole('link', { name: 'Долги', exact: true }).click();
    const anna = page.getByTestId('DebtPerson').filter({ hasText: 'Анна' });
    if (hidden) {
      await expect(page.locator('.summary')).toContainText('******');
      await expect(anna).toContainText('******');
      await expect(anna).not.toContainText('35');
    } else {
      await expect(page.locator('.summary')).toContainText('55');
      await expect(anna).toContainText('35');
      await expect(page.locator('.debts-page')).not.toContainText('******');
    }
    await anna.click();
    const details = page.getByTestId('ContactDetails');
    await expect(details.locator('.balance')).toContainText(hidden ? '******' : '35');
    await expect(page.getByTestId('DebtHistoryEntry')).toContainText(hidden ? '******' : '+35');
    if (hidden) await expect(page.getByTestId('DebtHistoryEntry')).not.toContainText('35');
    await details.getByRole('button', { name: 'Назад', exact: true }).click();
    await page.getByTestId('RecordDebt').click();
    await page.getByTestId('PaymentContact').click();
    const status = page.getByTestId('PickContact').filter({ hasText: 'Анна' }).getByTestId('PickerDebtStatus');
    await expect(status).toContainText(hidden ? '******' : '35');
    await page.getByTestId('ContactPicker').getByRole('button', { name: 'Назад', exact: true }).click();
    await page.getByTestId('DebtPaymentForm').getByRole('button', { name: 'Назад', exact: true }).click();
  }
  await page.goto('/accounts');
  await expect(account.getByRole('button', { name: 'Показать сумму', exact: true })).toContainText('******');
});

test('contact gender and number persist and change the wording in Russian without changing the English label', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await page.locator('[name=debt-search]').fill('Анна');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await page.getByTestId('DebtPerson').click();
  await page.getByTestId('ContactDetails').getByRole('button', { name: 'Редактировать', exact: true }).click();
  await expect(page.getByTestId('ContactGrammaticalForm')).toHaveValue('');
  await page.getByTestId('ContactGrammaticalForm').selectOption('feminine');
  await page.screenshot({ path: testInfo.outputPath('contact-grammar-mobile.png') });
  await page.getByTestId('SaveContact').click();
  await expect(page.getByTestId('ContactEditor')).not.toBeVisible();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('Должна мне');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await expect(page.getByTestId('ContactDetails')).toContainText('Должна мне');
  await page.getByTestId('ContactDetails').locator('.navigation-right-button button').click();
  await expect(page.getByTestId('ContactGrammaticalForm')).toHaveValue('feminine');
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await expect(page.getByTestId('PickContact').filter({ hasText: 'Анна' })).toContainText('Должна мне');
  await page.screenshot({ path: testInfo.outputPath('contact-grammar-picker-mobile.png') });
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const data = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(data.debtContacts.find((c: { id: string }) => c.id === 'anna').grammaticalForm).toBe('feminine');
  await page.context().addCookies([{ name: 'locale', value: 'en-US', url: new URL(page.url()).origin }]);
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('Owed to me');
});

test('debt history uses category icons and day headings without the redundant debt label', async ({
  page,
}, testInfo) => {
  const data = JSON.parse(backup);
  data.operations.find((operation: { id: string }) => operation.id === 'bank-return').debt = {
    kind: 'payment',
    shares: [{ contactId: 'anna', amount: 20 }],
  };
  data.debtRecords.push(
    { id: 'tickets', contactId: 'anna', amount: 10, currency: 'EUR', date: '2026-11-14T15:00:00Z', comment: 'Билеты' },
    { id: 'taxi', contactId: 'anna', amount: 5, currency: 'EUR', date: '2026-11-13T12:00:00Z', comment: 'Такси' },
    {
      id: 'cash-return',
      contactId: 'anna',
      kind: 'repayment',
      amount: -2,
      currency: 'EUR',
      date: '2026-11-15T11:00:00Z',
      comment: 'Вернули наличными',
    },
  );
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  const details = page.getByTestId('ContactDetails');
  await expect(details.getByTestId('DebtHistoryDate')).toHaveCount(3);
  await expect(details.locator('[data-date="2026-11-14"]').getByTestId('DebtHistoryEntry')).toHaveCount(2);
  await expect(
    details
      .getByTestId('DebtHistoryEntry')
      .filter({ hasText: 'Ужин с друзьями' })
      .getByTestId('DebtHistoryIcon')
      .locator('svg'),
  ).toBeVisible();
  await expect(details).not.toContainText('Связано с долгами');
  await expect(details.getByTestId('DebtHistoryDate').first()).toHaveText('15 ноября 2026');
  await expect(details.getByTestId('DebtHistoryEntry').getByRole('button')).toHaveCount(0);
  const dinnerEntry = details.getByTestId('DebtHistoryEntry').filter({ hasText: 'Ужин с друзьями' });
  await expect(dinnerEntry.locator('.entry-title')).toHaveText('Рестораны');
  await expect(dinnerEntry.locator('.entry-comment')).toHaveText('Ужин с друзьями');
  await expect(dinnerEntry.locator('.caption')).toHaveText('Карта EUR');
  const manualEntry = details.getByTestId('DebtHistoryEntry').filter({ hasText: 'Билеты' });
  await expect(manualEntry.locator('.entry-title')).toHaveText('Долг');
  await expect(manualEntry.locator('.caption')).toHaveText('(без операции)');
  const manualReturn = details.getByTestId('DebtHistoryEntry').filter({ hasText: 'Вернули наличными' });
  await expect(manualReturn.locator('.entry-title')).toHaveText('Возврат');
  await expect(manualReturn.locator('.caption')).toHaveText('(без операции)');
  const historyGap = await dinnerEntry.locator('.entry-main').evaluate((element) => getComputedStyle(element).rowGap);
  await page.screenshot({ path: testInfo.outputPath('debt-history-groups-mobile.png') });
  await details.getByTestId('DebtHistoryEntry').filter({ hasText: 'Ужин с друзьями' }).click();
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
  await page.goto('/transactions');
  const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Ужин с друзьями' });
  await expect(operation.locator('.text')).toHaveCSS('row-gap', historyGap);
});

test('operation rows prefix participant names with the debt icon and abbreviate my share', async ({
  page,
}, testInfo) => {
  await page.goto('/transactions');
  const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Ужин с друзьями' });
  await expect(operation.getByTestId('TransactionDebtIcon').locator('svg')).toBeVisible();
  await expect(operation.getByTestId('TransactionDebtInfo')).toContainText('Анна, Максим');
  await expect(operation.getByTestId('TransactionDebtInfo')).toContainText('Я: 35');
  await expect(operation.getByTestId('TransactionDebtInfo')).not.toContainText('Моя доля');
  await page.screenshot({ path: testInfo.outputPath('operations-debt-label-mobile.png') });
});

test('a EUR debt paid from a RSD card uses the recorded exchange amounts and survives editing and export', async ({
  page,
}, testInfo) => {
  const data = JSON.parse(backup);
  data.accounts.push({ id: 'rsd-card', name: 'Сербская карта', currency: 'RSD' });
  data.currencyRates.push({ id: 'test-rsd-rate', cur1: 'USD', cur2: 'RSD', rate: 1 });
  Object.assign(
    data.operations.find((operation: { id: string }) => operation.id === 'dinner'),
    {
      accountId: 'rsd-card',
      amount: 238,
      anotherCurrency: 'EUR',
      anotherCurrencyAmount: 2,
      comment: 'Мороженое',
      debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 1 }] },
    },
  );
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/transactions?operation-id=dinner');
  await expect(page.getByTestId('OwnShare')).toContainText('237');
  await page.getByTestId('DebtShareCurrency').click();
  await expect(page.getByTestId('DebtCurrencyForm')).toBeVisible();
  await expect(page.getByTestId('RecentDebtCurrencies')).toContainText('EUR');
  await expect(page.locator('.modal-background')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('debt-currency-modal-mobile.png') });
  await page.getByTestId('RecentDebtCurrencies').getByText('EUR', { exact: true }).click();
  await expect(page.locator('[name=debt-currency]')).toHaveValue('EUR');
  await page.getByTestId('SaveDebtCurrency').click();
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('119');
  await expect(page.getByTestId('PersonalDebtAmount.Container')).toContainText('RSD');
  await page.getByTestId('PersonalDebtAmount').fill('120');
  await expect(page.getByTestId('ResetPersonalDebtAmount')).toBeVisible();
  await page.getByTestId('ResetPersonalDebtAmount').click();
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('119');
  await page.getByTestId('DebtAllocationEditor').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('debt-currency-allocation-mobile.png') });
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('1 EUR');
  await page.reload();
  await page.goto('/transactions?operation-id=dinner');
  await expect(page.getByTestId('DebtShareCurrency')).toHaveText('EUR');
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('119');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  const expense = exported.operations.find((operation: { id: string }) => operation.id === 'dinner');
  expect(expense.amount).toBe(238);
  expect(expense.debt.shares).toEqual([{ contactId: 'anna', amount: 1, currency: 'EUR' }]);
  await page.goto('/analytics/categories');
  await expect(page.locator('li[data-id=food] .amount')).toContainText('119');
  await page.goto('/accounts');
  const account = page.getByTestId('AccountBalanceToggle').filter({ hasText: '238' });
  await expect(account).toContainText('238');
});

test('foreign debt without an exchange amount requires a personal share and currency cancellation preserves the old value', async ({
  page,
}) => {
  await page.goto('/transactions?operation-id=dinner');
  await page
    .getByTestId('DebtShare')
    .filter({ hasText: 'Максим' })
    .getByRole('button', { name: 'Убрать участника' })
    .click();
  await page.getByTestId('DebtShareCurrency').click();
  await page.locator('[name=debt-currency]').fill('RSD');
  await page.getByTestId('CancelDebtCurrency').click();
  await expect(page.getByTestId('DebtShareCurrency')).toHaveText('EUR');
  await page.getByTestId('DebtShareCurrency').click();
  await page.locator('[name=debt-currency]').fill('RSD');
  await page.getByTestId('SaveDebtCurrency').click();
  await page.locator('[name=debt-share-anna]').fill('119');
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('');
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).toBeVisible();
  await page.getByTestId('PersonalDebtAmount').fill('89');
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.reload();
  await page.goto('/transactions?operation-id=dinner');
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('89');
  await page.getByTestId('DebtShareCurrency').click();
  await page.getByTestId('RecentDebtCurrencies').getByText('RSD', { exact: true }).click();
  await page.getByTestId('SaveDebtCurrency').click();
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveValue('89');
  await page.getByTestId('DebtShareCurrency').click();
  await page.locator('[name=debt-currency]').fill('EUR');
  await page.getByTestId('SaveDebtCurrency').click();
  await page.locator('[name=debt-share-anna]').fill('35');
  await expect(page.getByTestId('PersonalDebtAmount')).toHaveCount(0);
  await expect(page.getByTestId('OwnShare')).toContainText('55');
});

test('operation metadata stays on one third line in location, debt, tags order and debt contacts show notes', async ({
  page,
}, testInfo) => {
  const data = JSON.parse(backup);
  data.knownPlaces = [{ id: 'mall', name: 'ТЦ Африка', latitude: 44.8, longitude: 20.4 }];
  data.operationTags = [{ id: 'trip', name: 'Отпуск' }];
  data.debtContacts.find((contact: { id: string }) => contact.id === 'anna').note = 'Подруга из Белграда';
  data.debtRecords.push({
    id: 'anna-rsd',
    contactId: 'anna',
    amount: 2400,
    currency: 'RSD',
    date: '2026-11-14T10:00:00Z',
  });
  Object.assign(
    data.operations.find((operation: { id: string }) => operation.id === 'dinner'),
    {
      locationLat: 44.8,
      locationLng: 20.4,
      tagIds: ['trip'],
    },
  );
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/transactions');
  const operation = page.getByTestId('TransactionListItem').filter({ hasText: 'Ужин с друзьями' });
  const metadata = operation.getByTestId('OperationMetadata');
  await expect(metadata).toContainText(/ТЦ Африка.*Анна, Максим.*#Отпуск/);
  await expect(metadata).toHaveCSS('white-space', 'nowrap');
  const positions = await metadata.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
  }));
  expect(positions.height).toBeLessThanOrEqual(positions.fontSize * 1.5);
  await expect(operation.locator('.text > div')).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('operation-metadata-third-line-mobile.png') });
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).getByTestId('DebtPersonNote')).toHaveText(
    'Подруга из Белграда',
  );
  await expect(
    page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).getByTestId('DebtPersonBalanceDirection'),
  ).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('debts-contact-notes-mobile.png') });
  await importMockDataAsync(
    page,
    JSON.stringify({
      debtRecords: [{ id: 'anna-usd', contactId: 'anna', amount: -2, currency: 'USD', date: '2026-11-14T10:00:00Z' }],
    }),
  );
  await page.goto('/debts');
  await expect(
    page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).getByTestId('DebtPersonBalanceDirection'),
  ).toHaveCount(2);
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('Я должен');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Миша' }).click();
  await page.getByTestId('DebtHistoryEntry').click();
  await expect(page.locator('[name=due-date]')).toHaveCount(0);
});

test('debt header actions and collapsible filters work alongside search', async ({ page }, testInfo) => {
  await page.goto('/debts');
  const filterButton = page.getByTestId('DebtFiltersButton');
  const filters = page.locator('#debt-filters');
  await expect(filters).not.toBeVisible();
  await expect(page.locator('.navigation-right-button').getByTestId('RecordDebt')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Контакты', exact: true })).toHaveCount(0);
  await filterButton.click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const bounds = await filters.evaluate((element) => ({
      rows: [...new Set([...element.querySelectorAll('button')].map((button) => button.getBoundingClientRect().top))],
      scrollWidth: element.scrollWidth,
      width: element.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(bounds.rows).toHaveLength(1);
    expect(bounds.scrollWidth).toBeGreaterThan(bounds.width);
    expect(bounds.pageWidth).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: testInfo.outputPath('debt-horizontal-filters-mobile.png') });
  await filters.hover();
  await page.mouse.wheel(500, 0);
  await expect.poll(() => filters.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await filters.getByRole('button', { name: 'Архивные контакты', exact: true }).click();
  await expect(page.getByTestId('DebtEmptyState')).toHaveText('Архивных контактов нет.');
  await filters.getByRole('button', { name: 'Все контакты', exact: true }).click();
  await filters.getByRole('button', { name: 'Я должен', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(1);
  await expect(page.getByTestId('DebtPerson')).toContainText('Миша');
  await filterButton.click();
  await expect(filters).not.toBeVisible();
  await expect(filterButton).toHaveClass(/active/);
  await page.locator('[name=debt-search]').fill('Анна');
  await expect(page.getByTestId('DebtPerson')).toHaveCount(0);
  await page.locator('[name=debt-search]').fill('');
  await filterButton.click();
  await filters.getByRole('button', { name: 'Все контакты', exact: true }).click();
  await expect(page.getByTestId('DebtPerson')).toHaveCount(15);
  await filterButton.click();
  await expect(filterButton).not.toHaveClass(/active/);
  await page.screenshot({ path: testInfo.outputPath('debts-header-search-mobile.png') });
  await page.getByTestId('RecordDebt').click();
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.getByTestId('PaymentContact').click();
  await expect(page.getByRole('heading', { name: 'Выбрать контакт', exact: true })).toBeVisible();
  await expect(
    page.getByTestId('ContactPicker').getByRole('button', { name: 'Добавить контакт', exact: true }),
  ).toBeVisible();
});

test('fully allocated debt operations use the default category while a personal portion requires a regular category', async ({
  page,
}, testInfo) => {
  await page.goto('/transactions/create?accountId=card', { waitUntil: 'networkidle' });
  await page.locator('[name=amount]').fill('25');
  await page
    .getByTestId('AdditionalParameters')
    .getByRole('button', { name: /Дополнительные параметры/ })
    .click();
  await page.getByTestId('AddDebtParticipant').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.locator('[name=debt-share-anna]').fill('25');
  await expect(page.locator('[name=amount]')).toHaveValue('25');
  const debtCategory = page.getByTestId('CategorySelect.Item').filter({ hasText: 'Расчёты по долгам' });
  await expect(debtCategory).toBeVisible();
  await debtCategory.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('operation-default-debt-category-mobile.png') });
  await page.getByTestId('CreateTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/transactions');
  await page.getByTestId('TransactionListItem').filter({ hasText: 'Расчёты по долгам' }).click();
  await page.locator('[name=amount]').fill('30');
  await expect(page.getByTestId('OwnShare')).toContainText('5');
  await expect(debtCategory).toHaveCount(0);
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('CategoryIsRequiredErrorToast')).toBeVisible();
  await page.getByTestId('CategorySelect.Item').filter({ hasText: 'Рестораны' }).click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/analytics/categories');
  await expect(page.locator('li[data-id=food] .amount')).toContainText('40');
});

test('payments created from Debts can choose a regular category and change it in the operation editor', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.locator('[name=debt-amount]').fill('25');
  await page.locator('[name=comment]').fill('Одолжил Анне');
  await page.getByTestId('DebtPaymentMethod').selectOption('new');
  await expect(page.getByTestId('DebtPaymentCategory')).toHaveValue('');
  await page.getByTestId('DebtPaymentCategory').selectOption('food');
  await page.screenshot({ path: testInfo.outputPath('debt-payment-category-mobile.png') });
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.goto('/transactions');
  await page.getByTestId('TransactionListItem').filter({ hasText: 'Одолжил Анне' }).click();
  await expect(page.getByTestId('CategorySelect')).toBeVisible();
  await page.getByTestId('CategorySelect.Item').filter({ hasText: 'Расчёты по долгам' }).click();
  await page.getByTestId('SaveTransactionButton').click();
  await expect(page.getByTestId('TransactionForm')).not.toBeVisible();
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(
    exported.operations.find((operation: { comment: string }) => operation.comment === 'Одолжил Анне').categoryId,
  ).toBe('system-debt-out');
  await page.goto('/analytics/categories');
  await expect(page.locator('li[data-id=food] .amount')).toContainText('35');
});

test('the main add entry form supports repayments in both directions and preserves their signs', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  const form = page.getByTestId('DebtPaymentForm');
  await expect(form.getByRole('heading', { name: 'Добавить запись', exact: true })).toBeVisible();
  await expect(page.getByTestId('DebtEntryType')).toHaveValue('debt');
  await page.getByTestId('DebtEntryType').selectOption('repayment');
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await setDebtCurrency(page, 'EUR');
  await expect(page.locator('[name=debt-amount]')).toHaveValue('35');
  await expect(page.getByTestId('DebtDirection')).toHaveValue('receivable');
  await expect(page.getByTestId('DebtDirection').locator('option:checked')).toHaveText('Они вернули');
  await page.locator('[name=debt-amount]').fill('10');
  await page.getByTestId('DebtPaymentMethod').selectOption('manual');
  await page.getByTestId('DebtDirection').selectOption('payable');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(form.getByRole('alert')).toContainText('В выбранном направлении нет долга');
  await page.getByTestId('DebtDirection').selectOption('receivable');
  await page.screenshot({ path: testInfo.outputPath('unified-debt-repayment-mobile.png') });
  await page.getByTestId('SaveDebtPayment').click();
  await expect(form).not.toBeVisible();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('25');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Миша');
  await page.getByTestId('PickContact').click();
  await setDebtCurrency(page, 'EUR');
  await page.getByTestId('DebtEntryType').selectOption('repayment');
  await expect(page.getByTestId('DebtDirection')).toHaveValue('payable');
  await expect(page.getByTestId('DebtDirection').locator('option:checked')).toHaveText('Я вернул');
  await expect(page.locator('[name=debt-amount]')).toHaveValue('45');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(form).not.toBeVisible();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Миша' })).toContainText('Рассчитались');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const data = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(
    data.debtRecords.some(
      (entry: { contactId: string; amount: number; kind: string }) =>
        entry.contactId === 'anna' && entry.amount === -10 && entry.kind === 'repayment',
    ),
  ).toBe(true);
  expect(
    data.operations.some(
      (operation: { categoryId: string; amount: number; debt?: { shares: { contactId: string }[] } }) =>
        operation.categoryId === 'system-debt-out' &&
        operation.amount === 45 &&
        operation.debt?.shares[0]?.contactId === 'misha',
    ),
  ).toBe(true);
});

test('the shared account picker shows balances, filters by currency and excludes archived accounts', async ({
  page,
}, testInfo) => {
  await importMockDataAsync(
    page,
    JSON.stringify({
      accounts: [
        { id: 'second', name: 'Другая карта EUR', currency: 'EUR' },
        { id: 'rsd', name: 'Карта RSD', currency: 'RSD' },
        { id: 'archived', name: 'Архивная карта EUR', currency: 'EUR', archived: true },
      ],
    }),
  );
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Максим');
  await page.getByTestId('PickContact').click();
  await setDebtCurrency(page, 'EUR');
  await page.locator('[name=debt-amount]').fill('10');
  await page.locator('[name=comment]').fill('Выбор счёта');
  await page.getByTestId('DebtPaymentMethod').selectOption('new');
  await expect(page.getByTestId('DebtAccount')).toContainText('930');
  await expect(page.getByTestId('DebtAccount').locator('svg').first()).toBeVisible();
  await page.getByTestId('DebtAccount').getByRole('button', { name: 'Карта EUR', exact: true }).click();
  const picker = page.getByTestId('DebtAccount.Portal');
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Карта EUR', exact: true })).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Другая карта EUR', exact: true })).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Карта RSD', exact: true })).toHaveCount(0);
  await expect(picker.getByRole('button', { name: 'Архивная карта EUR', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('debt-account-picker-mobile.png') });
  await picker.getByRole('button', { name: 'Другая карта EUR', exact: true }).click();
  await expect(picker).not.toBeVisible();
  await expect(page.getByTestId('DebtAccount')).toContainText('Другая карта EUR');
  await page.getByTestId('DebtAccount').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('unified-debt-account-mobile.png') });
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const data = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(data.operations.find((operation: { comment: string }) => operation.comment === 'Выбор счёта').accountId).toBe(
    'second',
  );
});

test('received repayment direction agrees with the selected contact', async ({ page }, testInfo) => {
  await importMockDataAsync(
    page,
    JSON.stringify({ debtContacts: [{ id: 'anna', name: 'Анна', grammaticalForm: 'feminine' }] }),
  );
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await page.getByTestId('RecordRepayment').click();
  await expect(page.getByTestId('DebtDirection').locator('option:checked')).toHaveText('Она вернула');
  await expect(page.getByTestId('DebtAccount').locator('.account-icon svg')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('repayment-contact-gender-mobile.png') });
  await page.getByTestId('DebtEntryType').selectOption('debt');
  await expect(page.getByTestId('DebtDirection').locator('option:checked')).toHaveText('Должна мне');
});

test('existing payment selection searches all eligible operations and links the selected one without duplicating it', async ({
  page,
}, testInfo) => {
  const data = JSON.parse(backup);
  data.accounts.push({ id: 'rsd-selection', name: 'Карта RSD', currency: 'RSD' });
  data.operations.push(
    ...Array.from({ length: 75 }, (_, index) => ({
      id: `candidate-${index}`,
      accountId: 'card',
      categoryId: 'income',
      date: '2026-11-01T12:00:00Z',
      amount: 10,
      comment: index === 74 ? 'Возврат за мороженое' : `Платёж ${index}`,
    })),
    {
      id: 'wrong-direction',
      accountId: 'card',
      categoryId: 'food',
      date: '2026-11-15T10:00:00Z',
      amount: 10,
      comment: 'Расход в другом направлении',
    },
    {
      id: 'wrong-currency',
      accountId: 'rsd-selection',
      categoryId: 'income',
      date: '2026-11-15T10:00:00Z',
      amount: 10,
      comment: 'Доход в RSD',
    },
    {
      id: 'future-candidate',
      accountId: 'card',
      categoryId: 'income',
      date: '2026-12-01T10:00:00Z',
      amount: 10,
      comment: 'Недоступно: будущее',
    },
    {
      id: 'linked-candidate',
      accountId: 'card',
      categoryId: 'income',
      date: '2026-11-15T10:00:00Z',
      amount: 10,
      comment: 'Недоступно: уже связан',
      debt: { kind: 'payment', shares: [{ contactId: 'max', amount: 10 }] },
    },
  );
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/debts');
  await page.getByTestId('DebtPerson').filter({ hasText: 'Анна' }).click();
  await page.getByTestId('RecordRepayment').click();
  await page.locator('[name=debt-amount]').fill('5');
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm').getByRole('alert')).toContainText('Выберите операцию');
  await page.getByTestId('ExistingDebtPayment').click();
  const picker = page.getByTestId('DebtOperationPicker');
  await expect(picker).toBeVisible();
  await expect(picker.getByTestId('TransactionListItem')).toHaveCount(20);
  await expect(picker.getByTestId('TransactionListItem').filter({ hasText: 'Возврат за мороженое' })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('debt-operation-picker-mobile.png') });
  await picker.locator('[name=debt-operation-search]').fill('Недоступно');
  await expect(picker.getByTestId('TransactionListItem')).toHaveCount(0);
  await expect(picker).toContainText('Ничего не найдено');
  await picker.locator('[name=debt-operation-search]').fill('МОРОЖЕНОЕ');
  await expect(picker.getByTestId('TransactionListItem')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('debt-operation-search-mobile.png') });
  await picker.getByTestId('TransactionListItem').click();
  await expect(picker).not.toBeVisible();
  await expect(page.getByTestId('SelectedDebtPayment')).toContainText('Возврат за мороженое');
  await expect(page.locator('[name=debt-amount]')).toHaveValue('10');
  await page.locator('[name=debt-amount]').fill('5');
  await page.getByTestId('SelectedDebtPayment').getByTestId('TransactionListItem').click();
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByTestId('SelectedDebtPayment')).toContainText('Возврат за мороженое');
  await expect(page.getByTestId('DebtPaymentForm')).toBeVisible();
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(exported.operations).toHaveLength(data.operations.length);
  expect(exported.operations.find((operation: { id: string }) => operation.id === 'candidate-74').debt.shares).toEqual([
    { contactId: 'anna', amount: 5 },
  ]);
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('30');
});

test('debt currency is chosen in a modal and the last choice survives cancellation and reload', async ({
  page,
}, testInfo) => {
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('EUR');
  await page.getByTestId('DebtCurrencyButton').click();
  await expect(page.getByTestId('RecentDebtCurrencies')).toContainText('EUR');
  await page.locator('[name=debt-currency]').fill('RSD');
  await expect(page.locator('.modal-background')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('debt-entry-currency-modal-mobile.png') });
  await page.getByTestId('SaveDebtCurrency').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('RSD');
  await page.getByTestId('DebtCurrencyButton').click();
  await page.locator('[name=debt-currency]').fill('USD');
  await page.getByTestId('CancelDebtCurrency').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('RSD');
  await page.getByTestId('DebtPaymentForm').getByRole('button', { name: 'Назад', exact: true }).click();
  await page.reload();
  await page.getByTestId('RecordDebt').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('RSD');
  await page.getByTestId('DebtCurrencyButton').click();
  await expect(page.getByTestId('RecentDebtCurrencies')).toContainText('RSD');
});

test('choosing an existing operation fills currency, amount and direction across currencies without duplicates', async ({
  page,
}, testInfo) => {
  const data = JSON.parse(backup);
  data.accounts.push({ id: 'rsd-card', name: 'Карта RSD', currency: 'RSD' });
  data.operations.push({
    id: 'rsd-expense',
    accountId: 'rsd-card',
    categoryId: 'food',
    amount: 238,
    date: '2026-11-14T14:00:00Z',
    comment: 'Покупка в RSD',
    anotherCurrency: 'EUR',
    anotherCurrencyAmount: 2,
  });
  await importMockDataAsync(page, JSON.stringify(data));
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await setDebtCurrency(page, 'USD');
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('ExistingDebtPayment').click();
  await page.getByTestId('DebtOperationPicker').locator('[name=debt-operation-search]').fill('Покупка в RSD');
  await page.getByTestId('DebtOperationPicker').getByTestId('TransactionListItem').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('RSD');
  await expect(page.locator('[name=debt-amount]')).toHaveValue('238');
  await expect(page.getByTestId('DebtDirection')).toHaveValue('receivable');
  await page.screenshot({ path: testInfo.outputPath('debt-operation-autofill-mobile.png') });
  await page.getByTestId('DebtPaymentForm').getByRole('button', { name: 'Назад', exact: true }).click();
  await page.getByTestId('RecordDebt').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('RSD');
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.getByTestId('DebtEntryType').selectOption('repayment');
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('ExistingDebtPayment').click();
  await page.getByTestId('DebtOperationPicker').locator('[name=debt-operation-search]').fill('Перевод от Анны');
  await page.getByTestId('DebtOperationPicker').getByTestId('TransactionListItem').click();
  await expect(page.getByTestId('DebtCurrencyButton')).toHaveText('EUR');
  await expect(page.locator('[name=debt-amount]')).toHaveValue('20');
  await expect(page.getByTestId('DebtDirection')).toHaveValue('receivable');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('15');
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  expect(exported.operations).toHaveLength(data.operations.length);
  expect(exported.operations.find((operation: { id: string }) => operation.id === 'rsd-expense').debt).toBeUndefined();
  expect(exported.operations.find((operation: { id: string }) => operation.id === 'bank-return').debt.shares).toEqual([
    { contactId: 'anna', amount: 20 },
  ]);
});

test('a linked foreign-currency debt uses the operation exchange amounts for personal analytics', async ({ page }) => {
  await importMockDataAsync(
    page,
    JSON.stringify({
      accounts: [{ id: 'rsd-card', name: 'Карта RSD', currency: 'RSD' }],
      operations: [
        {
          id: 'icecream',
          accountId: 'rsd-card',
          categoryId: 'food',
          amount: 238,
          anotherCurrency: 'EUR',
          anotherCurrencyAmount: 2,
          date: '2026-11-14T12:00:00Z',
          comment: 'Мороженое в RSD',
        },
      ],
    }),
  );
  await page.goto('/debts');
  await page.getByTestId('RecordDebt').click();
  await page.getByTestId('PaymentContact').click();
  await page.locator('[name=contact-search]').fill('Анна');
  await page.getByTestId('PickContact').click();
  await page.getByTestId('DebtPaymentMethod').selectOption('existing');
  await page.getByTestId('ExistingDebtPayment').click();
  await page.getByTestId('DebtOperationPicker').locator('[name=debt-operation-search]').fill('Мороженое');
  await page.getByTestId('DebtOperationPicker').getByTestId('TransactionListItem').click();
  await setDebtCurrency(page, 'USD');
  await page.locator('[name=debt-amount]').fill('1');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm').getByRole('alert')).toContainText(
    'В операции нет суммы в этой валюте',
  );
  await setDebtCurrency(page, 'EUR');
  await page.getByTestId('SaveDebtPayment').click();
  await expect(page.getByTestId('DebtPaymentForm')).not.toBeVisible();
  await page.goto('/settings/import-export');
  await page.getByTestId('ShowExportTextAreaButton').click();
  const exported = JSON.parse(await page.getByTestId('ExportTextArea').inputValue());
  const operation = exported.operations.find((operation: { id: string }) => operation.id === 'icecream');
  expect(operation.amount).toBe(238);
  expect(operation.debt.shares).toEqual([{ contactId: 'anna', amount: 1, currency: 'EUR' }]);
  await page.goto('/debts');
  await expect(page.getByTestId('DebtPerson').filter({ hasText: 'Анна' })).toContainText('36');
});
