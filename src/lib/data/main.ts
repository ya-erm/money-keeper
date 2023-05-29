import dayjs from 'dayjs';
import { derived, type Readable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import { Logger } from '$lib/utils/logger';

import type { Initialisable, Service, Transaction, TransactionViewModel } from './interfaces';

import { store } from '$lib/store';
import { showErrorToast } from '$lib/ui/toasts';
import { accountsService } from './accounts';
import { categoriesService, SYSTEM_CATEGORY_TRANSFER_IN, SYSTEM_CATEGORY_TRANSFER_OUT } from './categories';
import { currencyRatesService } from './currencyRates';
import { journalService } from './journal';
import { membersService } from './members';
import { settingsService } from './settings';
import { tagsService } from './tags';
import { transactionsService } from './transactions';

const logger = new Logger('MainService', { disabled: false, color: '#00cc55' });

class MainService implements Initialisable {
  private _id: string;
  private _called = false;

  $initialized = store(false);
  $transactions: Readable<TransactionViewModel[]>;

  constructor() {
    this._id = uuid();
    this.$transactions = derived(
      [
        this.$initialized,
        accountsService.$accounts,
        categoriesService.$categories,
        transactionsService.$transactions,
        tagsService.$tags,
      ],
      ([initialized, accounts, _categories, transactions, tags]) => {
        if (!initialized) return [];

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

        transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

        const problems: Array<{ transaction: Transaction; e: unknown }> = [];

        const items = transactions
          .map((transaction) => {
            const linkedTransaction = transactions.find((t) => t.id === transaction.linkedTransactionId);

            try {
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
            } catch (e) {
              console.error('problems', e);
              problems.push({ transaction, e });
              return null as unknown as TransactionViewModel;
            }
          })
          .filter((x) => x !== null);

        if (problems.length) {
          console.error(problems);
          showErrorToast(`Data loaded with ${problems.length} problem(s)`);
        }

        return items;
      },
    );
  }

  async init() {
    // eslint-disable-next-line no-console
    console.debug('%cMain service ID:', 'color: red', this._id, { called: this._called });

    if (this._called) return;
    this._called = true;

    await settingsService.init();
    await membersService.init();

    if (!membersService.selectedMember) {
      logger.log('No selected member found. Skip initialisation of other services');
      return;
    }

    await this.initServices();
  }

  async initServices() {
    const services: Service[] = [
      categoriesService,
      accountsService,
      transactionsService,
      currencyRatesService,
      tagsService,
    ];

    this.$initialized.set(false);

    logger.log(`Initialise ${services.length} services to load data from local DB`);
    logger.debug(
      'Services:',
      services.map((service) => service.name),
    );
    await Promise.all(services.map((service) => service.init()));

    services.forEach((service) => journalService.addSubscriber(service));

    logger.log('Initialise journal service');
    await journalService.init();

    this.$initialized.set(true);
  }
}

export const mainService = new MainService();
