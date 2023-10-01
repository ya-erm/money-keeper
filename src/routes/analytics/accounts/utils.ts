import type { GroupSummary } from './interfaces';

export function countPreviousItems(groups: GroupSummary[], index: number) {
  return groups
    .slice(0, index)
    .map((g) => g.accountSummaries.length)
    .reduce((sum, x) => sum + x, 0);
}
