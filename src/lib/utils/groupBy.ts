/**
 * Group an array of objects by a key
 * @param array
 * @param key
 * @returns
 */
export function groupBy<T extends Record<K, PropertyKey>, K extends keyof T>(array: T[], key: K): Record<T[K], T[]> {
  return array.reduce((res, item) => {
    const group = item[key];
    (res[group] = res[group] || []).push(item);
    return res;
  }, {} as Record<T[K], T[]>);
}

/**
 * Group an array of objects by a key
 * @param array
 * @param key
 * @returns Map
 */
export function groupByMap<T, K extends keyof T>(array: T[], key: K): Map<T[K], T[]> {
  return array.reduce((res, item) => {
    const group = item[key];
    res.get(group)?.push(item) ?? res.set(group, [item]);
    return res;
  }, new Map<T[K], T[]>());
}
/**
 * Group an array of objects by a selector function
 * @param array
 * @param selector
 * @returns
 */
export function groupBySelector<T, K extends string | number | symbol>(
  array: T[],
  selector: (item: T) => K,
): Record<K, T[] | undefined> {
  return array.reduce((res, item) => {
    const group = selector(item);
    (res[group] = res[group] || []).push(item);
    return res;
  }, {} as Record<K, T[]>);
}
