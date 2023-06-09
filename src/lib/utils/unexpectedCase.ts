export function unexpectedCase(value: never) {
  return new Error(`Unexpected case: ${value}`);
}
