export function minBySelector<T>(array: T[], selector: (item: T) => number): T {
  return array.reduce((min, item) => {
    const value = selector(item);
    if (value < selector(min)) {
      return item;
    }
    return min;
  });
}

export function maxBySelector<T>(array: T[], selector: (item: T) => number): T {
  return array.reduce((max, item) => {
    const value = selector(item);
    if (value > selector(max)) {
      return item;
    }
    return max;
  });
}
