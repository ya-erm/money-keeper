import { describe, expect, it } from 'vitest';
import type { Account, Category, Transaction, VirtualWallet, WalletTransfer } from '../data/interfaces';
import {
  convertAllocation,
  orderedItems,
  splitEqually,
  validateAllocation,
  validateWalletTransfer,
  walletBalance,
  walletContributions,
  walletEntries,
} from './calculations';
import { personalAmount } from '../debts/calculations';
import { reduceJournal } from '../data/snapshot';

const wallets: VirtualWallet[] = [
  { id: 'alex', name: 'Alex', participantId: 'a' },
  { id: 'maria', name: 'Maria', participantId: 'm' },
  { id: 'holiday', name: 'Holiday' },
];
const accounts: Account[] = [
  { id: 'rsd', name: 'RSD card', currency: 'RSD' },
  { id: 'eur', name: 'EUR cash', currency: 'EUR' },
];
const categories: Category[] = [
  { id: 'income', name: 'Salary', type: 'IN' },
  { id: 'expense', name: 'Rent', type: 'OUT' },
  { id: 'out', name: 'Transfer out', type: 'OUT' },
  { id: 'in', name: 'Transfer in', type: 'IN' },
];
const date = '2026-11-01T09:00:00Z';
const now = new Date('2026-11-22');
const shares = (amount: number) => ({
  shares: [
    { walletId: 'alex', amount },
    { walletId: 'maria', amount },
  ],
});

