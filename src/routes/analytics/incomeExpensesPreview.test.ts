import { describe, expect, it } from 'vitest';

import type { Account, Category, TransactionViewModel } from '$lib/data/interfaces';

import { getIncomeExpensesPreview } from './incomeExpensesPreview';

const account: Account = { id: 'account', name: 'Account', currency: 'EUR' };
const income: Category = { id: 'income', name: 'Income', type: 'IN' };
const expense: Category = { id: 'expense', name: 'Expense', type: 'OUT' };

const transaction = (
  id: string,
  date: string,
  amount: number,
  category: Category,
  overrides: Partial<TransactionViewModel> = {},
): TransactionViewModel => ({
  id,
  date,
  amount,
  category,
  categoryId: category.id,
  account,
  accountId: account.id,
  tags: [],
  ...overrides,
});

describe('getIncomeExpensesPreview', () => {
  it('groups current-month income and expenses by day and converts currencies', () => {
    const result = getIncomeExpensesPreview(
      [
        transaction('1', '2026-09-01', 10, income),
        transaction('2', '2026-09-01', 5, expense),
        transaction('3', '2026-09-03', 20, income),
      ],
      () => 2,
      new Date('2026-09-03T12:00:00'),
    );

    expect(result.incomeByDay).toEqual([20, 0, 40]);
    expect(result.expensesByDay).toEqual([10, 0, 0]);
    expect(result.incomeTotal).toBe(60);
    expect(result.expensesTotal).toBe(10);
  });

  it('ignores excluded, system, future and out-of-month operations', () => {
    const result = getIncomeExpensesPreview(
      [
        transaction('excluded', '2026-09-01', 10, income, { excludeFromAnalysis: true }),
        transaction('system', '2026-09-01', 10, { ...income, system: true }),
        transaction('future', '2026-09-04', 10, income),
        transaction('old', '2026-08-31', 10, income),
      ],
      () => 1,
      new Date('2026-09-03T12:00:00'),
    );

    expect(result.incomeTotal).toBe(0);
    expect(result.expensesTotal).toBe(0);
  });

  it('reports hidden accounts used by included operations', () => {
    const result = getIncomeExpensesPreview(
      [
        transaction('hidden', '2026-09-01', 10, expense, {
          account: { ...account, hideBalance: true },
        }),
      ],
      () => 1,
      new Date('2026-09-03T12:00:00'),
    );

    expect(result.hasHiddenBalanceAccount).toBe(true);
  });
});
