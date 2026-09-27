import { describe, expect, it } from 'vitest';

import type { TransactionViewModel } from '$lib/data/interfaces';

import { getExpenseCategoriesPreview } from './categoryPreview';

const transaction = (
  id: string,
  categoryId: string,
  amount: number,
  overrides: Partial<TransactionViewModel> = {},
): TransactionViewModel => ({
  id,
  categoryId,
  amount,
  date: '2026-09-10',
  accountId: 'account',
  account: { id: 'account', name: 'Account', currency: 'USD' },
  category: { id: categoryId, name: categoryId, type: 'OUT' },
  tags: [],
  ...overrides,
});

describe('getExpenseCategoriesPreview', () => {
  it('returns the top three monthly expense categories and combines the rest', () => {
    const transactions = [
      transaction('1', 'Food', 60),
      transaction('2', 'Food', 40),
      transaction('3', 'Home', 80),
      transaction('4', 'Car', 60),
      transaction('5', 'Health', 40),
      transaction('6', 'Fun', 20),
      transaction('7', 'Other A', 10),
      transaction('8', 'Other B', 10),
    ];

    const result = getExpenseCategoriesPreview(transactions, () => 1, new Date('2026-09-15'));

    expect(result.total).toBe(320);
    expect(result.categories.map(({ id, amount }) => ({ id, amount }))).toEqual([
      { id: 'Food', amount: 100 },
      { id: 'Home', amount: 80 },
      { id: 'Car', amount: 60 },
    ]);
    expect(result.otherAmount).toBe(80);
    expect(result.otherPercentage).toBe(25);
    expect(result.hasHiddenBalanceAccount).toBe(false);
  });

  it('uses currency rates and ignores non-expenses, excluded, system and out-of-month operations', () => {
    const transactions = [
      transaction('1', 'Food', 10, {
        account: { id: 'account', name: 'Account', currency: 'EUR' },
      }),
      transaction('2', 'Income', 100, {
        category: { id: 'Income', name: 'Income', type: 'IN' },
      }),
      transaction('3', 'Excluded', 100, { excludeFromAnalysis: true }),
      transaction('4', 'Transfer', 100, {
        category: { id: 'Transfer', name: 'Transfer', type: 'OUT', system: true },
      }),
      transaction('5', 'Old', 100, { date: '2026-08-31' }),
    ];

    const result = getExpenseCategoriesPreview(
      transactions,
      (currency) => (currency === 'EUR' ? 2 : 1),
      new Date('2026-09-15'),
    );

    expect(result.total).toBe(20);
    expect(result.categories).toEqual([{ id: 'Food', name: 'Food', amount: 20, percentage: 100 }]);
    expect(result.otherAmount).toBe(0);
    expect(result.hasHiddenBalanceAccount).toBe(false);
  });

  it('reports when a monthly expense belongs to a hidden-balance account', () => {
    const result = getExpenseCategoriesPreview(
      [
        transaction('1', 'Food', 10, {
          account: { id: 'account', name: 'Account', currency: 'USD', hideBalance: true },
        }),
      ],
      () => 1,
      new Date('2026-09-15'),
    );

    expect(result.hasHiddenBalanceAccount).toBe(true);
  });
});
