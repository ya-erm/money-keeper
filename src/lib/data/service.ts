import { store } from '$lib/store';
import { derived, type Readable } from 'svelte/store';

import type {
  Account,
  Category,
  CurrencyRate,
  Initialisable,
  JournalItem,
  JournalOperation,
  JournalSubscriber,
  Repeating,
  Tag,
  Transaction,
} from './interfaces';
import { journalService } from './journal';
import { membersService } from './members';
import { useDB } from './useDB';

type StorageName =
  | 'categories'
  | 'accounts'
  | 'transactions'
  | 'tags'
  | 'accountTags'
  | 'currencyRates'
  | 'groupings'
  | 'repeatings';

type EntityType = Category | Account | Transaction | Tag | CurrencyRate | Repeating;

export class BaseService<T extends EntityType> implements Initialisable, JournalSubscriber {
  private _name: string;
  private _journalKey: keyof JournalOperation;
  private _storageName: StorageName;
  private _items = store<{
    active: T[];
    deleted: T[];
  }>({
    active: [],
    deleted: [],
  });
  private _activeItems: Readable<T[]>;

  /** Constructor */
  constructor(serviceName: string, storageName: StorageName, journalOperationKey: keyof JournalOperation) {
    this._name = serviceName;
    this._storageName = storageName;
    this._journalKey = journalOperationKey;

    this._activeItems = derived(this._items, ({ active }) => active);
  }

  /** List of all items */
  public get items() {
    return this._items.value.active;
  }

  /** Readable store of all items */
  protected get $items() {
    return this._activeItems;
  }

  /** List of deleted items */
  public get deletedItems() {
    return this._items.value.deleted;
  }

  /** Service name */
  get name() {
    return this._name;
  }

  /** Initialisation */
  async init() {
    await this.loadFromDB();
  }

  /** Load items from local DB to memory */
  private async loadFromDB() {
    const db = await useDB();
    const member = membersService.getSelectedMember();
    const allItems = (await db.getAllFromIndex(this._storageName, 'by-owner', member.uuid)) as unknown as T[];
    this._items.set({
      active: allItems.filter((x) => !x.deleted),
      deleted: allItems.filter((x) => x.deleted),
    });
  }

  /** Save one item to local DB */
  private async saveToDB(item: T) {
    const db = await useDB();
    const member = membersService.getSelectedMember();
    await db.put(this._storageName, { ...item, owner: member.uuid });
  }

  /** Apply journal updates and optional save to DB */
  async applyChanges(changes: Pick<JournalItem, 'data'>[], saveToDB = false) {
    const updates = new Map<string, T>();
    changes.forEach((item) => {
      const update = item.data[this._journalKey] as unknown as T;
      if (update) {
        updates.set(update.id, update);
      }
    });
    const items = Array.from(updates.values());

    this._items.update((prev) => {
      const dict = new Map<string, T>();
      prev.active.forEach((item) => dict.set(item.id, item));
      prev.deleted.forEach((item) => dict.set(item.id, item));
      items.forEach((item) => dict.set(item.id, item));
      const allItems = Array.from(dict.values());
      return {
        active: allItems.filter((x) => !x.deleted),
        deleted: allItems.filter((x) => x.deleted),
      };
    });

    if (saveToDB) {
      await Promise.all(items.map((item) => this.saveToDB(item)));
    }
  }

  /** Get item by id */
  getById(id: string) {
    return this.items.find((x) => x.id === id);
  }

  /** Save item */
  save(item: T) {
    const operation = { [this._journalKey]: item };
    // Apply changes in memory and save to DB
    void this.applyChanges([{ data: operation }], true);
    // Add operation to queue
    void journalService.addOperationToQueue(operation);
  }

  /** Delete item */
  delete(item: T) {
    const operation = { [this._journalKey]: { ...item, deleted: true } };
    // Apply changes in memory and save to DB
    void this.applyChanges([{ data: operation }], true);
    // Add operation to queue
    void journalService.addOperationToQueue(operation);
  }
}
