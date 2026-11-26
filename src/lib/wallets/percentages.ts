import type { WalletAllocation } from '#lib/data/interfaces.js';

/** Whole percentages in recorded share order; rounding keeps the total at 100. */
export function allocationPercentages(allocation?: WalletAllocation): number[] {
  const amounts =
    allocation?.shares.map((share) => share.amount).filter((amount) => Number.isFinite(amount) && amount > 0) ?? [];
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (amounts.length < 2 || !Number.isFinite(total)) return [];
  const raw = amounts.map((amount) => (amount / total) * 100);
  const percentages = raw.map(Math.floor);
  const remainder = 100 - percentages.reduce((sum, percent) => sum + percent, 0);
  const rank = raw
    .map((value, index) => ({ index, fraction: value - percentages[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index++) percentages[rank[index].index]++;
  return percentages;
}
