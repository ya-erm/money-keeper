import { describe, expect, it } from 'vitest';

import type { Transaction } from './interfaces';
import { isVerificationStillValid, withVerification } from './verification';

const verified: Transaction = {
  id: 'op-1',
  accountId: 'acc-1',
  categoryId: 'cat-1',
  date: '2026-08-01T10:00:00+02:00',
  amount: 100,
  comment: 'Lidl',
  verification: { status: 'ok', statement: '2026-08' },
};

describe('isVerificationStillValid', () => {
  it('is valid when date, amount and account are the same', () => {
    expect(isVerificationStillValid(verified, { ...verified, comment: 'Groceries', categoryId: 'cat-2' })).toBe(true);
  });

  it('is valid when the date is the same instant in another representation', () => {
    expect(isVerificationStillValid(verified, { ...verified, date: '2026-08-01T08:00:00Z' })).toBe(true);
  });

  it('is stale when amount changes', () => {
    expect(isVerificationStillValid(verified, { ...verified, amount: 101 })).toBe(false);
  });

  it('is stale when date changes', () => {
    expect(isVerificationStillValid(verified, { ...verified, date: '2026-08-02T10:00:00+02:00' })).toBe(false);
  });

  it('is stale when account changes', () => {
    expect(isVerificationStillValid(verified, { ...verified, accountId: 'acc-2' })).toBe(false);
  });
});

describe('withVerification', () => {
  it('keeps verification of the previous version when still valid', () => {
    const { verification: _, ...next } = verified;
    expect(withVerification(verified, { ...next, comment: 'Groceries' }).verification).toEqual(verified.verification);
  });

  it('drops verification when the previous version is stale', () => {
    const { verification: _, ...next } = verified;
    expect(withVerification(verified, { ...next, amount: 5 }).verification).toBeUndefined();
  });

  it('returns next as is when there is no previous version', () => {
    const { verification: _, ...next } = verified;
    expect(withVerification(null, next)).toEqual(next);
  });
});
