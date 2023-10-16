import { store } from '$lib/store';

import type {
  Account,
  Category,
  CurrencyRate,
  Initialisable,
  JournalItem,
  JournalOperation,
  JournalSubscriber,
  Tag,
  Transaction,
} from './interfaces';
import { journalService } from './journal';
import { membersService } from './members';
import { useDB } from './useDB';

type StorageName = 'categories' | 'accounts' | 'transactions' | 'tags' | 'accountTags' | 'currencyRates' | 'groupings';

type EntityType = Category | Account | Transaction | Tag | CurrencyRate;

export class BaseService<T extends EntityType> implements Initialisable, JournalSubscriber {
  private _name: string;
  private _journalKey: keyof JournalOperation;
  private _storageName: StorageName;
  private _items = store<T[]>([]);

  /** Constructor */
  constructor(serviceName: string, storageName: StorageName, journalOperationKey: keyof JournalOperation) {
    this._name = serviceName;
    this._storageName = storageName;
    this._journalKey = journalOperationKey;
  }

  /** List of all items */
  public get items() {
    return this._items.value;
  }

  /** Readable store of all items */
  protected get $items() {
    return this._items.readable;
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
    const member = membersService.tryGetSelectedMember();
    const allItems = (await db.getAllFromIndex(this._storageName, 'by-owner', member.uuid)) as unknown as T[];
    this._items.set(allItems.filter((x) => !x.deleted));
  }

  /** Save one item to local DB */
  private async saveToDB(item: T) {
    const db = await useDB();
    const member = membersService.tryGetSelectedMember();
    await db.put(this._storageName, { ...item, owner: member.uuid });
  }

  /** Apply journal updates and optional save to DB */
  async applyChanges(changes: JournalItem[], saveToDB = false) {
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
      prev.forEach((item) => dict.set(item.id, item));
      items.forEach((item) => dict.set(item.id, item));
      return Array.from(dict.values()).filter((x) => !x.deleted);
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
    // Add operation to queue
    journalService.addOperationToQueue({ [this._journalKey]: item });
    // Apply changes in memory
    this._items.update((prev) => {
      return prev.findIndex((x) => x.id === item.id) >= 0
        ? prev.map((x) => (x.id === item.id ? item : x))
        : prev.concat(item);
    });
  }

  /** Delete item */
  delete(item: T) {
    // Add operation to queue
    journalService.addOperationToQueue({ [this._journalKey]: { ...item, deleted: true } });
    // Apply changes in memory
    this._items.update((prev) => prev.filter((x) => x.id !== item.id));
  }
}
