import dayjs, { type Dayjs } from 'dayjs';

import type { TransactionViewModel } from '$lib/data/interfaces';

export type ExpenseCategoryPreview = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
};

export type ExpenseCategoriesPreview = {
  categories: ExpenseCategoryPreview[];
  otherAmount: number;
  otherPercentage: number;
  total: number;
  hasHiddenBalanceAccount: boolean;
};

export function getExpenseCategoriesPreview(
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs = dayjs(),
  limit = 3,
): ExpenseCategoriesPreview {
  const start = dayjs(date).startOf('month');
  const end = start.add(1, 'month');
  const amounts = new Map<string, { name: string; amount: number }>();
  let hasHiddenBalanceAccount = false;

  for (const transaction of transactions) {
    const transactionDate = dayjs(transaction.date);
    if (
      transaction.category.type !== 'OUT' ||
      transaction.category.system ||
      transaction.excludeFromAnalysis ||
      transactionDate.isBefore(start) ||
      !transactionDate.isBefore(end)
    ) {
      continue;
    }

    const current = amounts.get(transaction.categoryId);
    const amount = transaction.amount * getRate(transaction.account.currency);
    hasHiddenBalanceAccount ||= transaction.account.hideBalance ?? false;
    amounts.set(transaction.categoryId, {
      name: transaction.category.name,
      amount: (current?.amount ?? 0) + amount,
    });
  }

  const allCategories = Array.from(amounts, ([id, value]) => ({ id, ...value }))
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = allCategories.reduce((sum, category) => sum + category.amount, 0);
  const topCategories = allCategories.slice(0, limit);
  const otherAmount = allCategories.slice(limit).reduce((sum, category) => sum + category.amount, 0);

  return {
    categories: topCategories.map((category) => ({
      ...category,
      percentage: total ? (category.amount / total) * 100 : 0,
    })),
    otherAmount,
    otherPercentage: total ? (otherAmount / total) * 100 : 0,
    total,
    hasHiddenBalanceAccount,
  };
}
