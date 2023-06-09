import type { Tag } from './interfaces';
import { BaseService } from './service';

export class AccountTagsService extends BaseService<Tag> {
  constructor() {
    super('AccountTagsService', 'accountTags', 'accountTag');
  }

  get tags() {
    return this.items;
  }

  get $tags() {
    return this.$items;
  }

  save(item: Tag): void {
    // TODO: check if tag name is unique
    super.save(item);
  }
}

export const accountTagsService = new AccountTagsService();

export const accountTagsStore = accountTagsService.$tags;
