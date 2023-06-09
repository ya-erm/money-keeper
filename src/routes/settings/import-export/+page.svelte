<script lang="ts">
  import {
    accountTagsService,
    accountsService,
    categoriesService,
    currencyRatesService,
    journalService,
    mainService,
    operationTagsService,
    operationsService,
  } from '$lib/data';
  import type { Account, Category, CurrencyRate, Tag, Transaction } from '$lib/data/interfaces';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';
  import { deepEqual } from '$lib/utils';

  let rawImport = '';

  let v2: {
    categories: Category[];
    accountTags: Tag[];
    accounts: Account[];
    operationTags: Tag[];
    operations: Transaction[];
    currencyRates: CurrencyRate[];
  } = {
    categories: [],
    accountTags: [],
    accounts: [],
    operationTags: [],
    operations: [],
    currencyRates: [],
  };

  let parsed = false;

  function parseInput() {
    v2 = JSON.parse(rawImport);
    parsed = true;
  }

  let current: {
    categories: Category[];
    accountTags: Tag[];
    accounts: Account[];
    operationTags: Tag[];
    operations: Transaction[];
    currencyRates: CurrencyRate[];
  } = {
    categories: categoriesService.items,
    accountTags: accountTagsService.items,
    accounts: accountsService.items,
    operationTags: operationTagsService.items,
    operations: operationsService.items,
    currencyRates: currencyRatesService.items,
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

      v2.categories?.filter(notExists(categoriesService.items)).forEach((category) => {
        journalService.addOperationToQueue({ category }, { upload: false });
        count += 1;
      });

      v2.accountTags?.filter(notExists(accountTagsService.items)).forEach((accountTag) => {
        journalService.addOperationToQueue({ accountTag }, { upload: false });
        count += 1;
      });

      v2.accounts?.filter(notExists(accountsService.items)).forEach((account) => {
        journalService.addOperationToQueue({ account }, { upload: false });
        count += 1;
      });

      v2.operationTags?.filter(notExists(operationTagsService.items)).forEach((tag) => {
        journalService.addOperationToQueue({ tag }, { upload: false });
        count += 1;
      });

      v2.currencyRates?.filter(notExists(currencyRatesService.items)).forEach((currencyRate) => {
        journalService.addOperationToQueue({ currencyRate }, { upload: false });
        count += 1;
      });

      v2.operations?.filter(notExists(operationsService.items)).forEach((transaction) => {
        journalService.addOperationToQueue({ transaction }, { upload: false });
        count += 1;
      });

      await journalService.tryUploadQueue();

      showSuccessToast(`${count} items were added`, { testId: 'ImportSuccessToast' });
    } catch (e) {
      showErrorToast(`Failed to import items ${e}`);
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
      <span>Categories: <b>{v2.categories?.length ?? 0}</b>,</span>
      <span>Account Tags: <b>{v2.accountTags?.length ?? 0}</b>,</span>
      <span>Accounts: <b>{v2.accounts?.length ?? 0}</b>,</span>
      <span>Operation Tags: <b>{v2.operationTags?.length ?? 0}</b>,</span>
      <span>Operations: <b>{v2.operations?.length ?? 0}</b>,</span>
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
    <span>Categories: <b>{current.categories?.length ?? 0}</b>,</span>
    <span>Account Tags: <b>{current.accountTags?.length ?? 0}</b>,</span>
    <span>Accounts: <b>{current.accounts?.length ?? 0}</b>,</span>
    <span>Operation Tags: <b>{current.operationTags?.length ?? 0}</b>,</span>
    <span>Operations: <b>{current.operations?.length ?? 0}</b>,</span>
    <span>CurrencyRates: <b>{current.currencyRates?.length ?? 0}</b></span>
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
