/** Add to each item unique key `{date}_{amount}_#{num}` like `2022-12-10_123.45_#1` */
export function keyTransactions<T extends { date: Date | string; amount: number }>(items: T[]) {
  const keyedItemsMap = new Map<string, T>();
  const sameDateAmountTransactions = new Map<string, T[]>();
  const keyedItems = items.map((item) => {
    const key = `${new Date(item.date).toISOString().substring(0, 10)}_${item.amount}`;
    const items = sameDateAmountTransactions.get(key) ?? [];
    items.push(item);
    const uniqueKey = `${key}_#${items.length}`;
    keyedItemsMap.set(uniqueKey, item);
    sameDateAmountTransactions.set(key, items);
    return { ...item, uniqueKey };
  });
  return { keyedItemsMap, keyedItems };
}
