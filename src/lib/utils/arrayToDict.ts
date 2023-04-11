export function arrayToDict<T, S>(array: T[], map: (item: T) => S, key: (item: S) => string | undefined) {
  const items = new Map<string, S>();
  array.forEach((item) => {
    const mapped = map(item);
    const id = key(mapped);
    if (id !== undefined) {
      items.set(id, mapped);
    }
  });
  return items;
}
