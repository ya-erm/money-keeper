/**
 * Returns the `values` object if `condition` is true, otherwise returns an empty object.
 *
 * @template T The type of the `values` object.
 * @param {boolean} condition - The condition to check.
 * @param {T} values The object to return if `condition` is true.
 * @returns The `values` object if `condition` is true, otherwise an empty object.
 *
 * @example
 * const someObj = {
 *    someProps: 'someProps',
 *    // will add value and description to the object if value is not null
 *    ...spreadIf(value !== null, {
 *        value,
 *        description: 'something',
 *    }),
 * }
 */
export function spreadIf<T extends Record<string, unknown>>(condition: boolean, values: T) {
  return condition ? values : {};
}
