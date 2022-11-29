/** Join not empty values of array */
export function join(array: Array<unknown>, separator = ' ') {
  return array.filter((item) => item !== undefined && item !== null && item !== '').join(separator);
}
