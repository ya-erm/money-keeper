import dayjs, { type Dayjs } from 'dayjs';

import type { TransactionViewModel } from '$lib/data/interfaces';

export type IncomeExpensesPreview = {
  incomeByMonth: number[];
  expensesByMonth: number[];
  incomeTotal: number;
  expensesTotal: number;
  hasHiddenBalanceAccount: boolean;
};

export function getIncomeExpensesPreview(
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs = dayjs(),
): IncomeExpensesPreview {
  const selectedMonth = dayjs(date).startOf('month');
  const start = selectedMonth.subtract(11, 'month');
  const end = selectedMonth.add(1, 'month');
  const incomeByMonth = Array.from({ length: 12 }, () => 0);
  const expensesByMonth = Array.from({ length: 12 }, () => 0);
  let hasHiddenBalanceAccount = false;

  for (const transaction of transactions) {
    const transactionDate = dayjs(transaction.date);
    if (
      transaction.excludeFromAnalysis ||
      transaction.category.system ||
      transactionDate.isBefore(start) ||
      !transactionDate.isBefore(end)
    ) {
      continue;
    }

    const amount = transaction.amount * getRate(transaction.account.currency);
    const monthIndex = transactionDate.startOf('month').diff(start, 'month');
    if (transaction.category.type === 'IN') incomeByMonth[monthIndex] += amount;
    else expensesByMonth[monthIndex] += amount;
    hasHiddenBalanceAccount ||= transaction.account.hideBalance ?? false;
  }

  return {
    incomeByMonth,
    expensesByMonth,
    incomeTotal: incomeByMonth.at(-1) ?? 0,
    expensesTotal: expensesByMonth.at(-1) ?? 0,
    hasHiddenBalanceAccount,
  };
}
