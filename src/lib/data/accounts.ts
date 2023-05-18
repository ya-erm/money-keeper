import { derived } from 'svelte/store';

import type { Account } from './interfaces';
import { BaseService } from './service';
import { transactionsService } from './transactions';

export class AccountsService extends BaseService<Account> {
  private _accounts: Account[] = [];
  private _accountStore;

  constructor() {
    super('AccountsService', 'accounts', 'account');

    this._accountStore = derived(this.$items, (items) => this.mapItems(items));
    this._accountStore.subscribe((items) => (this._accounts = items));
  }

  get accounts() {
    return this._accounts;
  }

  get $accounts() {
    return this._accountStore;
  }

  override delete(item: Account): void {
    super.delete(item);
    transactionsService.deleteTransactionsByAccount(item.id);
  }

  private mapItems(items: Account[]) {
    items.sort((a, b) => a.order - b.order);
    return items;
  }
}

export const accountsService = new AccountsService();
