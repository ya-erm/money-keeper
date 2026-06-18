import type { Account, GlobalSettings } from '$lib/data/interfaces';

export function isBalanceHidden(
  settings: GlobalSettings | null | undefined,
  account?: Pick<Account, 'hideBalance'> | null,
) {
  return settings?.hideBalances || account?.hideBalance || false;
}

export function hasHiddenBalanceAccount(
  settings: GlobalSettings | null | undefined,
  accounts: Array<Pick<Account, 'hideBalance'>>,
) {
  return settings?.hideBalances || accounts.some((account) => account.hideBalance) || false;
}
