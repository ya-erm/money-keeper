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
 * Group an array of objects by a selector function
 * @param array
 * @param selector
 * @returns
 */
export function groupBySelector<T, K extends string | number | symbol>(
  array: T[],
  selector: (item: T) => K,
): Record<K, T[]> {
  return array.reduce((res, item) => {
    const group = selector(item);
    (res[group] = res[group] || []).push(item);
    return res;
  }, {} as Record<K, T[]>);
}
