import { Logger } from '$lib/utils/logger';
import { derived, type Readable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { Initialisable, Service, TransactionViewModel } from './interfaces';

import { AccountsService } from './accounts';
import { CategoriesService, SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from './categories';
import { CurrencyRatesService } from './currencyRates';
import { JournalService } from './journal';
import { MembersService } from './members';
import { GlobalSettingsService } from './settings';
import { TagsService } from './tags';
import { TransactionsService } from './transactions';

const logger = new Logger('MainService', { disabled: false, color: '#00cc55' });

class MainService implements Initialisable {
  private _id: string;
  private _called = false;

  settingsService: GlobalSettingsService;
  membersService: MembersService;
  journalService: JournalService;
  categoriesService: CategoriesService;
  accountsService: AccountsService;
  transactionsService: TransactionsService;
  currencyRatesService: CurrencyRatesService;
  tagsService: TagsService;

  $transactions: Readable<TransactionViewModel[]>;

  constructor() {
    this._id = uuid();

    this.settingsService = new GlobalSettingsService();
    this.membersService = new MembersService(this.settingsService);
    this.journalService = new JournalService(this.membersService);
    this.categoriesService = new CategoriesService(this.journalService, this.membersService);
    this.accountsService = new AccountsService(this.journalService, this.membersService);
    this.transactionsService = new TransactionsService(this.journalService, this.membersService);
    this.currencyRatesService = new CurrencyRatesService(this.journalService, this.membersService);
    this.tagsService = new TagsService(this.journalService, this.membersService);

    this.$transactions = derived(
      [
        this.accountsService.$accounts,
        this.categoriesService.$categories,
        this.transactionsService.$transactions,
        this.tagsService.$tags,
      ],
      ([accounts, _categories, transactions, tags]) => {
        const categories = _categories.concat(SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT);

        function findAccount(id: string) {
          const account = accounts.find((account) => account.id === id);
          if (!account) throw new Error(`Account ${id} not found`);
          return account;
        }

        function findCategory(id: string) {
          const category = categories.find((category) => category.id === id);
          if (!category) throw new Error(`Category ${id} not found`);
          return category;
        }

        function findTag(id: string) {
          const tag = tags.find((tag) => tag.id === id);
          if (!tag) throw new Error(`Tag ${id} not found`);
          return tag;
        }

        return transactions.map((transaction) => {
          const linkedTransaction = transactions.find((t) => t.id === transaction.linkedTransactionId);

          const viewModel: TransactionViewModel = {
            ...transaction,
            account: findAccount(transaction.accountId),
            category: findCategory(transaction.categoryId),
            linkedTransaction: linkedTransaction
              ? {
                  ...linkedTransaction,
                  account: findAccount(linkedTransaction.accountId),
                  category: findCategory(linkedTransaction.categoryId),
                }
              : undefined,
            tags: transaction.tagIds?.map(findTag) || [],
          };

          return viewModel;
        });
      },
    );
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
    const services: Service[] = [
      this.categoriesService,
      this.accountsService,
      this.transactionsService,
      this.currencyRatesService,
      this.tagsService,
    ];

    logger.log(`Initialise ${services.length} services to load data from local DB`);
    logger.debug(
      'Services:',
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
export const transactionsService = mainService.transactionsService;
export const currencyRatesService = mainService.currencyRatesService;
export const tagsService = mainService.tagsService;
