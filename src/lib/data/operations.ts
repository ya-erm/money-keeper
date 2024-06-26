import dayjs from 'dayjs';
import { derived, get } from 'svelte/store';

import { translate } from '$lib/translate';
import { showErrorToast } from '$lib/ui/toasts';
import { Logger } from '$lib/utils/logger';

import { store } from '$lib/store';
import { accountsService, accountsStore } from './accounts';
import {
  SYSTEM_CATEGORY_TRANSFER_IN,
  SYSTEM_CATEGORY_TRANSFER_OUT,
  categoriesService,
  categoriesStore,
} from './categories';
import { $initialized } from './initialized';
import type { Transaction, TransactionViewModel } from './interfaces';
import { operationTagsService, operationTagsStore } from './operationTags';
import { BaseService } from './service';

const logger = new Logger('OperationsService', { disabled: false });

export class OperationsService extends BaseService<Transaction> {
  private _operations = store<TransactionViewModel[]>([]);
  private _errorToastShown = false;

  get $operations() {
    return this._operations;
  }

  constructor() {
    super('OperationsService', 'transactions', 'transaction');

    accountsService.deleteAccountOperations = this.deleteTransactionsByAccount;

    derived(
      [this.$items, $initialized, accountsStore, categoriesStore, operationTagsStore],
      ([transactions, initialized, accounts, _categories, tags]) => {
        if (!initialized) return null;

        const categories = _categories.concat(SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT);

        const warnings: Array<unknown> = [];

        function findAccount(id: string) {
          const account = accounts.find((account) => account.id === id);
          if (!account) {
            const deletedAccount = accountsService.deletedItems.find((account) => account.id === id);
            if (!deletedAccount) {
              throw new Error(`Account ${id} not found`);
            }
            warnings.push(`Account "${deletedAccount.name}" ${id} is deleted`);
            return deletedAccount;
          }
          return account;
        }

        function findCategory(id: string) {
          const category = categories.find((category) => category.id === id);
          if (!category) {
            const deletedCategory = categoriesService.deletedItems.find((category) => category.id === id);
            if (!deletedCategory) {
              throw new Error(`Category ${id} not found`);
            }
            warnings.push(`Category "${deletedCategory.name}" ${id} is deleted`);
            return deletedCategory;
          }
          return category;
        }

        function findTag(id: string) {
          const tag = tags.find((tag) => tag.id === id);
          if (!tag) {
            const deletedTag = operationTagsService.deletedItems.find((tag) => tag.id === id);
            if (!deletedTag) {
              throw new Error(`Tag ${id} not found`);
            }
            warnings.push(`Tag "${deletedTag.name}" ${id} is deleted`);
            return deletedTag;
          }
          return tag;
        }

        transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

        const problems: Array<{ transaction: Transaction; e: unknown }> = [];

        const items = transactions
          .map((transaction) => {
            const linkedTransaction = transaction.linkedTransactionId
              ? transactions.find((t) => t.id === transaction.linkedTransactionId)
              : undefined;

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

        const problemsCount = problems.length + warnings.length;
        if (problemsCount) {
          logger.error('Data load problems:', problems, warnings);
          if (!this._errorToastShown) {
            const $translate = get(translate);
            showErrorToast($translate('common.data_problems', { values: { count: problemsCount } }));
            this._errorToastShown = true;
          }
        }

        return items;
      },
    ).subscribe((items) => {
      if (items) this._operations.set(items);
    });
  }

  deleteTransactionsByAccount(accountId: string): void {
    this.items
      .filter((transaction) => transaction.accountId == accountId)
      .forEach((transaction) => this.delete(transaction));
  }
}

export const operationsService = new OperationsService();

export const operationsStore = operationsService.$operations;
