import { describe, expect, it } from 'vitest';
import type { Category, TransactionViewModel } from '#lib/data/interfaces.js';
import type { ReceiptDetails } from './serbianReceipt';
import {
  findReceiptOrganizationDefaults,
  getReceiptOrganizationName,
  normalizeReceiptOrganizationName,
} from './organizationDefaults';

const food: Category = { id: 'food', name: 'Food', type: 'OUT' };
const other: Category = { id: 'other', name: 'Other', type: 'OUT' };
const refund: Category = { id: 'refund', name: 'Refund', type: 'IN' };
const categories = [food, other, refund];

const operation = (overrides: Partial<TransactionViewModel> = {}): TransactionViewModel => ({
  id: 'old',
  date: '2026-10-01T10:00:00Z',
  amount: 100,
  accountId: 'cash',
  account: { id: 'cash', name: 'Cash', currency: 'RSD' },
  categoryId: food.id,
  category: food,
  comment: 'Лидл',
  receiptOrganizationName: 'LIDL SRBIJA KD',
  tags: [],
  ...overrides,
});

describe('receipt organization identity', () => {
  const details: ReceiptDetails = {
    store: '1057443-Prodavnica br. 0153',
    merchant: '  LIDL SRBIJA KD  ',
    address: '',
    city: '',
    taxId: '',
    journal: '',
    items: [],
    itemsAvailable: false,
  };

  it('uses the organization, never the branch as a fallback', () => {
    expect(getReceiptOrganizationName(details)).toBe('LIDL SRBIJA KD');
    expect(getReceiptOrganizationName({ ...details, store: '  ' })).toBe('LIDL SRBIJA KD');
    expect(getReceiptOrganizationName({ ...details, merchant: ' ' })).toBeUndefined();
    expect(getReceiptOrganizationName({ ...details, merchant: '' })).toBeUndefined();
    expect(getReceiptOrganizationName()).toBeUndefined();
  });

  it('uses the same identity across different branches and preserves the Russian comment', () => {
    const firstBranch = details;
    const anotherBranch = { ...details, store: '1057443-Prodavnica br. 0001' };
    const previous = operation({ receiptOrganizationName: getReceiptOrganizationName(firstBranch), comment: 'Лидл' });
    expect(
      findReceiptOrganizationDefaults(getReceiptOrganizationName(anotherBranch), 'OUT', [previous], categories),
    ).toEqual({ comment: 'Лидл', categoryId: food.id });
  });

  it('normalizes only whitespace and case, not accents, punctuation or legal names', () => {
    expect(normalizeReceiptOrganizationName('  LIDL\t SRBIJA\nKD ')).toBe('lidl srbija kd');
    expect(normalizeReceiptOrganizationName('Čaj & Co.')).not.toBe(normalizeReceiptOrganizationName('Caj Co'));
    expect(normalizeReceiptOrganizationName(null)).toBe('');
  });
});

describe('receipt defaults', () => {
  const find = (operations: TransactionViewModel[], activeCategories = categories, excludedId?: string) =>
    findReceiptOrganizationDefaults('lidl  SRBIJA kd', 'OUT', operations, activeCategories, excludedId);

  it('reuses the latest matching operation without relying on input order or mutating it', () => {
    const newest = operation({
      id: 'new',
      date: '2026-10-12T10:00:00Z',
      comment: 'Lunch',
      categoryId: other.id,
      category: other,
    });
    const operations = [newest, operation()];
    expect(find(operations)).toEqual({ comment: 'Lunch', categoryId: other.id });
    expect(operations).toEqual([newest, operation()]);
    expect(find([...operations].reverse())).toEqual(find(operations));
  });

  it('compares dates as instants and breaks ties deterministically by id', () => {
    const a = operation({ id: 'a', date: '2026-10-12T10:00:00+02:00', comment: 'Earlier' });
    const b = operation({ id: 'b', date: '2026-10-12T09:00:00Z', comment: 'Latest' });
    const c = operation({ id: 'c', date: b.date, comment: 'Tie winner' });
    expect(find([a, c, b])?.comment).toBe('Tie winner');
    expect(find([b, c, a])?.comment).toBe('Tie winner');
  });

  it('does not guess organization identity from comments, similar names or empty fields', () => {
    expect(find([operation({ receiptOrganizationName: undefined, comment: 'LIDL SRBIJA KD' })])).toBeUndefined();
    for (const name of ['', ' ', null, 'LIDL SRBIJA', 'LIDL-SRBIJA KD', 'LIDL SRBIJA KD Ltd']) {
      expect(find([operation({ receiptOrganizationName: name })])).toBeUndefined();
    }
    expect(findReceiptOrganizationDefaults(undefined, 'OUT', [operation()], categories)).toBeUndefined();
  });

  it('excludes deleted operations, transfers, system categories, opposite directions and invalid dates', () => {
    const invalid = [
      operation({ deleted: true }),
      operation({ linkedTransactionId: 'transfer-in' }),
      operation({ category: { ...food, system: true } }),
      operation({ categoryId: refund.id, category: refund }),
      operation({ date: 'invalid' }),
    ];
    expect(find(invalid)).toBeUndefined();
    expect(find([operation()], categories, 'old')).toBeUndefined();
  });

  it('keeps the newest comment when its category was deleted, instead of choosing an older operation', () => {
    const newest = operation({
      id: 'new',
      date: '2026-10-12T10:00:00Z',
      comment: 'Latest comment',
      categoryId: other.id,
      category: { ...other, deleted: true },
    });
    expect(find([operation(), newest], [food])).toEqual({ comment: 'Latest comment', categoryId: null });
    expect(find([operation(), newest], [food, { ...other, deleted: true }])).toEqual({
      comment: 'Latest comment',
      categoryId: null,
    });
  });

  it('never suggests a missing, system or now incompatible category', () => {
    expect(find([operation()], [])?.categoryId).toBeNull();
    expect(find([operation()], [{ ...food, system: true }])?.categoryId).toBeNull();
    expect(find([operation()], [{ ...food, type: 'IN' }])?.categoryId).toBeNull();
  });

  it('preserves an intentionally empty latest comment rather than falling back to an older comment', () => {
    const newest = operation({ id: 'new', date: '2026-10-12T10:00:00Z', comment: '' });
    expect(find([operation(), newest])).toEqual({ comment: '', categoryId: food.id });
    expect(find([operation({ comment: null })])?.comment).toBe('');
  });

  it('can independently reuse refund defaults without expense defaults leaking into them', () => {
    const incoming = operation({ id: 'in', category: refund, categoryId: refund.id, comment: 'Returned item' });
    expect(findReceiptOrganizationDefaults('LIDL SRBIJA KD', 'IN', [operation(), incoming], categories)).toEqual({
      comment: 'Returned item',
      categoryId: refund.id,
    });
  });
});
