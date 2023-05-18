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

  /** External rates of USD to other currencies */
  private globalCurrencyRates: Record<string, number> | null = null;

  async getGlobalCurrencyRates(): Promise<Record<string, number>> {
    if (this.globalCurrencyRates) {
      return this.globalCurrencyRates;
    }

    // https://api.exchangerate-api.com/v4/latest/USD
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    this.globalCurrencyRates = data.rates;

    return data.rates;
  }
}

export const currencyRatesService = new CurrencyRatesService();
