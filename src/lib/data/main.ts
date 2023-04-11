import { Logger } from '$lib/utils/logger';
import { v4 as uuid } from 'uuid';

import { AccountsService } from './accounts';
import { CategoriesService } from './categories';
import type { Initialisable, Service } from './interfaces';
import { JournalService } from './journal';
import { MembersService } from './members';
import { GlobalSettingsService } from './settings';

const logger = new Logger('MainService', { disabled: false, color: '#00cc55' });

class MainService implements Initialisable {
  private _id: string;
  private _called = false;

  settingsService: GlobalSettingsService;
  membersService: MembersService;
  journalService: JournalService;
  categoriesService: CategoriesService;
  accountsService: AccountsService;

  constructor() {
    this._id = uuid();

    this.settingsService = new GlobalSettingsService();
    this.membersService = new MembersService(this.settingsService);
    this.journalService = new JournalService(this.membersService);
    this.categoriesService = new CategoriesService(this.journalService, this.membersService);
    this.accountsService = new AccountsService(this.journalService, this.membersService);
  }

  async init() {
    // eslint-disable-next-line no-console
    console.debug('%cMain service ID:', 'color: red', this._id, { called: this._called });

    if (this._called) return;
    this._called = true;

    await this.settingsService.init();
    await this.membersService.init();

    if (!this.membersService.selectedMember) {
      logger.log('No selected member found. Skip initialisation of other services');
      return;
    }

    await this.initServices();
  }

  async initServices() {
    const services: Service[] = [this.categoriesService, this.accountsService];

    logger.log(`Initialise ${services.length} services to load data from local DB`);
    logger.debug(
      'Services: ',
      services.map((service) => service.name),
    );
    await Promise.all(services.map((service) => service.init()));

    services.forEach((service) => this.journalService.addSubscriber(service));

    logger.log('Initialise journal service');
    await this.journalService.init();
  }
}

export const mainService = new MainService();

export default mainService;

export const settingsService = mainService.settingsService;
export const membersService = mainService.membersService;
export const journalService = mainService.journalService;
export const categoriesService = mainService.categoriesService;
export const accountsService = mainService.accountsService;
