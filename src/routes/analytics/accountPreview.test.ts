import { describe, expect, it } from 'vitest';

import type { AccountViewModel, Category, TransactionViewModel } from '$lib/data/interfaces';

import { getAccountsPreview } from './accountPreview';

const expenseCategory: Category = { id: 'expense', name: 'Expense', type: 'OUT' };
const incomeCategory: Category = { id: 'income', name: 'Income', type: 'IN' };

const account = (id: string, overrides: Partial<AccountViewModel> = {}): AccountViewModel => ({
  id,
  name: id,
  currency: 'USD',
  tags: [],
  ...overrides,
});

const transaction = (
  id: string,
  currentAccount: AccountViewModel,
  amount: number,
  category = incomeCategory,
  date = '2026-09-10',
): TransactionViewModel => ({
  id,
  accountId: currentAccount.id,
  categoryId: category.id,
  amount,
  date,
  account: currentAccount,
  category,
  tags: [],
});

describe('getAccountsPreview', () => {
  it('returns the three largest absolute balances and combines the rest', () => {
    const accounts = [account('Cash'), account('Savings'), account('Card'), account('Loan'), account('Reserve')];
    const transactions = [
      transaction('1', accounts[0], 100),
      transaction('2', accounts[1], 80),
      transaction('3', accounts[2], 60),
      transaction('4', accounts[3], 40, expenseCategory),
      transaction('5', accounts[4], 20),
    ];

    const result = getAccountsPreview(accounts, transactions, () => 1, new Date('2026-09-15'));

    expect(result.totalAbsoluteBalance).toBe(300);
    expect(result.accounts.map(({ id, balance }) => ({ id, balance }))).toEqual([
      { id: 'Cash', balance: 100 },
      { id: 'Savings', balance: 80 },
      { id: 'Card', balance: 60 },
    ]);
    expect(result.otherBalance).toBe(-20);
    expect(result.otherPercentage).toBe(20);
  });

  it('converts balances, ignores future operations and omits zero-balance accounts', () => {
    const eur = account('EUR', { currency: 'EUR' });
    const empty = account('Empty');
    const result = getAccountsPreview(
      [eur, empty],
      [transaction('1', eur, 10), transaction('2', eur, 100, incomeCategory, '2026-10-01')],
      (currency) => (currency === 'EUR' ? 2 : 1),
      new Date('2026-09-15'),
    );

    expect(result.accounts).toEqual([
      { id: 'EUR', name: 'EUR', balance: 20, percentage: 100, color: undefined, hidden: false },
    ]);
  });

  it('preserves account privacy for top accounts and the combined remainder', () => {
    const visible = account('Visible');
    const hidden = account('Hidden', { hideBalance: true });
    const result = getAccountsPreview(
      [visible, hidden],
      [transaction('1', visible, 20), transaction('2', hidden, 10)],
      () => 1,
      new Date('2026-09-15'),
      1,
    );

    expect(result.accounts[0].hidden).toBe(false);
    expect(result.otherHidden).toBe(true);
  });
});
