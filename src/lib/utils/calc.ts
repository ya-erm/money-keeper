import { calculate } from '$lib/calc/calculator';

import { Logger } from './logger';

const logger = new Logger('Calc');

/**
 * Replaces calculation expressions in the given text with their evaluated results.
 *
 * @param text The text containing calculation expressions in the format "${expression}".
 * @returns The text with replaced calculation expressions.
 */
export function replaceCalcExpressions(text: string) {
  return text.replaceAll(/\$\{[^}]+\}/g, (substring) => {
    const expression = substring.slice(2, -1);
    try {
      const result = calculate(expression.replaceAll(',', '.'), null);
      return result?.toFixed(2) ?? substring;
    } catch (e) {
      logger.warn('Failed to calculate expression', { text, expression }, e);
      return substring;
    }
  });
}
