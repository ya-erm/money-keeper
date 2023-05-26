<script lang="ts">
  import {
    accountsService,
    categoriesService,
    currencyRatesService,
    journalService,
    mainService,
    tagsService,
    transactionsService,
  } from '$lib/data';
  import type { Account, Category, CategoryType, CurrencyRate, Tag, Transaction } from '$lib/data/interfaces';
  import { deepEqual } from '$lib/utils';

  import type { PageData } from './$types';

  export let data: PageData;

  let v2: {
    categories: Category[];
    accounts: Account[];
    tags: Tag[];
    transactions: Transaction[];
    currencyRates: CurrencyRate[];
  } = {
    categories: [],
    accounts: [],
    tags: [],
    transactions: [],
    currencyRates: [],
  };

  function mapCategoryType(value: string): CategoryType {
    switch (value) {
      case 'IN':
        return 'IN';
      case 'OUT':
        return 'OUT';
      default:
        throw new Error(`Unsupported category type: ${value}`);
    }
  }

  function migrate() {
    const accounts = data.accounts;
    const categories = data.categories;
    const transactions = data.transactions;
    const currencyRates = data.currencyRates;
    const tags = data.tags;

    const uuids = new Set<string>();
    [accounts, categories, transactions, currencyRates, tags].forEach((arr) =>
      arr.forEach((item) => {
        if (uuids.has(item.uuid)) {
          console.log('Duplicate uuid, item: ', item);
          throw new Error(`Duplicate uuid: ${item.uuid}`);
        }
        uuids.add(item.uuid);
      }),
    );

    v2 = {
      categories: categories.map(({ uuid, icon, name, type }) => ({
        id: uuid,
        name,
        icon,
        type: mapCategoryType(type),
      })),

      accounts: accounts.map(({ uuid, icon, name, currency, order }) => ({
        id: uuid,
        icon,
        name,
        currency,
        order,
      })),

      tags: tags.map(({ uuid, name }) => ({
        id: uuid,
        name,
      })),

      transactions: transactions.map(
        ({ uuid, accountId, categoryId, amount, comment, date, tags: _tags, linkedTransactionId }) => ({
          id: uuid,
          accountId: accounts.find((x) => x.id === accountId)!.uuid,
          categoryId: categories.find((x) => x.id === categoryId)!.uuid,
          amount,
          comment,
          date,
          tagIds: _tags.map((t) => tags.find((x) => x.id === t.id)!.uuid),
          ...(linkedTransactionId
            ? {
                linkedTransactionId: transactions.find((t) => t.id === linkedTransactionId)!.uuid,
              }
            : {}),
          // description,
        }),
      ),

      currencyRates: currencyRates.map(({ uuid, cur1, cur2, rate }) => ({
        id: uuid,
        cur1,
        cur2,
        rate,
      })),
    };
  }

  let uploading = false;

  async function addToJournal() {
    function notExists<T>(items: T[]) {
      return (item: T) =>
        !deepEqual(
          items.find((x) => x === item),
          item,
        );
    }

    try {
      uploading = true;

      await mainService.init();

      v2.categories.filter(notExists(categoriesService.categories)).forEach((category) => {
        journalService.addOperationToQueue({ category }, { upload: false });
      });

      v2.accounts.filter(notExists(accountsService.accounts)).forEach((account) => {
        journalService.addOperationToQueue({ account }, { upload: false });
      });

      v2.tags.filter(notExists(tagsService.tags)).forEach((tag) => {
        journalService.addOperationToQueue({ tag }, { upload: false });
      });

      v2.currencyRates.filter(notExists(currencyRatesService.currencyRates)).forEach((currencyRate) => {
        journalService.addOperationToQueue({ currencyRate }, { upload: false });
      });

      v2.transactions.filter(notExists(transactionsService.transactions)).forEach((transaction) => {
        journalService.addOperationToQueue({ transaction }, { upload: false });
      });

      await journalService.tryUploadQueue();
    } finally {
      uploading = false;
    }
  }
</script>

<div class="container p-1">
  <label>
    <span>RAW Data:</span>
    <textarea class="text-area-json" value={JSON.stringify(data)} />
  </label>
  <p>
    <span>Tags: <b>{data.tags.length}</b>,</span>
    <span>Categories: <b>{data.categories.length}</b>,</span>
    <span>Accounts: <b>{data.accounts.length}</b>,</span>
    <span>Transactions: <b>{data.transactions.length}</b>,</span>
    <span>CurrencyRates: <b>{data.currencyRates.length}</b></span>
  </p>

  <button style:width="100%" on:click={migrate}>Migrate</button>

  <label>
    <span>V2 Data:</span>
    <textarea class="text-area-json" value={JSON.stringify(v2)} />
  </label>
  <p>
    <span>Tags: <b>{v2.tags.length}</b>,</span>
    <span>Categories: <b>{v2.categories.length}</b>,</span>
    <span>Accounts: <b>{v2.accounts.length}</b>,</span>
    <span>Transactions: <b>{v2.transactions.length}</b>,</span>
    <span>CurrencyRates: <b>{v2.currencyRates.length}</b></span>
  </p>

  <button disabled={uploading} style:width="100%" on:click={addToJournal}>
    {uploading ? 'Uploading...' : 'Add to journal'}
  </button>

  <a class="mt-1 flex-center" href="/v2/accounts">Open v2 accounts</a>
</div>

<style>
  .container {
    height: 100%;
  }
  .text-area-json {
    width: 100%;
    height: 25%;
  }
</style>
