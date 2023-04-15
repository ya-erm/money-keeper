import type { Tag } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { BaseService } from './service';

export class TagsService extends BaseService<Tag> {
  constructor(journalService: JournalService, membersService: MembersService) {
    super('TagsService', 'tags', 'tag', journalService, membersService);
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
