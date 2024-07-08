import type { TransactionViewModel } from '$lib/data/interfaces';

export function calculateBalance(transactions: TransactionViewModel[]) {
  return transactions?.reduce((res, t) => res + (t.category.type === 'IN' ? 1 : -1) * t.amount, 0) ?? 0;
}
