type TransactionWithComment = {
  comment?: string | null;
};

export type TransactionCommentGroup<T> = {
  comment: string | null;
  transactions: T[];
  sum: number;
};

export function groupTransactionsByComment<T extends TransactionWithComment>(
  transactions: T[],
  getAmount: (transaction: T) => number,
): TransactionCommentGroup<T>[] {
  const groups = new Map<string, T[]>();

  transactions.forEach((transaction) => {
    const comment = transaction.comment?.trim() ?? '';
    const group = groups.get(comment);

    if (group) {
      group.push(transaction);
    } else {
      groups.set(comment, [transaction]);
    }
  });

  return Array.from(groups, ([comment, groupedTransactions]) => ({
    comment: comment || null,
    transactions: groupedTransactions,
    sum: groupedTransactions.reduce((sum, transaction) => sum + getAmount(transaction), 0),
  })).sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum));
}
