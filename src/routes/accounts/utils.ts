import type { CurrencyRate, TransactionViewModel } from '$lib/data/interfaces';

export function calculateBalance(transactions: TransactionViewModel[]) {
  return transactions?.reduce((res, t) => res + (t.category.type === 'IN' ? 1 : -1) * t.amount, 0) ?? 0;
}

export function findCurrencyRate(
  currencyRates: CurrencyRate[],
  mainCurrency?: string | null,
  currency?: string | null,
) {
  if (!mainCurrency || !currency || mainCurrency === currency) {
    return null;
  }
  return (
    currencyRates.find(({ cur1, cur2 }) => [cur1, cur2].includes(mainCurrency) && [cur1, cur2].includes(currency)) ??
    null
  );
}
