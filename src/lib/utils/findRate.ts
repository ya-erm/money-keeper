import { currencyRatesService } from '$lib/data';
import type { CurrencyRate } from '$lib/data/interfaces';
import { findCurrencyRate } from '$lib/utils';
import { Logger } from '$lib/utils/logger';

const logger = new Logger('findRate');

let globalRates: Record<string, number> | null = null;
let globalRatesUsed = false;

async function loadGlobalRates() {
  globalRatesUsed = true;
  globalRates = await currencyRatesService.getGlobalCurrencyRates();
}

export function findRate(currencyRates: CurrencyRate[], mainCurrency: string = 'USD', currency: string) {
  if (currency === mainCurrency) {
    return 1;
  }
  const rate = findCurrencyRate(currencyRates, mainCurrency, currency);
  if (rate) {
    return rate.cur1 === currency ? rate.rate : 1 / rate.rate;
  }
  if (!globalRatesUsed) {
    logger.debug(`No rate for ${currency} found, try to use global rates`);
    void loadGlobalRates();
    return 0;
  }
  if (!globalRates) {
    // console.debug('No global rates yet', { currency });
    return 0;
  }
  if (!globalRates?.[currency] || !globalRates?.[mainCurrency]) {
    console.warn(`No rate for ${currency} to ${mainCurrency}`);
    // TODO: show warning four user, add transaction to the special list
    return 0;
  }
  const usdToCur = globalRates[currency];
  const usdToMain = globalRates[mainCurrency];
  const curToMain = usdToMain / usdToCur;
  // console.log(`Rate for ${currency} to ${mainCurrency} is ${curToMain}`);
  return curToMain;
}
