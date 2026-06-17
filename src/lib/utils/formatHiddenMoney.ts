import { join } from './join';

export function formatHiddenMoney(currency?: string | null) {
  return join(['***', currency ?? undefined], '\u00A0');
}
