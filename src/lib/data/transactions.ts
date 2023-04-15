import type { Transaction } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { BaseService } from './service';

export class TransactionsService extends BaseService<Transaction> {
  constructor(journalService: JournalService, membersService: MembersService) {
    super('TransactionsService', 'transactions', 'transaction', journalService, membersService);
  }

  get transactions() {
    return this.items;
  }

  get $transactions() {
    return this.$items;
  }
}
