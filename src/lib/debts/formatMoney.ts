import { formatMoney as formatBaseMoney, type FormatMoneyOptions } from '../utils/formatMoney';
import { currencyPrecision } from './calculations';

export function formatDebtMoney(amount: number, options: FormatMoneyOptions = {}): string {
  return formatBaseMoney(amount, { maxPrecision: currencyPrecision(options.currency ?? 'EUR'), ...options });
}
