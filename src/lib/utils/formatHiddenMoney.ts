import { join } from './join';

export function formatHiddenMoney(currency?: string | null) {
  return join(['7A3K9', currency ?? undefined], '\u00A0');
}
