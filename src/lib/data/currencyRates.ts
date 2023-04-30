import type { CurrencyRate } from './interfaces';
import { BaseService } from './service';

export class CurrencyRatesService extends BaseService<CurrencyRate> {
  constructor() {
    super('CurrencyRatesService', 'currencyRates', 'currencyRate');
  }

  get currencyRates() {
    return this.items;
  }

  get $currencyRates() {
    return this.$items;
  }
}

export const currencyRatesService = new CurrencyRatesService();
