import { describe, expect, it } from 'vitest';

import { groupTransactionsByComment } from './groupTransactionsByComment';

describe('groupTransactionsByComment', () => {
  it('combines transactions with the same trimmed comment and totals their amounts', () => {
    const groups = groupTransactionsByComment(
      [
        { id: '1', comment: 'Lunch', amount: -12 },
        { id: '2', comment: ' Lunch ', amount: -8 },
        { id: '3', comment: 'Dinner', amount: -15 },
      ],
      (transaction) => transaction.amount,
    );

    expect(groups).toEqual([
      {
        comment: 'Lunch',
        transactions: [
          { id: '1', comment: 'Lunch', amount: -12 },
          { id: '2', comment: ' Lunch ', amount: -8 },
        ],
        sum: -20,
      },
      {
        comment: 'Dinner',
        transactions: [{ id: '3', comment: 'Dinner', amount: -15 }],
        sum: -15,
      },
    ]);
  });

  it('puts missing and blank comments into one group', () => {
    const groups = groupTransactionsByComment(
      [
        { id: '1', comment: null, amount: 10 },
        { id: '2', comment: '  ', amount: 20 },
        { id: '3', amount: 30 },
      ],
      (transaction) => transaction.amount,
    );

    expect(groups).toEqual([
      {
        comment: null,
        transactions: [
          { id: '1', comment: null, amount: 10 },
          { id: '2', comment: '  ', amount: 20 },
          { id: '3', amount: 30 },
        ],
        sum: 60,
      },
    ]);
  });
});
