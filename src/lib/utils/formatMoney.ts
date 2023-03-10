/**
 * Display money value (with thousand separator)
 * @param value money value
 * @param currency currency
 * @param withSign true, if need add sign '-' before negative value
 * @param precision number of digits in fractional part
 */
export function formatMoney(value: number, currency: string | undefined = undefined, withSign = false, precision = 2) {
  if (value == null || value == undefined || isNaN(value)) {
    return '';
  }
  const sign = withSign && value > 0 ? '+' : '';
  const parts = value.toFixed(precision).split('.');
  const fractionalPart = parts.length > 1 ? '.' + parts[1] : '';

  return [`${sign}${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fractionalPart}`, currency]
    .filter((x) => x !== undefined)
    .join(' ');
}
