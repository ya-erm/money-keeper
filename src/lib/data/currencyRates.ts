import type { CurrencyRate } from './interfaces';
import type { JournalService } from './journal';
import type { MembersService } from './members';
import { BaseService } from './service';

export class CurrencyRatesService extends BaseService<CurrencyRate> {
  constructor(journalService: JournalService, membersService: MembersService) {
    super('CurrencyRatesService', 'currencyRates', 'currencyRate', journalService, membersService);
  }
}
