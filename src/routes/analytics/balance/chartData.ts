import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { Account, TransactionViewModel } from '$lib/data/interfaces';
import { calculateBalance } from '$lib/utils';

type AccountBalance = {
  balance: number;
  ratedBalance: number;
};

type BalanceChartItem = {
  date: Date;
  accountBalance: Record<string, AccountBalance>;
  sum: number;
};

type Options = {
  accounts: Account[];
  operations: TransactionViewModel[];
  startDate: Dayjs;
  endDate: Dayjs;
  step: 'day' | 'week' | 'month';
  findRateFn: (currency: string) => number;
};

export function getAccountBalanceChartData({
  accounts,
  operations,
  startDate,
  step,
  endDate,
  findRateFn,
}: Options): BalanceChartItem[] {
  const bucketsCount = Math.ceil(endDate.diff(startDate, step, true)) + 1;
  const buckets = Array.from({ length: bucketsCount }, (_, i) => ({
    date: startDate.add(i, step),
    operationsByAccount: {} as Record<string, TransactionViewModel[]>,
  }));

  for (const operation of operations) {
    let bucketIndex = Math.ceil(dayjs(operation.date).diff(startDate, step, true));
    if (bucketIndex < 0) bucketIndex = 0;
    if (bucketIndex <= bucketsCount) {
      const operationsByAccount = buckets[bucketIndex].operationsByAccount[operation.account.id];
      if (!operationsByAccount) {
        buckets[bucketIndex].operationsByAccount[operation.account.id] = [operation];
      } else {
        operationsByAccount.push(operation);
      }
    }
  }

  const items: BalanceChartItem[] = [];

  buckets.forEach((bucket) => {
    const accountBalance = accounts.reduce((acc: Record<string, AccountBalance>, account) => {
      const previousItem = items[items.length - 1];
      const previousBalance = previousItem?.accountBalance[account.id].balance ?? 0;
      const operationsByDate = bucket.operationsByAccount[account.id];
      const balance = previousBalance + calculateBalance(operationsByDate ?? []);
      const ratedBalance = findRateFn(account.currency) * balance;
      acc[account.id] = {
        balance,
        ratedBalance: ratedBalance < 0 ? 0 : ratedBalance,
      };
      return acc;
    }, {});

    items.push({
      date: bucket.date.toDate(),
      accountBalance,
      sum: Object.values(accountBalance).reduce((sum, { ratedBalance }) => sum + ratedBalance, 0),
    });
  });

  return items;
}
