import dayjs, { type Dayjs } from 'dayjs';

import type { TransactionViewModel } from '$lib/data/interfaces';

export type IncomeExpensesPreview = {
  incomeByDay: number[];
  expensesByDay: number[];
  incomeTotal: number;
  expensesTotal: number;
  hasHiddenBalanceAccount: boolean;
};

export function getIncomeExpensesPreview(
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs = dayjs(),
): IncomeExpensesPreview {
  const currentDate = dayjs(date);
  const start = currentDate.startOf('month');
  const end = start.add(1, 'month');
  const daysCount = currentDate.daysInMonth();
  const incomeByDay = Array.from({ length: daysCount }, () => 0);
  const expensesByDay = Array.from({ length: daysCount }, () => 0);
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
    const dayIndex = transactionDate.date() - 1;
    if (transaction.category.type === 'IN') incomeByDay[dayIndex] += amount;
    else expensesByDay[dayIndex] += amount;
    hasHiddenBalanceAccount ||= transaction.account.hideBalance ?? false;
  }

  return {
    incomeByDay,
    expensesByDay,
    incomeTotal: incomeByDay.reduce((sum, amount) => sum + amount, 0),
    expensesTotal: expensesByDay.reduce((sum, amount) => sum + amount, 0),
    hasHiddenBalanceAccount,
  };
}
