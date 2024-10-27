import dayjs from 'dayjs';
import { derived, get, type Readable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import { translate } from '$lib/translate';
import { showErrorToast } from '$lib/ui/toasts';
import { Logger } from '$lib/utils/logger';

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
  private _operations: Readable<TransactionViewModel[]>;
  private _comments: Readable<string[]>;
  private _errorToastShown = false;

  get $operations() {
    return this._operations;
  }

  get $comments() {
    return this._comments;
  }

  constructor() {
    super('OperationsService', 'transactions', 'transaction');

    accountsService.deleteAccountOperations = this.deleteTransactionsByAccount;

    this._operations = derived(
      [this.$items, $initialized, accountsStore, categoriesStore, operationTagsStore],
      ([transactions, initialized, accounts, _categories, tags]) => {
        if (!initialized) return [];

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
    );

    this._comments = derived(this.$operations, (items) =>
      Array.from(new Set(items.map((item) => item.comment?.trim()).filter(Boolean) as string[])),
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
export const operationsCommentsStore = operationsService.$comments;

/** Delete operation and linked operation */
export function deleteOperation(id: string) {
  const item = operationsService.getById(id);
  if (item) {
    operationsService.delete(item);
    if (item.linkedTransactionId) {
      const linkedOperation = operationsService.getById(item.linkedTransactionId);
      if (linkedOperation) {
        operationsService.delete(linkedOperation);
      }
    }
  }
}

/** Create a copy of operation (note: don't forget to change id if needed) */
export function cloneOperation(item: Transaction): Transaction {
  return {
    id: item.id,
    accountId: item.accountId,
    categoryId: item.categoryId,
    date: item.date,
    timeZone: item.timeZone,
    amount: item.amount,
    comment: item.comment,
    description: item.description,
    linkedTransactionId: item.linkedTransactionId,
    anotherCurrency: item.anotherCurrency,
    anotherCurrencyAmount: item.anotherCurrencyAmount,
    excludeFromAnalysis: item.excludeFromAnalysis,
    tagIds: item.tagIds ? [...item.tagIds] : undefined,
  };
}

/** Create a new copy of operation (also copy linked operation if it exists) */
export function copyOperation(operation: Transaction) {
  const copiedOperation = cloneOperation(operation);
  copiedOperation.id = uuid();
  if (operation.linkedTransactionId) {
    const linkedOperation = operationsService.getById(operation.linkedTransactionId);
    if (linkedOperation) {
      const copiedLinkedOperation = cloneOperation(linkedOperation);
      copiedLinkedOperation.id = uuid();
      copiedLinkedOperation.linkedTransactionId = copiedOperation.id;
      copiedOperation.linkedTransactionId = copiedLinkedOperation.id;
      operationsService.save(copiedLinkedOperation);
    }
  }
  operationsService.save(copiedOperation);
}
