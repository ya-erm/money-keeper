export function serialize(data: unknown) {
  return JSON.parse(JSON.stringify(data));
}
