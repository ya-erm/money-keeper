/**
 * Converts an array to a dictionary using the provided mapping functions.
 *
 * @template T The type of the items in the array.
 * @template S The type of the items in the resulting dictionary.
 * @param {T[]} array The array to convert to a dictionary.
 * @param {(item: T) => S} map The mapping function to transform each item in the array.
 * @param {(item: S) => string | undefined} key The function to extract the key from each mapped item.
 * @returns {Map<string, S>} The resulting dictionary.
 */
export function arrayToDict<T, S>(
  array: T[],
  map: (item: T) => S,
  key: (item: S) => string | undefined,
): Map<string, S> {
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
