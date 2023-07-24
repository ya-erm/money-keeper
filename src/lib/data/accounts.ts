import { derived } from 'svelte/store';

import { filterNotEmpty } from '$lib/utils';

import { accountTagsStore } from './accountTags';
import type { Account, AccountViewModel, Tag } from './interfaces';
import { memberSettingsStore } from './members';
import { BaseService } from './service';

export class AccountsService extends BaseService<Account> {
  private _accountStore;

  constructor() {
    super('AccountsService', 'accounts', 'account');

    this._accountStore = derived([this.$items, accountTagsStore, memberSettingsStore], ([items, tags, settings]) =>
      this.mapItems(items, tags, settings?.accountsOrder),
    );
  }

  get $accounts() {
    return this._accountStore;
  }

  override delete(item: Account): void {
    super.delete(item);
    this.deleteAccountOperations(item.id);
  }

  private mapItems(items: Account[], tags: Tag[], accountsOrder: string[] = []): AccountViewModel[] {
    function getAccountOrder(account: Account) {
      const index = accountsOrder.findIndex((id) => id === account.id);
      return index < 0 ? items.length : index;
    }

    items.sort((a, b) => getAccountOrder(a) - getAccountOrder(b));

    return items.map((item) => ({
      ...item,
      tags: filterNotEmpty(item.tagIds?.map((tagId) => tags.find(({ id }) => id === tagId))),
    }));
  }

  public deleteAccountOperations: (accountId: string) => void = () => {
    throw new Error('accountsService.deleteAccountOperations is not set');
  };
}

export const accountsService = new AccountsService();

export const accountsStore = accountsService.$accounts;
