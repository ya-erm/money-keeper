import type { Account } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { BaseService } from './service';

export class AccountsService extends BaseService<Account> {
  constructor(journalService: JournalService, membersService: MembersService) {
    super('AccountsService', 'accounts', 'account', journalService, membersService);
  }

  get accounts() {
    return this.items;
  }

  get $accounts() {
    return this.$items;
  }
}