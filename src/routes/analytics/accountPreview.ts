import dayjs, { type Dayjs } from 'dayjs';

import type { AccountViewModel, TransactionViewModel } from '$lib/data/interfaces';
import { calculateBalance } from '$lib/utils';

export type AccountPreviewItem = {
  id: string;
  name: string;
  balance: number;
  percentage: number;
  color?: string;
  hidden: boolean;
};

export type AccountsPreview = {
  accounts: AccountPreviewItem[];
  otherBalance: number;
  otherPercentage: number;
  otherHidden: boolean;
  totalAbsoluteBalance: number;
};

export function getAccountsPreview(
  accounts: AccountViewModel[],
  transactions: TransactionViewModel[],
  getRate: (currency: string) => number,
  date: string | number | Date | Dayjs = dayjs(),
  limit = 3,
): AccountsPreview {
  const balances = accounts
    .map((account) => {
      const balance = calculateBalance(
        transactions.filter(
          (transaction) => transaction.accountId === account.id && dayjs(transaction.date).isBefore(dayjs(date)),
        ),
      );

      return {
        id: account.id,
        name: account.name,
        balance: balance * getRate(account.currency),
        color: account.color,
        hidden: account.hideBalance ?? false,
      };
    })
    .filter((account) => Number(account.balance.toFixed(8)) !== 0)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  const totalAbsoluteBalance = balances.reduce((sum, account) => sum + Math.abs(account.balance), 0);
  const topAccounts = balances.slice(0, limit);
  const otherAccounts = balances.slice(limit);
  const otherAbsoluteBalance = otherAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);

  return {
    accounts: topAccounts.map((account) => ({
      ...account,
      percentage: totalAbsoluteBalance ? (Math.abs(account.balance) / totalAbsoluteBalance) * 100 : 0,
    })),
    otherBalance: otherAccounts.reduce((sum, account) => sum + account.balance, 0),
    otherPercentage: totalAbsoluteBalance ? (otherAbsoluteBalance / totalAbsoluteBalance) * 100 : 0,
    otherHidden: otherAccounts.some((account) => account.hidden),
    totalAbsoluteBalance,
  };
}
