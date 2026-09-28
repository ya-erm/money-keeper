import dayjs, { type Dayjs } from 'dayjs';

import type { AccountViewModel, TransactionViewModel } from '$lib/data/interfaces';
import { calculateBalance } from '$lib/utils';

export type BalancePreviewSeries = {
  id: string;
  name: string;
  color?: string;
  values: number[];
};

export type BalancePreview = {
  series: BalancePreviewSeries[];
  otherValues: number[];
  hasOther: boolean;
};

export function getTotalBalanceAt(
  accounts: AccountViewModel[],
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs,
): number {
  const boundary = dayjs(date);
  return accounts.reduce((total, account) => {
    const balance = calculateBalance(
      transactions.filter(
        (transaction) => transaction.accountId === account.id && dayjs(transaction.date).isBefore(boundary),
      ),
    );
    return total + Math.max(0, balance * getRate(account.currency));
  }, 0);
}

export function getBalancePreview(
  accounts: AccountViewModel[],
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs = dayjs(),
  limit = 3,
  accountOrder: string[] = [],
): BalancePreview {
  const selectedMonth = dayjs(date).startOf('month');
  const monthEnds = Array.from({ length: 12 }, (_, index) =>
    selectedMonth.subtract(11 - index, 'month').add(1, 'month'),
  );

  const accountSeries = accounts.map((account) => {
    const accountTransactions = transactions.filter((transaction) => transaction.accountId === account.id);
    const values = monthEnds.map((monthEnd) => {
      const balance = calculateBalance(
        accountTransactions.filter((transaction) => dayjs(transaction.date).isBefore(monthEnd)),
      );
      return Math.max(0, balance * getRate(account.currency));
    });

    return {
      id: account.id,
      name: account.name,
      color: account.color,
      values,
    };
  });

  const rankedSeries = accountSeries
    .filter((series) => series.values.some((value) => value > 0))
    .sort((a, b) => (b.values.at(-1) ?? 0) - (a.values.at(-1) ?? 0));
  const getAccountOrder = (account: AccountViewModel) => {
    const index = accountOrder.indexOf(account.id);
    return index < 0 ? accounts.length : index;
  };
  const chartOrder = accounts
    .slice()
    .sort((a, b) => getAccountOrder(a) - getAccountOrder(b))
    .reverse()
    .map((account) => account.id);
  const series = rankedSeries.slice(0, limit).sort((a, b) => chartOrder.indexOf(a.id) - chartOrder.indexOf(b.id));
  const otherSeries = rankedSeries.slice(limit);

  return {
    series,
    otherValues: monthEnds.map((_, index) => otherSeries.reduce((sum, account) => sum + account.values[index], 0)),
    hasOther: otherSeries.length > 0,
  };
}
