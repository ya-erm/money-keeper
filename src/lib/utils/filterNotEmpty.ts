/**
 * Filters out `null` and `undefined` values from an array.
 *
 * @param array The array to filter.
 * @returns A new array with non-empty values.
 */
export function filterNotEmpty<T>(array?: T[]): NonNullable<T>[] {
  return (array?.filter((item) => item !== null && item !== undefined) as NonNullable<T>[]) ?? [];
}
