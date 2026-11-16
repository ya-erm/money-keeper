import type { DebtContact } from './interfaces';
import { BaseService } from './service';

class DebtContactsService extends BaseService<DebtContact> {
  constructor() {
    super('DebtContactsService', 'debtContacts', 'debtContact');
  }
  get $contacts() {
    return this.$items;
  }
}

export const debtContactsService = new DebtContactsService();
export const debtContactsStore = debtContactsService.$contacts;
