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
import { SNAPSHOT_KEY_BY_STORAGE } from './snapshot';
import { useDB } from './useDB';

type StorageName =
  'categories' | 'accounts' | 'transactions' | 'tags' | 'accountTags' | 'currencyRates' | 'groupings' | 'repeatings';

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

  /** Save items to local DB */
  private async saveToDB(items: T[]) {
    if (items.length === 0) return;
    const db = await useDB();
    const member = membersService.getSelectedMember();
    const tx = db.transaction(this._storageName, 'readwrite');
    await Promise.all([...items.map((item) => tx.store.put({ ...item, owner: member.uuid })), tx.done]);
  }

  /** Replace all items of the member in local DB */
  private async replaceInDB(items: T[]) {
    const db = await useDB();
    const member = membersService.getSelectedMember();
    const tx = db.transaction(this._storageName, 'readwrite');
    const keys = await tx.store.index('by-owner').getAllKeys(member.uuid);
    await Promise.all([
      ...keys.map((key) => tx.store.delete(key)),
      ...items.map((item) => tx.store.put({ ...item, owner: member.uuid })),
      tx.done,
    ]);
  }

  /**
   * Apply journal updates and optional save to DB.
   * Changes are applied in order, a `snapshot` item replaces all items before it.
   */
  async applyChanges(changes: Pick<JournalItem, 'data'>[], saveToDB = false) {
    const updates = new Map<string, T>();
    let snapshotItems: T[] | null = null;

    changes.forEach((item) => {
      const snapshot = item.data.snapshot;
      if (snapshot) {
        snapshotItems = (snapshot[SNAPSHOT_KEY_BY_STORAGE[this._storageName]] ?? []) as unknown as T[];
        updates.clear();
      }
      const update = item.data[this._journalKey] as unknown as T;
      if (update) {
        updates.set(update.id, update);
      }
    });
    const items = Array.from(updates.values());
    const replaced = snapshotItems as T[] | null;

    this._items.update((prev) => {
      const dict = new Map<string, T>();
      if (replaced) {
        replaced.forEach((item) => dict.set(item.id, item));
      } else {
        prev.active.forEach((item) => dict.set(item.id, item));
        prev.deleted.forEach((item) => dict.set(item.id, item));
      }
      items.forEach((item) => dict.set(item.id, item));
      const allItems = Array.from(dict.values());
      return {
        active: allItems.filter((x) => !x.deleted),
        deleted: allItems.filter((x) => x.deleted),
      };
    });

    if (saveToDB) {
      if (replaced) {
        await this.replaceInDB([...this._items.value.active, ...this._items.value.deleted]);
      } else {
        await this.saveToDB(items);
      }
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
