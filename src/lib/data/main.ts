import { v4 as uuid } from 'uuid';

import { Logger } from '$lib/utils/logger';

import type { Initialisable, Service } from './interfaces';

import { accountTagsService } from './accountTags';
import { accountsService } from './accounts';
import { categoriesService } from './categories';
import { currencyRatesService } from './currencyRates';
import { groupingsService } from './groupings';
import { $initialized } from './initialized';
import { journalService } from './journal';
import { membersService } from './members';
import { operationTagsService } from './operationTags';
import { operationsService } from './operations';
import { settingsService } from './settings';

const logger = new Logger('MainService', { disabled: false, color: '#00cc55' });

class MainService implements Initialisable {
  private _id: string;
  private _called = false;

  constructor() {
    this._id = uuid();
  }

  async init() {
    // eslint-disable-next-line no-console
    console.debug('%cMain service ID:', 'color: red', this._id, { called: this._called });

    if (this._called) return;

    this._called = true;

    await this.initServices();
  }

  async initServices() {
    $initialized.set(false);

    await settingsService.init();
    await membersService.init();

    const services: Service[] = [
      categoriesService,
      accountTagsService,
      accountsService,
      operationTagsService,
      operationsService,
      currencyRatesService,
      groupingsService,
    ];

    logger.log(`Initialise ${services.length} services to load data from local DB`);
    logger.debug('Services:', [...services.map((service) => service.name)]);
    await Promise.all(services.map((service) => service.init()));

    services.concat(membersService).forEach((service) => journalService.addSubscriber(service));

    logger.log('Initialise journal service');
    await journalService.init();

    $initialized.set(true);
  }

  reset() {}
}

export const mainService = new MainService();
