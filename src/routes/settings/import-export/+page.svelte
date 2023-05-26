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
  import type { Account, Category, CurrencyRate, Tag, Transaction } from '$lib/data/interfaces';
  import { showSuccessToast } from '$lib/ui/toasts';
  import { deepEqual } from '$lib/utils';

  let rawImport = '';

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

  let parsed = false;

  function parseInput() {
    v2 = JSON.parse(rawImport);
    parsed = true;
  }

  let current: {
    categories: Category[];
    accounts: Account[];
    tags: Tag[];
    transactions: Transaction[];
    currencyRates: CurrencyRate[];
  } = {
    categories: categoriesService.categories,
    accounts: accountsService.accounts,
    tags: tagsService.tags,
    transactions: transactionsService.transactions,
    currencyRates: currencyRatesService.currencyRates,
  };

  let uploading = false;

  async function addToJournal() {
    function notExists<T>(items: T[]) {
      return (item: T) => !items.some((x) => deepEqual(x, item));
    }

    try {
      uploading = true;

      await mainService.init();

      let count = 0;

      v2.categories.filter(notExists(categoriesService.categories)).forEach((category) => {
        journalService.addOperationToQueue({ category }, { upload: false });
        count += 1;
      });

      v2.accounts.filter(notExists(accountsService.accounts)).forEach((account) => {
        journalService.addOperationToQueue({ account }, { upload: false });
        count += 1;
      });

      v2.tags.filter(notExists(tagsService.tags)).forEach((tag) => {
        journalService.addOperationToQueue({ tag }, { upload: false });
        count += 1;
      });

      v2.currencyRates.filter(notExists(currencyRatesService.currencyRates)).forEach((currencyRate) => {
        journalService.addOperationToQueue({ currencyRate }, { upload: false });
        count += 1;
      });

      v2.transactions.filter(notExists(transactionsService.transactions)).forEach((transaction) => {
        journalService.addOperationToQueue({ transaction }, { upload: false });
        count += 1;
      });

      await journalService.tryUploadQueue();

      showSuccessToast(`${count} items were added`);
    } finally {
      uploading = false;
    }
  }
</script>

<div class="container p-1">
  <h2>Import</h2>
  <label class="flex-col gap-0.5">
    <span>RAW Data (json):</span>
    <textarea class="text-area-json" data-testId="ImportTextArea" bind:value={rawImport} />
  </label>

  <button data-testId="ParseJsonButton" class="mt-1" style:width="100%" on:click={parseInput}>Parse json</button>

  {#if parsed}
    <p>
      <span>Tags: <b>{v2.tags?.length ?? 0}</b>,</span>
      <span>Categories: <b>{v2.categories?.length ?? 0}</b>,</span>
      <span>Accounts: <b>{v2.accounts?.length ?? 0}</b>,</span>
      <span>Transactions: <b>{v2.transactions?.length ?? 0}</b>,</span>
      <span>CurrencyRates: <b>{v2.currencyRates?.length ?? 0}</b></span>
    </p>

    <button data-testId="AddToJournalButton" disabled={uploading} style:width="100%" on:click={addToJournal}>
      {uploading ? 'Uploading...' : 'Add to journal'}
    </button>
  {/if}

  <h2>Export</h2>
  <label class="flex-col gap-0.5">
    <span>RAW Data (json):</span>
    <textarea class="text-area-json" value={JSON.stringify(current, null, 2)} />
  </label>
  <p>
    <span>Tags: <b>{current.tags.length}</b>,</span>
    <span>Categories: <b>{current.categories.length}</b>,</span>
    <span>Accounts: <b>{current.accounts.length}</b>,</span>
    <span>Transactions: <b>{current.transactions.length}</b>,</span>
    <span>CurrencyRates: <b>{current.currencyRates.length}</b></span>
  </p>
</div>

<style>
  .container {
    height: 100%;
  }
  .text-area-json {
    resize: vertical;
    min-height: 150px;
    width: 100%;
  }
</style>
