import dayjs from 'dayjs';
import { derived, type Readable } from 'svelte/store';

import { showErrorToast } from '$lib/ui/toasts';
import { Logger } from '$lib/utils/logger';

import { accountsService, accountsStore } from './accounts';
import { categoriesStore, SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from './categories';
import { $initialized } from './initialized';
import type { Transaction, TransactionViewModel } from './interfaces';
import { operationTagsStore } from './operationTags';
import { BaseService } from './service';

const logger = new Logger('OperationsService', { disabled: false });

export class OperationsService extends BaseService<Transaction> {
  private _operations: Readable<TransactionViewModel[]>;

  get $operations() {
    return this._operations;
  }

  constructor() {
    super('OperationsService', 'transactions', 'transaction');

    accountsService.deleteAccountOperations = this.deleteTransactionsByAccount;

    this._operations = derived(
      [this.$items, $initialized, accountsStore, categoriesStore, operationTagsStore],
      ([transactions, initialized, accounts, _categories, tags]) => {
        if (!initialized) return [];

        const categories = _categories.concat(SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT);

        function findAccount(id: string) {
          const account = accounts.find((account) => account.id === id);
          if (!account) throw new Error(`Account ${id} not found`);
          return account;
        }

        function findCategory(id: string) {
          const category = categories.find((category) => category.id === id);
          if (!category) throw new Error(`Category ${id} not found`);
          return category;
        }

        function findTag(id: string) {
          const tag = tags.find((tag) => tag.id === id);
          if (!tag) throw new Error(`Tag ${id} not found`);
          return tag;
        }

        transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

        const problems: Array<{ transaction: Transaction; e: unknown }> = [];

        const items = transactions
          .map((transaction) => {
            const linkedTransaction = transactions.find((t) => t.id === transaction.linkedTransactionId);

            try {
              const viewModel: TransactionViewModel = {
                ...transaction,
                account: findAccount(transaction.accountId),
                category: findCategory(transaction.categoryId),
                linkedTransaction: linkedTransaction
                  ? {
                      ...linkedTransaction,
                      account: findAccount(linkedTransaction.accountId),
                      category: findCategory(linkedTransaction.categoryId),
                    }
                  : undefined,
                tags: transaction.tagIds?.map(findTag) || [],
              };
              return viewModel;
            } catch (e) {
              problems.push({ transaction, e });
              return null as unknown as TransactionViewModel;
            }
          })
          .filter((x) => x !== null);

        if (problems.length) {
          logger.error('Data load problems:', problems);
          showErrorToast(`Data loaded with ${problems.length} problem(s)`);
        }

        return items;
      },
    );
  }

  deleteTransactionsByAccount(accountId: string): void {
    this.items
      .filter((transaction) => transaction.accountId == accountId)
      .forEach((transaction) => this.delete(transaction));
  }
}

export const operationsService = new OperationsService();

export const operationsStore = operationsService.$operations;