describe('multi-currency virtual wallets', () => {
  it('tracks salary, currency exchange and equal rent without duplicating bank payments or expenses', () => {
    const operations: Transaction[] = [
      { id: 'salary', accountId: 'rsd', categoryId: 'income', amount: 200000, date, walletAllocation: shares(100000) },
      {
        id: 'exchange-out',
        accountId: 'rsd',
        categoryId: 'out',
        amount: 120000,
        date,
        linkedTransactionId: 'exchange-in',
        walletAllocation: shares(60000),
      },
      {
        id: 'exchange-in',
        accountId: 'eur',
        categoryId: 'in',
        amount: 1000,
        date,
        linkedTransactionId: 'exchange-out',
        walletAllocation: shares(500),
      },
    ];
    let entries = walletEntries(wallets[0], operations, categories, accounts, [], now);
    expect(walletBalance(entries, 'RSD')).toBe(40000);
    expect(walletBalance(entries, 'EUR')).toBe(500);
    operations.push({
      id: 'rent',
      accountId: 'eur',
      categoryId: 'expense',
      amount: 1000,
      date,
      walletAllocation: shares(500),
    });
    entries = walletEntries(wallets[0], operations, categories, accounts, [], now);
    expect(walletBalance(entries, 'EUR')).toBe(0);
    expect(operations).toHaveLength(4);
    expect(personalAmount({ ...operations[3], account: accounts[1] })).toBe(1000);
    expect(convertAllocation(shares(60000), 120000, 1000, 'EUR')).toEqual(shares(500));
  });

  it('conserves minor units during equal splits and exchange, including three-decimal currencies', () => {
    expect(splitEqually(10, 3, 'EUR')).toEqual([3.34, 3.33, 3.33]);
    expect(splitEqually(1, 3, 'KWD')).toEqual([0.334, 0.333, 0.333]);
    const allocation = {
      shares: [
        { walletId: 'alex', amount: 2 },
        { walletId: 'maria', amount: 1 },
      ],
    };
    expect(convertAllocation(allocation, 3, 10, 'EUR')?.shares.map((share) => share.amount)).toEqual([6.67, 3.33]);
    expect(convertAllocation(allocation, 4, 10, 'EUR')).toBeUndefined();
  });

  it('keeps gross contributions after spending and calculates edits, returns, deletions and overdrafts', () => {
    const transfers: WalletTransfer[] = [
      { id: 'seed', toWalletId: 'alex', currency: 'EUR', amount: 100, date },
      {
        id: 'deposit',
        fromWalletId: 'alex',
        toWalletId: 'holiday',
        currency: 'EUR',
        amount: 60,
        date,
        contributorParticipantId: 'a',
      },
      {
        id: 'return',
        fromWalletId: 'holiday',
        toWalletId: 'alex',
        currency: 'EUR',
        amount: 10,
        date,
        contributorParticipantId: 'a',
      },
      { id: 'deleted', toWalletId: 'holiday', currency: 'EUR', amount: 900, date, deleted: true },
      { id: 'future', toWalletId: 'holiday', currency: 'EUR', amount: 900, date: '2027-01-01' },
    ];
    const purchase: Transaction = {
      id: 'ticket',
      accountId: 'eur',
      categoryId: 'expense',
      date,
      amount: 70,
      walletAllocation: { shares: [{ walletId: 'holiday', amount: 70 }] },
    };
    expect(walletBalance(walletEntries(wallets[2], [purchase], categories, accounts, transfers, now), 'EUR')).toBe(-20);
    expect(walletContributions(wallets[2], transfers, 'EUR', now)).toEqual([
      { participantId: 'a', contributed: 60, returned: 10 },
    ]);
    expect(
      walletBalance(
        walletEntries(wallets[2], [{ ...purchase, deleted: true }], categories, accounts, transfers, now),
        'EUR',
      ),
    ).toBe(50);
    expect(
      walletBalance(
        walletEntries(
          wallets[2],
          [{ ...purchase, walletAllocation: shares(35) }],
          categories,
          accounts,
          transfers,
          now,
        ),
        'EUR',
      ),
    ).toBe(50);
  });

  it('rejects invalid allocations and transfers without tying wallets to bank accounts', () => {
    expect(validateAllocation(shares(50), 100, 'EUR', wallets)).toBe(true);
    expect(validateAllocation(shares(51), 100, 'EUR', wallets)).toBe(false);
    expect(
      validateAllocation(
        {
          shares: [
            { walletId: 'alex', amount: 50 },
            { walletId: 'alex', amount: 50 },
          ],
        },
        100,
        'EUR',
        wallets,
      ),
    ).toBe(false);
    expect(validateAllocation({ shares: [{ walletId: 'missing', amount: 100 }] }, 100, 'EUR', wallets)).toBe(false);
    expect(
      validateWalletTransfer(
        { id: 't', fromWalletId: 'alex', toWalletId: 'holiday', currency: 'EUR', amount: 10, date },
        wallets,
      ),
    ).toBe(true);
    expect(
      validateWalletTransfer(
        { id: 't', fromWalletId: 'alex', toWalletId: 'alex', currency: 'EUR', amount: 10, date },
        wallets,
      ),
    ).toBe(false);
    expect(validateWalletTransfer({ id: 't', currency: 'EUR', amount: 10, date }, wallets)).toBe(false);
    expect(validateWalletTransfer({ id: 't', toWalletId: 'alex', currency: 'EUR', amount: 0.001, date }, wallets)).toBe(
      false,
    );
  });

  it('preserves names, preferences, wallet shares and transfers through compaction and legacy snapshots', () => {
    const participant = {
      id: 'a',
      name: 'Alex',
      walletsOrder: ['alex', 'holiday'],
      accountsOrder: ['eur', 'rsd'],
      hiddenAccountIds: ['rsd'],
      allocationPreset: 'equal' as const,
    };
    const transfer = {
      id: 't',
      fromWalletId: 'alex',
      toWalletId: 'holiday',
      currency: 'EUR',
      amount: 10,
      date,
      contributorParticipantId: 'a',
    };
    const snapshot = reduceJournal([
      { order: 1, data: { participant } },
      { order: 2, data: { virtualWallet: wallets[0] } },
      { order: 3, data: { walletTransfer: transfer } },
      { order: 4, data: { walletsEnabled: true } },
    ]);
    expect(reduceJournal([{ order: 4, data: { snapshot: JSON.parse(JSON.stringify(snapshot)) } }])).toEqual(snapshot);
    expect(
      reduceJournal([
        { order: 4, data: { snapshot } },
        { order: 5, data: { walletsEnabled: false } },
      ]).walletsEnabled,
    ).toBe(false);
    const legacy = { ...snapshot };
    delete legacy.participants;
    delete legacy.virtualWallets;
    delete legacy.walletTransfers;
    delete legacy.walletsEnabled;
    expect(reduceJournal([{ order: 1, data: { snapshot: legacy } }]).virtualWallets).toEqual([]);
    expect(orderedItems(wallets, ['holiday', 'maria']).map((wallet) => wallet.id)).toEqual([
      'holiday',
      'maria',
      'alex',
    ]);
  });
});
