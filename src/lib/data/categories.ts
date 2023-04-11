import { store } from '$lib/store';

import type { Category, JournalItem, Initialisable, JournalSubscriber } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { useDB } from './useDB';

export class CategoriesService implements Initialisable, JournalSubscriber {
  private _categories = store<Category[]>([]);

  /** Constructor */
  constructor(private _journalService: JournalService, private _membersService: MembersService) {}

  /** List of all categories */
  get categories() {
    return this._categories.value;
  }

  /** Readable store of all categories */
  get $categories() {
    return this._categories.readable;
  }

  /** Service name */
  get name() {
    return 'CategoriesService';
  }

  /** Initialisation */
  async init() {
    await this.loadFromDB();
  }

  /** Load categories from local DB to memory */
  private async loadFromDB() {
    const db = await useDB();
    const member = this._membersService.tryGetSelectedMember();
    const items = await db.getAllFromIndex('categories', 'by-owner', member.uuid);
    this._categories.set(items.filter((x) => !x.deleted));
  }

  /** Save one category to local DB */
  private async saveToDB(item: Category) {
    const db = await useDB();
    const member = this._membersService.tryGetSelectedMember();
    await db.put('categories', { ...item, owner: member.uuid });
  }

  /** Apply journal updates and optional save to DB */
  async applyChanges(changes: JournalItem[], saveToDB = false) {
    const updates = new Map<string, Category>();
    changes.forEach((item) => item.data.category && updates.set(item.data.category.id, item.data.category));
    const items = Array.from(updates.values());

    this._categories.update((prev) => {
      const dict = new Map<string, Category>();
      prev.forEach((item) => dict.set(item.id, item));
      items.forEach((item) => dict.set(item.id, item));
      return Array.from(dict.values()).filter((x) => !x.deleted);
    });

    if (saveToDB) {
      await Promise.all(items.map((item) => this.saveToDB(item)));
    }
  }

  /** Save category */
  save(item: Category) {
    // Add operation to queue
    this._journalService.addOperationToQueue({ category: item });
    // Apply changes in memory
    this._categories.update((prev) => {
      return prev.findIndex((x) => x.id === item.id) >= 0
        ? prev.map((x) => (x.id === item.id ? item : x))
        : prev.concat(item);
    });
  }

  /** Delete category */
  delete(item: Category) {
    // Add operation to queue
    this._journalService.addOperationToQueue({ category: { ...item, deleted: true } });
    // Apply changes in memory
    this._categories.update((prev) => prev.filter((x) => x.id !== item.id));
  }
}
