import { calculate } from '$lib/calc/calculator';

import { Logger } from './logger';

const logger = new Logger('Calc');

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
