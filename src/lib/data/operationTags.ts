import type { Tag } from './interfaces';
import { BaseService } from './service';

export class OperationTagsService extends BaseService<Tag> {
  constructor() {
    super('OperationTagsService', 'tags', 'tag');
  }

  get $tags() {
    return this.$items;
  }

  save(item: Tag): void {
    // TODO: check if tag name is unique
    super.save(item);
  }
}

export const operationTagsService = new OperationTagsService();

export const operationTagsStore = operationTagsService.$tags;
