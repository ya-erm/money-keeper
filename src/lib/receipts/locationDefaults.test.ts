import { describe, expect, it } from 'vitest';
import type { Transaction } from '#lib/data/interfaces.js';
import type { ReceiptDetails } from './serbianReceipt';
import { findReceiptLocation, getReceiptAddress, normalizeReceiptAddress } from './locationDefaults';

const details: ReceiptDetails = {
  merchant: 'Test shop',
  store: 'Branch 1',
  address: '  Test Street 12  ',
  city: '  Novi Sad  ',
  taxId: '',
  journal: '',
  items: [],
  itemsAvailable: false,
};
const address = 'Test Street 12, Novi Sad';
const position = { latitude: 45.2671, longitude: 19.8335 };
const operation = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'old',
  accountId: 'cash',
  categoryId: 'food',
  date: '2026-11-01T12:00:00Z',
  amount: 100,
  receiptUrl: 'https://suf.purs.gov.rs/v/?vl=test',
  receiptAddress: address,
  locationLat: position.latitude,
  locationLng: position.longitude,
  ...overrides,
});

describe('receipt addresses', () => {
  it('keeps the city and address independently of the merchant or branch name', () => {
    expect(getReceiptAddress(details)).toBe(address);
    expect(getReceiptAddress({ ...details, merchant: 'Another shop', store: 'Another branch' })).toBe(address);
    expect(getReceiptAddress({ ...details, city: 'Belgrade' })).not.toBe(address);
    expect(getReceiptAddress({ ...details, city: '' })).toBe('Test Street 12');
  });

  it('never uses a city or store name alone when the street address is missing', () => {
    expect(getReceiptAddress()).toBeUndefined();
    expect(getReceiptAddress({ ...details, address: '  ' })).toBeUndefined();
  });

  it('normalizes case and whitespace without conflating building numbers, accents or punctuation', () => {
    expect(normalizeReceiptAddress(' Test\tStreet 12,\nNOVI SAD ')).toBe('test street 12, novi sad');
    expect(normalizeReceiptAddress('Čaj 12')).not.toBe(normalizeReceiptAddress('Caj 12'));
    expect(normalizeReceiptAddress('Street 12')).not.toBe(normalizeReceiptAddress('Street 12a'));
    expect(normalizeReceiptAddress('Street 1-2')).not.toBe(normalizeReceiptAddress('Street 12'));
    expect(normalizeReceiptAddress(null)).toBe('');
  });
});

describe('receipt location defaults', () => {
  it('reuses the most recent valid location at the same address without mutating operations', () => {
    const latest = operation({ id: 'latest', date: '2026-11-02T12:00:00Z', locationLat: 45.2672 });
    const operations = [latest, operation()];
    const copy = structuredClone(operations);
    expect(findReceiptLocation(' test  STREET 12, novi sad ', operations)).toEqual({
      ...position,
      latitude: 45.2672,
    });
    expect(findReceiptLocation(address, [...operations].reverse())).toEqual(findReceiptLocation(address, operations));
    expect(operations).toEqual(copy);
  });

  it('uses transaction instants and breaks equal-date ties by id', () => {
    const earlier = operation({ date: '2026-11-01T12:00:00+02:00' });
    const a = operation({ id: 'a', locationLat: 40 });
    const b = operation({ id: 'b', locationLat: 41 });
    expect(findReceiptLocation(address, [b, earlier, a])).toEqual({ ...position, latitude: 41 });
  });

  it('does not match another city, another branch address, comments or legacy operations', () => {
    for (const receiptAddress of [undefined, null, '', 'Test Street 12, Belgrade', 'Test Street 13, Novi Sad']) {
      expect(findReceiptLocation(address, [operation({ receiptAddress, comment: address })])).toBeUndefined();
    }
    expect(findReceiptLocation(undefined, [operation()])).toBeUndefined();
    expect(findReceiptLocation(' ', [operation()])).toBeUndefined();
  });

  it('ignores deleted records, transfers, absent receipts, the current operation and invalid dates', () => {
    for (const overrides of [
      { deleted: true },
      { linkedTransactionId: 'other' },
      { receiptUrl: undefined },
      { receiptUrl: '' },
      { date: 'invalid' },
    ]) {
      expect(findReceiptLocation(address, [operation(overrides)])).toBeUndefined();
    }
    expect(findReceiptLocation(address, [operation()], 'old')).toBeUndefined();
  });

  it('ignores newer records without valid coordinates and permits coordinates at zero', () => {
    for (const overrides of [
      { locationLat: undefined },
      { locationLng: null },
      { locationLat: NaN },
      { locationLat: 91 },
      { locationLng: 181 },
    ]) {
      expect(
        findReceiptLocation(address, [
          operation({ ...overrides, id: 'new', date: '2026-11-02T12:00:00Z' }),
          operation(),
        ]),
      ).toEqual(position);
    }
    expect(findReceiptLocation(address, [operation({ locationLat: 0, locationLng: 0 })])).toEqual({
      latitude: 0,
      longitude: 0,
    });
  });

  it('can reuse a location across categories and accounts without organization metadata', () => {
    expect(findReceiptLocation(address, [operation({ categoryId: 'refund', accountId: 'bank' })])).toEqual(position);
  });
});
