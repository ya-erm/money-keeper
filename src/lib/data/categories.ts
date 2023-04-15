import type { Category } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { BaseService } from './service';

export class CategoriesService extends BaseService<Category> {
  constructor(journalService: JournalService, membersService: MembersService) {
    super('CategoriesService', 'categories', 'category', journalService, membersService);
  }

  get categories() {
    return this.items;
  }

  get $categories() {
    return this.$items;
  }
}

export const SYSTEM_CATEGORY_TRANSFER_IN: Category = {
  id: '00000000-0001-0001-b91e-1a1822f82ab9',
  type: 'IN',
  name: 'system.category.transfer_in',
  icon: 'mdi:swap-horizontal',
};

export const SYSTEM_CATEGORY_TRANSFER_OUT: Category = {
  id: '00000000-0001-0002-8ff6-187bca92f3f9',
  type: 'OUT',
  name: 'system.category.transfer_out',
  icon: 'mdi:swap-horizontal',
};
