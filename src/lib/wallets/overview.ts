import { derived } from 'svelte/store';
import { accountsStore, accountsService } from '#lib/data/accounts.js';
import {
  categoriesStore,
  SYSTEM_CATEGORY_TRANSFER_IN,
  SYSTEM_CATEGORY_TRANSFER_OUT,
  SYSTEM_CATEGORY_DEBT_IN,
  SYSTEM_CATEGORY_DEBT_OUT,
} from '#lib/data/categories.js';
import { operationsStore } from '#lib/data/operations.js';
import { walletsStore, walletTransfersStore } from '#lib/data/wallets.js';
import { fromMinor, toMinor } from '#lib/debts/calculations.js';
import { walletBalance, walletEntries } from './calculations.js';

export const walletOverviewStore = derived(
  [walletsStore, accountsStore, categoriesStore, operationsStore, walletTransfersStore],
  ([wallets, accounts, categories, operations, transfers]) => {
    const allAccounts = [...accounts, ...accountsService.deletedItems];
    const allCategories = [
      ...categories,
      SYSTEM_CATEGORY_TRANSFER_IN,
      SYSTEM_CATEGORY_TRANSFER_OUT,
      SYSTEM_CATEGORY_DEBT_IN,
      SYSTEM_CATEGORY_DEBT_OUT,
    ];
    const currencies = [
      ...new Set([
        ...allAccounts.map((account) => account.currency),
        ...transfers.map((transfer) => transfer.currency),
      ]),
    ].sort();
    const balances = new Map(
      wallets.map((wallet) => {
        const entries = walletEntries(wallet, operations, allCategories, allAccounts, transfers);
        return [wallet.id, currencies.map((currency) => ({ currency, amount: walletBalance(entries, currency) }))];
      }),
    );
    balances.set(
      '',
      currencies.map((currency) => {
        const real = operations
          .filter((operation) => operation.account.currency === currency && Date.parse(operation.date) <= Date.now())
          .reduce(
            (sum, operation) => sum + toMinor(operation.amount * (operation.category.type === 'IN' ? 1 : -1), currency),
            0,
          );
        const allocated = wallets.reduce(
          (sum, wallet) =>
            sum +
            toMinor(balances.get(wallet.id)?.find((balance) => balance.currency === currency)?.amount ?? 0, currency),
          0,
        );
        return { currency, amount: fromMinor(real - allocated, currency) };
      }),
    );
    return balances;
  },
);
