import type { Account, GlobalSettings } from '$lib/data/interfaces';

export type LocalBalanceVisibility = Partial<Record<string, boolean>>;

export function isBalanceHidden(
  settings: GlobalSettings | null | undefined,
  account?: Pick<Account, 'id' | 'hideBalance'> | null,
  localVisibility: LocalBalanceVisibility = {},
) {
  return settings?.hideBalances || (account && (localVisibility[account.id] ?? account.hideBalance)) || false;
}

export function hasHiddenBalanceAccount(
  settings: GlobalSettings | null | undefined,
  accounts: Array<Pick<Account, 'id' | 'hideBalance'>>,
  localVisibility: LocalBalanceVisibility = {},
) {
  return settings?.hideBalances || accounts.some((account) => isBalanceHidden(null, account, localVisibility)) || false;
}
