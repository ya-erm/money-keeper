import type { Transaction } from './interfaces';
import { BaseService } from './service';

export class TransactionsService extends BaseService<Transaction> {
  constructor() {
    super('TransactionsService', 'transactions', 'transaction');
  }

  get transactions() {
    return this.items;
  }

  get $transactions() {
    return this.$items;
  }

  deleteTransactionsByAccount(accountId: string): void {
    this.items
      .filter((transaction) => transaction.accountId == accountId)
      .forEach((transaction) => this.delete(transaction));
  }
}

export const transactionsService = new TransactionsService();
