import type {
  Account,
  Category,
  CurrencyRate,
  Grouping,
  JournalOperation,
  Repeating,
  Tag,
  Transaction,
} from './interfaces';

/**
 * Current state of all entities, obtained by reducing the journal.
 * The shape matches the JSON export of the import/export page.
 */
export type Snapshot = {
  categories: Category[];
  accountTags: Tag[];
  accounts: Account[];
  operationTags: Tag[];
  operations: Transaction[];
  currencyRates: CurrencyRate[];
  groupings: Grouping[];
  repeatings: Repeating[];
  accountsOrder?: string[];
  categoriesInOrder?: string[];
  categoriesOutOrder?: string[];
};

export type SnapshotEntityKey = Exclude<keyof Snapshot, 'accountsOrder' | 'categoriesInOrder' | 'categoriesOutOrder'>;

type SnapshotEntity = Snapshot[SnapshotEntityKey][number];

/** Map from journal operation key to snapshot collection */
const ENTITY_KEYS: { [key in keyof JournalOperation]: SnapshotEntityKey | 'setting' | 'snapshot' } = {
  category: 'categories',
  accountTag: 'accountTags',
  account: 'accounts',
  tag: 'operationTags',
  transaction: 'operations',
  currencyRate: 'currencyRates',
  grouping: 'groupings',
  repeating: 'repeatings',
  accountsOrder: 'setting',
  categoriesInOrder: 'setting',
  categoriesOutOrder: 'setting',
  snapshot: 'snapshot',
};

/** Map from local storage name to snapshot collection */
export const SNAPSHOT_KEY_BY_STORAGE = {
  categories: 'categories',
  accountTags: 'accountTags',
  accounts: 'accounts',
  tags: 'operationTags',
  transactions: 'operations',
  currencyRates: 'currencyRates',
  groupings: 'groupings',
  repeatings: 'repeatings',
} as const satisfies Record<string, SnapshotEntityKey>;

export const SNAPSHOT_ENTITY_KEYS: SnapshotEntityKey[] = [
  'categories',
  'accountTags',
  'accounts',
  'operationTags',
  'operations',
  'currencyRates',
  'groupings',
  'repeatings',
];

export class UnknownJournalKeyError extends Error {
  constructor(
    public key: string,
    public order: number,
  ) {
    super(`Unknown journal operation key "${key}" at order ${order}`);
  }
}

export type ReduceJournalOptions = {
  /**
   * Which deleted entities to keep in the result.
   * - `all`: keep every deleted entity (with `deleted: true`)
   * - `none`: drop every deleted entity
   * - `referenced`: keep deleted entities except operations. Deleted accounts, categories and tags
   *    may still be referenced by operations, so the app needs them to render such operations.
   */
  deleted: 'all' | 'none' | 'referenced';
};

const DEFAULT_OPTIONS: ReduceJournalOptions = { deleted: 'none' };

export function createEmptySnapshot(): Snapshot {
  return {
    categories: [],
    accountTags: [],
    accounts: [],
    operationTags: [],
    operations: [],
    currencyRates: [],
    groupings: [],
    repeatings: [],
  };
}

/**
 * Reduce journal to the current state.
 * Items are applied in the order of `order`, the last write for each entity id wins.
 * @throws {UnknownJournalKeyError} if a journal operation contains an unknown key,
 *  so that new kinds of data are never silently dropped.
 */
export function reduceJournal(
  items: Array<{ order: number; data: JournalOperation }>,
  options: Partial<ReduceJournalOptions> = {},
): Snapshot {
  const { deleted } = { ...DEFAULT_OPTIONS, ...options };

  const maps = new Map<SnapshotEntityKey, Map<string, SnapshotEntity>>();
  SNAPSHOT_ENTITY_KEYS.forEach((key) => maps.set(key, new Map()));

  const settings: Pick<Snapshot, 'accountsOrder' | 'categoriesInOrder' | 'categoriesOutOrder'> = {};

  const sorted = [...items].sort((a, b) => a.order - b.order);

  for (const item of sorted) {
    for (const [key, value] of Object.entries(item.data)) {
      if (value === undefined || value === null) continue;
      const target = ENTITY_KEYS[key as keyof JournalOperation];
      if (!target) {
        throw new UnknownJournalKeyError(key, item.order);
      }
      if (target === 'snapshot') {
        // Snapshot replaces everything before it
        const snapshot = value as Snapshot;
        for (const entityKey of SNAPSHOT_ENTITY_KEYS) {
          const map = new Map<string, SnapshotEntity>();
          (snapshot[entityKey] ?? []).forEach((entity) => map.set(entity.id, entity));
          maps.set(entityKey, map);
        }
        delete settings.accountsOrder;
        delete settings.categoriesInOrder;
        delete settings.categoriesOutOrder;
        if (snapshot.accountsOrder) settings.accountsOrder = snapshot.accountsOrder;
        if (snapshot.categoriesInOrder) settings.categoriesInOrder = snapshot.categoriesInOrder;
        if (snapshot.categoriesOutOrder) settings.categoriesOutOrder = snapshot.categoriesOutOrder;
        continue;
      }
      if (target === 'setting') {
        settings[key as keyof typeof settings] = value as string[];
        continue;
      }
      const entity = value as SnapshotEntity;
      maps.get(target)?.set(entity.id, entity);
    }
  }

  const snapshot = createEmptySnapshot();

  for (const key of SNAPSHOT_ENTITY_KEYS) {
    const entities = Array.from(maps.get(key)?.values() ?? []);
    const keepDeleted = deleted === 'all' || (deleted === 'referenced' && key !== 'operations');
    (snapshot[key] as SnapshotEntity[]) = keepDeleted ? entities : entities.filter((entity) => !entity.deleted);
  }

  if (settings.accountsOrder) snapshot.accountsOrder = settings.accountsOrder;
  if (settings.categoriesInOrder) snapshot.categoriesInOrder = settings.categoriesInOrder;
  if (settings.categoriesOutOrder) snapshot.categoriesOutOrder = settings.categoriesOutOrder;

  return snapshot;
}

/** Count entities in a snapshot */
export function countSnapshotEntities(snapshot: Snapshot) {
  return SNAPSHOT_ENTITY_KEYS.reduce((sum, key) => sum + snapshot[key].length, 0);
}
