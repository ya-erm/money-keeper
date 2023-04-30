import type { Account } from './interfaces';
import { BaseService } from './service';
import { transactionsService } from './transactions';

export class AccountsService extends BaseService<Account> {
  constructor() {
    super('AccountsService', 'accounts', 'account');
  }

  get accounts() {
    return this.items;
  }

  get $accounts() {
    return this.$items;
  }

  override delete(item: Account): void {
    super.delete(item);
    transactionsService.deleteTransactionsByAccount(item.id);
  }
}

export const accountsService = new AccountsService();
