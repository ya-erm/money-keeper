/* eslint-disable @typescript-eslint/no-explicit-any */
export function deepEqual(x: any, y: any): boolean {
  return x && y && typeof x === 'object' && typeof y === 'object'
    ? Object.keys(x).length === Object.keys(y).length && Object.keys(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}
