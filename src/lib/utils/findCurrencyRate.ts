import type { CurrencyRate } from '$lib/data/interfaces';

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
