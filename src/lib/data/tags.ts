import type { Tag } from './interfaces';
import { BaseService } from './service';

export class TagsService extends BaseService<Tag> {
  constructor() {
    super('TagsService', 'tags', 'tag');
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

export const tagsService = new TagsService();
