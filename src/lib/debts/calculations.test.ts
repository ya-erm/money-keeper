import { describe, expect, it } from 'vitest';
import type { DebtContact, TransactionViewModel } from '../data/interfaces';
import {
  automaticPersonalAmount,
  contactBalances,
  debtEntries,
  debtTotal,
  personalAmount,
  recentContacts,
  validateDebt,
} from './calculations';
import { formatDebtMoney } from './formatMoney';

const contacts: DebtContact[] = [
  { id: 'anna', name: 'Anna' },
  { id: 'max', name: 'Max' },
];
const payment = (changes: Partial<TransactionViewModel> = {}): TransactionViewModel => ({
  id: 'dinner',
  accountId: 'card',
  categoryId: 'food',
  date: '2026-11-01T12:00:00Z',
  amount: 90,
  account: { id: 'card', name: 'Card', currency: 'EUR' },
  category: { id: 'food', name: 'Food', type: 'OUT' },
  tags: [],
  debt: {
    kind: 'expense',
    shares: [
      { contactId: 'anna', amount: 35 },
      { contactId: 'max', amount: 20 },
    ],
  },
  ...changes,
});

describe('debt accounting', () => {
  it('records a EUR debt paid in RSD and calculates personal expenses using the recorded exchange amounts', () => {
    const operation = payment({
      amount: 238,
      account: { id: 'card', name: 'Serbian card', currency: 'RSD' },
      anotherCurrency: 'EUR',
      anotherCurrencyAmount: 2,
      debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 1, currency: 'EUR' }] },
    });
    expect(validateDebt(operation, 'RSD', 'OUT', contacts)).toBeNull();
    if (!operation.debt) throw new Error('Expected debt');
    expect(personalAmount(operation)).toBe(119);
    expect(contactBalances(debtEntries([operation], []), 'anna')).toEqual({ EUR: 1 });
    const edited = { ...operation, anotherCurrencyAmount: 4 };
    expect(personalAmount(edited)).toBe(178.5);
    expect(personalAmount({ ...operation, debt: { ...operation.debt, personalAmount: 120 } })).toBe(120);
    const repayment = payment({
      id: 'repayment',
      amount: 119,
      account: operation.account,
      category: { id: 'income', name: 'Income', type: 'IN' },
      anotherCurrency: 'EUR',
      anotherCurrencyAmount: 1,
      debt: { kind: 'repayment', shares: [{ contactId: 'anna', amount: 1, currency: 'EUR' }] },
    });
    expect(validateDebt(repayment, 'RSD', 'IN', contacts)).toBeNull();
    expect(personalAmount(repayment)).toBe(0);
    expect(contactBalances(debtEntries([operation, repayment], []), 'anna')).toEqual({ EUR: 0 });
    expect(contactBalances(debtEntries([operation, { ...repayment, deleted: true }], []), 'anna')).toEqual({ EUR: 1 });
  });
  it('requires a manual personal amount when the payment does not define the needed exchange rate', () => {
    const operation = payment({
      amount: 2,
      debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 119, currency: 'RSD' }] },
    });
    expect(automaticPersonalAmount(operation, 'EUR')).toBeNull();
    if (!operation.debt) throw new Error('Expected debt');
    expect(validateDebt(operation, 'EUR', 'OUT', contacts)).toBe('personal_required');
    for (const personal of [0, 1, 2]) {
      const manual = { ...operation, debt: { ...operation.debt, personalAmount: personal } };
      expect(validateDebt(manual, 'EUR', 'OUT', contacts)).toBeNull();
      expect(personalAmount(manual)).toBe(personal);
    }
    for (const personal of [-1, 3, 0.001, NaN, Infinity]) {
      expect(
        validateDebt({ ...operation, debt: { ...operation.debt, personalAmount: personal } }, 'EUR', 'OUT', contacts),
      ).toBe('invalid_personal');
    }
  });
  it('supports mixed participant currencies, validates their own precision and rejects known over-allocation', () => {
    const operation = payment({
      amount: 2,
      anotherCurrency: 'RSD',
      anotherCurrencyAmount: 238,
      debt: {
        kind: 'payment',
        shares: [
          { contactId: 'anna', amount: 119, currency: 'RSD' },
          { contactId: 'max', amount: 0.25 },
        ],
      },
    });
    expect(validateDebt(operation, 'EUR', 'OUT', contacts)).toBeNull();
    expect(personalAmount(operation)).toBe(0.75);
    expect(contactBalances(debtEntries([operation], []), 'anna')).toEqual({ RSD: 119 });
    expect(contactBalances(debtEntries([operation], []), 'max')).toEqual({ EUR: 0.25 });
    expect(validateDebt({ ...operation, anotherCurrencyAmount: 100 }, 'EUR', 'OUT', contacts)).toBe('too_much');
    expect(
      validateDebt(
        {
          ...operation,
          debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 0.1, currency: 'JPY' }], personalAmount: 1 },
        },
        'EUR',
        'OUT',
        contacts,
      ),
    ).toBe('invalid');
    expect(
      validateDebt(
        {
          ...operation,
          debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 1, currency: 'eur' }], personalAmount: 1 },
        },
        'EUR',
        'OUT',
        contacts,
      ),
    ).toBe('invalid');
  });
  it('keeps the original category and icon available to debt history', () => {
    const category = { id: 'custom-food', name: 'Food', type: 'OUT' as const, icon: 'mdi:food-fork-drink' };
    expect(debtEntries([payment({ category })], [])[0].category).toEqual(category);
  });
  it('records repayments without an account operation and preserves their history type', () => {
    const entries = debtEntries(
      [payment()],
      [{ id: 'manual-return', kind: 'repayment', contactId: 'anna', amount: -20, currency: 'EUR', date: '2026-11-02' }],
    );
    expect(contactBalances(entries, 'anna')).toEqual({ EUR: 15 });
    expect(entries.find((entry) => entry.id === 'manual-return')?.kind).toBe('repayment');
    expect(entries.find((entry) => entry.id === 'manual-return')?.operationId).toBeUndefined();
  });
  it('uses payment direction to net existing debts and create the opposite balance without selecting a type', () => {
    const incoming = payment({
      id: 'incoming',
      amount: 50,
      category: { id: 'income', name: 'Income', type: 'IN' },
      debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 50 }] },
    });
    expect(validateDebt(incoming, 'EUR', 'IN', contacts)).toBeNull();
    expect(personalAmount(incoming)).toBe(0);
    expect(contactBalances(debtEntries([payment(), incoming], []), 'anna')).toEqual({ EUR: -15 });
    const outgoing = payment({
      id: 'outgoing',
      amount: 60,
      debt: { kind: 'payment', shares: [{ contactId: 'anna', amount: 20 }] },
    });
    expect(validateDebt(outgoing, 'EUR', 'OUT', contacts)).toBeNull();
    expect(personalAmount(outgoing)).toBe(40);
    expect(contactBalances(debtEntries([incoming, outgoing], []), 'anna')).toEqual({ EUR: -30 });
  });
  it('keeps three-decimal and integer currencies readable without hiding small debts', () => {
    expect(formatDebtMoney(0.001, { currency: 'JOD' })).toBe('0.001\u00a0JOD');
    expect(formatDebtMoney(10, { currency: 'JPY' })).toBe('10\u00a0JPY');
  });
  it('keeps the full cash payment but only my share in personal analytics', () => {
    const operation = payment();
    expect(personalAmount(operation)).toBe(35);
    expect(operation.amount).toBe(90);
    expect(contactBalances(debtEntries([operation], []), 'anna')).toEqual({ EUR: 35 });
  });
  it('nets repayments and opposite debts per person and currency, without floating point residue', () => {
    const entries = debtEntries(
      [
        payment(),
        payment({
          id: 'return',
          amount: 20,
          category: { id: 'in', name: 'Income', type: 'IN' },
          debt: { kind: 'repayment', shares: [{ contactId: 'anna', amount: 20 }] },
        }),
      ],
      [
        { id: 'a', contactId: 'anna', amount: -0.1, currency: 'EUR', date: '2026-11-01' },
        { id: 'b', contactId: 'anna', amount: -0.2, currency: 'EUR', date: '2026-11-01' },
        { id: 'c', contactId: 'anna', amount: 2400, currency: 'RSD', date: '2026-11-01' },
      ],
    );
    expect(contactBalances(entries, 'anna')).toEqual({ EUR: 14.7, RSD: 2400 });
  });
  it('excludes only the repayment portion of a larger income', () => {
    expect(
      personalAmount(payment({ amount: 50, debt: { kind: 'repayment', shares: [{ contactId: 'anna', amount: 20 }] } })),
    ).toBe(30);
  });
  it('edits replace debt portions, deletion restores debt balances, and future payments do not count yet', () => {
    const original = payment();
    const edited = payment({ debt: { kind: 'expense', shares: [{ contactId: 'anna', amount: 40 }] } });
    expect(contactBalances(debtEntries([edited], []), 'anna').EUR).toBe(40);
    expect(debtEntries([payment({ deleted: true })], [])).toEqual([]);
    expect(debtEntries([original], [], new Date('2026-10-01'))).toEqual([]);
  });
  it('validates total, unique contacts, precision and transfer restrictions', () => {
    expect(validateDebt(payment(), 'EUR', 'OUT', contacts)).toBeNull();
    expect(validateDebt(payment({ amount: 20 }), 'EUR', 'OUT', contacts)).toBe('too_much');
    expect(validateDebt(payment({ linkedTransactionId: 'other' }), 'EUR', 'OUT', contacts)).toBe('invalid');
    expect(validateDebt(payment(), 'EUR', 'IN', contacts)).toBe('invalid');
    expect(
      validateDebt(
        payment({ debt: { kind: 'expense', shares: [{ contactId: 'anna', amount: 1.005 }] } }),
        'EUR',
        'OUT',
        contacts,
      ),
    ).toBe('invalid');
    expect(
      validateDebt(
        payment({
          debt: {
            kind: 'expense',
            shares: [
              { contactId: 'anna', amount: 10 },
              { contactId: 'anna', amount: 10 },
            ],
          },
        }),
        'EUR',
        'OUT',
        contacts,
      ),
    ).toBe('duplicate');
    expect(validateDebt(payment(), 'EUR', 'OUT', [])).toBe('contact_required');
    expect(
      debtTotal(
        [
          { contactId: 'a', amount: 0.1 },
          { contactId: 'b', amount: 0.2 },
        ],
        'EUR',
      ),
    ).toBe(0.3);
    expect(
      validateDebt(
        payment({ debt: { kind: 'expense', shares: [{ contactId: 'anna', amount: 0.1 }] } }),
        'JPY',
        'OUT',
        contacts,
      ),
    ).toBe('invalid');
  });
  it('suggests a bounded recent list, searches the full list and excludes archives', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));
    const entries = debtEntries([], [{ id: 'last', contactId: '49', amount: 10, currency: 'EUR', date: '2026-11-01' }]);
    expect(recentContacts(many, entries)).toHaveLength(5);
    expect(recentContacts(many, entries)[0].id).toBe('49');
    expect(recentContacts(many, entries, 'Contact 48')[0].id).toBe('48');
    expect(recentContacts([{ ...many[49], archived: true }], entries)).toEqual([]);
  });
});
