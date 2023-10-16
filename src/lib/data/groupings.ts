import type { Grouping } from './interfaces';
import { BaseService } from './service';

export class GroupingsService extends BaseService<Grouping> {
  constructor() {
    super('GroupingsService', 'groupings', 'grouping');
  }

  get groupings() {
    return this.items;
  }

  get $groupings() {
    return this.$items;
  }
}

export const groupingsService = new GroupingsService();

export const groupingsStore = groupingsService.$groupings;
