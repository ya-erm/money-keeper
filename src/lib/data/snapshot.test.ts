import { describe, expect, it } from 'vitest';

import type { Account, Category, JournalItem, Transaction } from './interfaces';
import { countSnapshotEntities, reduceJournal, UnknownJournalKeyError } from './snapshot';

const category: Category = { id: 'cat-1', name: 'Food', type: 'OUT' };
const account: Account = { id: 'acc-1', name: 'Cash', currency: 'RSD' };

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'op-1',
    accountId: account.id,
    categoryId: category.id,
    date: '2026-08-01T10:00:00+02:00',
    amount: 100,
    ...overrides,
  };
}

describe('reduceJournal', () => {
  it('returns empty snapshot for empty journal', () => {
    const snapshot = reduceJournal([]);
    expect(countSnapshotEntities(snapshot)).toBe(0);
    expect(snapshot.accountsOrder).toBeUndefined();
  });

  it('collects entities of every kind', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { category } },
      { order: 2, data: { account } },
      { order: 3, data: { accountTag: { id: 'atag-1', name: 'Bank' } } },
      { order: 4, data: { tag: { id: 'tag-1', name: 'Trip' } } },
      { order: 5, data: { transaction: transaction() } },
      { order: 6, data: { currencyRate: { id: 'rate-1', cur1: 'EUR', cur2: 'RSD', rate: 117 } } },
      { order: 7, data: { grouping: { id: 'grp-1', name: 'Family' } } },
      { order: 8, data: { repeating: { id: 'rep-1', count: 1, interval: 'month' } } },
      { order: 9, data: { accountsOrder: ['acc-1'] } },
      { order: 10, data: { categoriesInOrder: ['cat-in'], categoriesOutOrder: ['cat-1'] } },
    ];

    const snapshot = reduceJournal(journal);

    expect(snapshot.categories).toEqual([category]);
    expect(snapshot.accounts).toEqual([account]);
    expect(snapshot.accountTags).toHaveLength(1);
    expect(snapshot.operationTags).toHaveLength(1);
    expect(snapshot.operations).toEqual([transaction()]);
    expect(snapshot.currencyRates).toHaveLength(1);
    expect(snapshot.groupings).toHaveLength(1);
    expect(snapshot.repeatings).toHaveLength(1);
    expect(snapshot.accountsOrder).toEqual(['acc-1']);
    expect(snapshot.categoriesInOrder).toEqual(['cat-in']);
    expect(snapshot.categoriesOutOrder).toEqual(['cat-1']);
  });

  it('applies items by order regardless of input order, last write wins', () => {
    const journal: JournalItem[] = [
      { order: 3, data: { transaction: transaction({ amount: 300 }) } },
      { order: 1, data: { transaction: transaction({ amount: 100 }) } },
      { order: 2, data: { transaction: transaction({ amount: 200 }) } },
    ];

    const snapshot = reduceJournal(journal);

    expect(snapshot.operations).toEqual([transaction({ amount: 300 })]);
  });

  it('keeps the latest settings only', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { accountsOrder: ['a', 'b'] } },
      { order: 2, data: { accountsOrder: ['b', 'a'] } },
    ];

    expect(reduceJournal(journal).accountsOrder).toEqual(['b', 'a']);
  });

  it('drops deleted entities by default', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { transaction: transaction() } },
      { order: 2, data: { transaction: transaction({ deleted: true }) } },
      { order: 3, data: { category } },
      { order: 4, data: { category: { ...category, deleted: true } } },
    ];

    const snapshot = reduceJournal(journal);

    expect(snapshot.operations).toEqual([]);
    expect(snapshot.categories).toEqual([]);
  });

  it('keeps all deleted entities with "all" option', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { transaction: transaction({ deleted: true }) } },
      { order: 2, data: { category: { ...category, deleted: true } } },
    ];

    const snapshot = reduceJournal(journal, { deleted: 'all' });

    expect(snapshot.operations).toEqual([transaction({ deleted: true })]);
    expect(snapshot.categories).toEqual([{ ...category, deleted: true }]);
  });

  it('keeps deleted entities except operations with "referenced" option', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { transaction: transaction({ deleted: true }) } },
      { order: 2, data: { category: { ...category, deleted: true } } },
      { order: 3, data: { account: { ...account, deleted: true } } },
    ];

    const snapshot = reduceJournal(journal, { deleted: 'referenced' });

    expect(snapshot.operations).toEqual([]);
    expect(snapshot.categories).toEqual([{ ...category, deleted: true }]);
    expect(snapshot.accounts).toEqual([{ ...account, deleted: true }]);
  });

  it('restores an entity that was deleted and then saved again', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { transaction: transaction({ deleted: true }) } },
      { order: 2, data: { transaction: transaction({ amount: 50 }) } },
    ];

    expect(reduceJournal(journal).operations).toEqual([transaction({ amount: 50 })]);
  });

  it('snapshot item replaces everything before it and later items apply on top', () => {
    const journal: JournalItem[] = [
      { order: 1, data: { transaction: transaction({ id: 'old', amount: 1 }) } },
      { order: 2, data: { category: { id: 'old-cat', name: 'Old', type: 'IN' } } },
      { order: 3, data: { accountsOrder: ['old'] } },
      {
        order: 4,
        data: {
          snapshot: {
            categories: [category, { id: 'deleted-cat', name: 'Deleted', type: 'OUT', deleted: true }],
            accountTags: [],
            accounts: [account],
            operationTags: [],
            operations: [transaction()],
            currencyRates: [],
            groupings: [],
            repeatings: [],
            categoriesOutOrder: ['cat-1'],
          },
        },
      },
      { order: 5, data: { transaction: transaction({ id: 'op-2', amount: 7 }) } },
      { order: 6, data: { transaction: transaction({ deleted: true }) } },
    ];

    const snapshot = reduceJournal(journal, { deleted: 'referenced' });

    expect(snapshot.operations).toEqual([transaction({ id: 'op-2', amount: 7 })]);
    expect(snapshot.categories.map((c) => c.id)).toEqual(['cat-1', 'deleted-cat']);
    expect(snapshot.accounts).toEqual([account]);
    expect(snapshot.accountsOrder).toBeUndefined();
    expect(snapshot.categoriesOutOrder).toEqual(['cat-1']);
  });

  it('throws on unknown journal keys', () => {
    const journal = [{ order: 7, data: { somethingNew: { id: 'x' } } }] as unknown as JournalItem[];

    expect(() => reduceJournal(journal)).toThrow(UnknownJournalKeyError);
    expect(() => reduceJournal(journal)).toThrow('somethingNew');
  });

  it('ignores null and undefined values', () => {
    const journal = [{ order: 1, data: { transaction: undefined, category: null } }] as unknown as JournalItem[];

    expect(countSnapshotEntities(reduceJournal(journal))).toBe(0);
  });
});
