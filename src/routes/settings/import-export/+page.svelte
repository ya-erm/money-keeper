<script lang="ts">
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import { showErrorToast, showInfoToast, showSuccessToast } from '@ya-erm/svelte-ui/toasts';

  import {
    accountTagsService,
    accountsService,
    categoriesService,
    currencyRatesService,
    groupingsService,
    journalService,
    mainService,
    membersService,
    operationTagsService,
    operationsService,
    operationsStore,
  } from '$lib/data';
  import type { Account, Category, CurrencyRate, Grouping, Tag, Transaction } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { Logger, deepEqual, groupByKey, keyTransactions } from '$lib/utils';

  const logger = new Logger('Import/Export');

  let rawImport = '';

  let v2: {
    categories: Category[];
    accountTags: Tag[];
    accounts: Account[];
    operationTags: Tag[];
    operations: Transaction[];
    currencyRates: CurrencyRate[];
    groupings: Grouping[];
  } = {
    categories: [],
    accountTags: [],
    accounts: [],
    operationTags: [],
    operations: [],
    currencyRates: [],
    groupings: [],
  };

  let parsed = false;

  function parseInput() {
    v2 = JSON.parse(rawImport);
    parsed = true;
  }

  let current = {
    categories: categoriesService.items,
    accountTags: accountTagsService.items,
    accounts: accountsService.items,
    operationTags: operationTagsService.items,
    operations: operationsService.items,
    currencyRates: currencyRatesService.items,
    groupings: groupingsService.items,
  };

  $: currentJson = JSON.stringify(current, null, 2);
  $: currentJsonFile = new Blob([currentJson], { type: 'text/json' });

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
        void journalService.addOperationToQueue({ category }, { upload: false });
        count += 1;
      });

      v2.accountTags?.filter(notExists(accountTagsService.items)).forEach((accountTag) => {
        void journalService.addOperationToQueue({ accountTag }, { upload: false });
        count += 1;
      });

      v2.accounts?.filter(notExists(accountsService.items)).forEach((account) => {
        void journalService.addOperationToQueue({ account }, { upload: false });
        count += 1;
      });

      v2.operationTags?.filter(notExists(operationTagsService.items)).forEach((tag) => {
        void journalService.addOperationToQueue({ tag }, { upload: false });
        count += 1;
      });

      v2.currencyRates?.filter(notExists(currencyRatesService.items)).forEach((currencyRate) => {
        void journalService.addOperationToQueue({ currencyRate }, { upload: false });
        count += 1;
      });

      v2.operations?.filter(notExists(operationsService.items)).forEach((transaction) => {
        void journalService.addOperationToQueue({ transaction }, { upload: false });
        count += 1;
      });

      v2.groupings?.filter(notExists(groupingsService.items)).forEach((grouping) => {
        void journalService.addOperationToQueue({ grouping }, { upload: false });
        count += 1;
      });

      await journalService.applyChangesToSubscribers(journalService.queue, true);

      if (!membersService.isGuest) {
        await journalService.uploadQueue();
      }

      if (count === 0) {
        showInfoToast($translate('import_export.nothing_to_import'));
      } else {
        showSuccessToast($translate('import_export.import_success', { values: { count } }), {
          testId: 'ImportSuccessToast',
        });
      }
    } catch (e) {
      showErrorToast(`${$translate('import_export.import_failure')}\n${e}`);
    } finally {
      uploading = false;
    }
  }

  const logOperationsKeys = () => {
    const operationsByAccount = groupByKey($operationsStore, 'accountId');
    logger.log('Logging operations keys for each account');
    Object.entries(operationsByAccount).forEach(([accountId, operations]) => {
      logger.debug({
        account: operations[0]?.account ?? accountId,
        operationsKeys: [...keyTransactions(operations).keyedItemsMap.keys()],
      });
    });
    showSuccessToast($translate('import_export.operations_keys_logged'));
  };
</script>

<Layout title={$translate('import_export.title')} leftSlot={HeaderBackButton}>
  <div class="container p-1">
    <h2>{$translate('import_export.import')}</h2>
    <label class="flex-col gap-0.5">
      <span>{$translate('import_export.raw_data_json')}:</span>
      <textarea class="text-area-json" data-testId="ImportTextArea" bind:value={rawImport}></textarea>
    </label>

    <Button data-testId="ParseJsonButton" class="mt-1 w-full" onClick={parseInput} color="white" bordered>
      {$translate('import_export.parse_data')}
    </Button>

    {#if parsed}
      <p>
        <span>{$translate('import_export.categories')}: <b>{v2.categories?.length ?? 0}</b>,</span>
        <span>{$translate('import_export.account_tags')}: <b>{v2.accountTags?.length ?? 0}</b>,</span>
        <span>{$translate('import_export.accounts')}: <b>{v2.accounts?.length ?? 0}</b>,</span>
        <span>{$translate('import_export.operation_tags')}: <b>{v2.operationTags?.length ?? 0}</b>,</span>
        <span>{$translate('import_export.operations')}: <b>{v2.operations?.length ?? 0}</b>,</span>
        <span>{$translate('import_export.currency_rates')}: <b>{v2.currencyRates?.length ?? 0}</b></span>
        <span>{$translate('import_export.groupings')}: <b>{v2.groupings?.length ?? 0}</b></span>
      </p>

      <Button data-testId="AddToJournalButton" disabled={uploading} class="w-full" onClick={addToJournal}>
        {$translate(uploading ? 'import_export.uploading' : 'import_export.start_import')}
      </Button>
    {/if}

    <h2>{$translate('import_export.export')}</h2>
    <label class="flex-col gap-0.5">
      <span>{$translate('import_export.raw_data_json')}:</span>
      <textarea class="text-area-json" value={currentJson}></textarea>
    </label>
    <p>
      <span>{$translate('import_export.categories')}: <b>{current.categories?.length ?? 0}</b>,</span>
      <span>{$translate('import_export.account_tags')}: <b>{current.accountTags?.length ?? 0}</b>,</span>
      <span>{$translate('import_export.accounts')}: <b>{current.accounts?.length ?? 0}</b>,</span>
      <span>{$translate('import_export.operation_tags')}: <b>{current.operationTags?.length ?? 0}</b>,</span>
      <span>{$translate('import_export.operations')}: <b>{current.operations?.length ?? 0}</b>,</span>
      <span>{$translate('import_export.currency_rates')}: <b>{current.currencyRates?.length ?? 0}</b></span>
      <span>{$translate('import_export.groupings')}: <b>{current.groupings?.length ?? 0}</b></span>
    </p>
    <a href={URL.createObjectURL(currentJsonFile)} download={`export-${dayjs().format('YYYY-MM-DD')}.json`}>
      <Button class="w-full">{$translate('import_export.save')}</Button>
    </a>

    <h3>{$translate('import_export.other_features')}</h3>
    <Button onClick={logOperationsKeys} color="white" bordered>
      {$translate('import_export.log_operations_keys')}
    </Button>
  </div>
</Layout>

<style>
  .container {
    height: 100%;
  }
  textarea {
    border-radius: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
  }
  :global(body.dark-mode textarea) {
    color-scheme: dark;
  }
  .text-area-json {
    resize: vertical;
    min-height: 150px;
    width: 100%;
  }
</style>
