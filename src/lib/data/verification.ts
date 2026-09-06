import dayjs from 'dayjs';

import type { Transaction } from './interfaces';

/**
 * Check whether the verification of the operation is still valid after the update.
 * Verification is bound to the date, amount and account, changing any of them makes it stale.
 */
export function isVerificationStillValid(prev: Transaction, next: Transaction) {
  return (
    prev.accountId === next.accountId &&
    prev.amount === next.amount &&
    dayjs(prev.date).valueOf() === dayjs(next.date).valueOf()
  );
}

/** Keep the verification of the previous version of operation if it is still valid */
export function withVerification(prev: Transaction | null | undefined, next: Transaction): Transaction {
  if (prev?.verification && isVerificationStillValid(prev, next)) {
    return { ...next, verification: prev.verification };
  }
  return next;
}
