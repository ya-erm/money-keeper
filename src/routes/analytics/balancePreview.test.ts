import { describe, expect, it } from 'vitest';

import type { AccountViewModel, Category, TransactionViewModel } from '$lib/data/interfaces';

import { getBalancePreview, getTotalBalanceAt } from './balancePreview';

const income: Category = { id: 'income', name: 'Income', type: 'IN' };
const expense: Category = { id: 'expense', name: 'Expense', type: 'OUT' };

const account = (id: string, currency = 'USD'): AccountViewModel => ({
  id,
  name: id,
  currency,
  tags: [],
});

describe('getTotalBalanceAt', () => {
  it('returns the converted total at the requested point in time', () => {
    const usd = account('USD');
    const eur = account('EUR', 'EUR');
    expect(
      getTotalBalanceAt(
        [usd, eur],
        [
          transaction('usd', usd, 20, '2026-09-01'),
          transaction('eur', eur, 10, '2026-09-01'),
          transaction('future', usd, 100, '2026-09-16'),
        ],
        (currency) => (currency === 'EUR' ? 2 : 1),
        new Date('2026-09-15'),
      ),
    ).toBe(40);
  });
});

const transaction = (
  id: string,
  currentAccount: AccountViewModel,
  amount: number,
  date: string,
  category: Category = income,
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

describe('getBalancePreview', () => {
  it('returns twelve end-of-month balances and carries balances forward', () => {
    const cash = account('Cash');
    const result = getBalancePreview(
      [cash],
      [transaction('1', cash, 100, '2026-08-10'), transaction('2', cash, 30, '2026-09-05', expense)],
      () => 2,
      new Date('2026-09-15'),
    );

    expect(result.series[0].values).toHaveLength(12);
    expect(result.series[0].values.slice(-2)).toEqual([200, 140]);
  });

  it('selects the three largest latest balances and combines the rest for every month', () => {
    const accounts = ['A', 'B', 'C', 'D', 'E'].map((id) => account(id));
    const transactions = accounts.flatMap((currentAccount, index) => [
      transaction(`${currentAccount.id}-old`, currentAccount, (index + 1) * 10, '2026-08-10'),
      transaction(`${currentAccount.id}-new`, currentAccount, (index + 1) * 10, '2026-09-10'),
    ]);
    const result = getBalancePreview(accounts, transactions, () => 1, new Date('2026-09-15'));

    expect(result.series.map(({ id }) => id)).toEqual(['E', 'D', 'C']);
    expect(result.otherValues.slice(-2)).toEqual([30, 60]);
    expect(result.hasOther).toBe(true);
  });

  it('ignores future operations, converts currencies and hides negative balances from the chart', () => {
    const eur = account('EUR', 'EUR');
    const debt = account('Debt');
    const result = getBalancePreview(
      [eur, debt],
      [
        transaction('eur', eur, 20, '2026-09-10'),
        transaction('future', eur, 100, '2026-10-01'),
        transaction('debt', debt, 10, '2026-09-10', expense),
      ],
      (currency) => (currency === 'EUR' ? 2 : 1),
      new Date('2026-09-15'),
    );

    expect(result.series.map(({ id }) => id)).toEqual(['EUR']);
    expect(result.series[0].values.at(-1)).toBe(40);
  });

  it('keeps historical balances even when an account is empty in the latest month', () => {
    const cash = account('Cash');
    const result = getBalancePreview(
      [cash],
      [transaction('in', cash, 10, '2026-08-10'), transaction('out', cash, 10, '2026-09-10', expense)],
      () => 1,
      new Date('2026-09-15'),
    );

    expect(result.series[0].values.slice(-2)).toEqual([10, 0]);
  });
});
