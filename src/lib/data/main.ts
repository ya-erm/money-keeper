import { Logger } from '$lib/utils/logger';

import { CategoriesService } from './categories';
import { GlobalSettingsService } from './settings';
import { JournalService } from './journal';
import { MembersService } from './members';
import type { Initialisable, Service } from './interfaces';
import { v4 as uuid } from 'uuid';

const logger = new Logger('MainService', { disabled: false, color: '#00cc55' });

class MainService implements Initialisable {
  private _id: string;
  private _called = false;

  settingsService: GlobalSettingsService;
  membersService: MembersService;
  journalService: JournalService;
  categoriesService: CategoriesService;

  constructor() {
    this._id = uuid();

    this.settingsService = new GlobalSettingsService();
    this.membersService = new MembersService(this.settingsService);
    this.journalService = new JournalService(this.membersService);
    this.categoriesService = new CategoriesService(this.journalService, this.membersService);
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
    const services: Service[] = [this.categoriesService];

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
