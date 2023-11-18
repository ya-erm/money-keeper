import { join } from './join';

export type FormatMoneyOptions = {
  currency?: string;
  /** true, if need add sign '+' before positive value */
  withSign?: boolean;
  /** minimal number of digits in fractional part */
  minPrecision?: number;
  /** maximal number of digits in fractional part */
  maxPrecision?: number;
};

/**
 * Display money value (with thousand separator)
 * @param value money value
 * @param options format options
 */
export function formatMoney(value: number, options?: FormatMoneyOptions) {
  if (value == null || value == undefined || isNaN(value)) {
    return '';
  }

  const currency = options?.currency;
  const withSign = options?.withSign ?? false;
  const minPrecision = options?.minPrecision ?? 0;
  const maxPrecision = options?.maxPrecision ?? 2;

  if (Number(value.toFixed(maxPrecision)) === 0) {
    value = 0;
  }

  const sign = withSign && value > 0 ? '+' : '';

  const parts = value.toFixed(maxPrecision).split('.');
  let fractionalPart = parts.length > 1 ? parts[1] : undefined;
  if (fractionalPart?.match(`0{${maxPrecision}}`)) {
    fractionalPart = new Array(minPrecision).fill('0').join();
  }

  const numValue = join([`${sign}${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}`, fractionalPart], '.');

  return join([numValue, currency], '\u00A0');
}
