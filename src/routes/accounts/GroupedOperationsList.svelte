<script lang="ts">
  import dayjs from 'dayjs';

  import { page } from '$app/stores';

  import Portal from '@ya-erm/svelte-ui/Portal';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { Account, TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/Layout.svelte';
  import HeaderFormSubmitButton from '$lib/ui/header/HeaderFormSubmitButton.svelte';
  import { findCurrencyRate, getSearchParam, setSearchParam } from '$lib/utils';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';
  import EditTransaction from '../transactions/edit/EditTransaction.svelte';
  import OperationOptionsModal from './OperationOptionsModal.svelte';

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  export let account: Account | null = null;
  export let operations: TransactionViewModel[];

  $: currencyRate = findCurrencyRate(currencyRates, settings?.currency, account?.currency ?? '');

  $: groups = operations.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  $: operationId = getSearchParam($page, 'operation-id');
  const openOperationForm = (id: string) => setSearchParam($page, 'operation-id', id, { replace: false });
  const closeOperationForm = () => history.back();

  let optionsModalOpened = false;
  let optionsModalOperation: TransactionViewModel | null = null;
</script>

<ul class="operations-list flex-col gap-1">
  {#each Object.entries(groups) as [date, transactions] (date)}
    <div>{dayjs(date).format('DD MMMM YYYY, dddd')}</div>
    {#each transactions as transaction (transaction.id)}
      <TransactionListItem
        hideAccount={!!account}
        currencyRate={currencyRate ?? findCurrencyRate(currencyRates, settings?.currency, transaction.account.currency)}
        onClick={() => openOperationForm(transaction.id)}
        onLongPress={() => {
          optionsModalOpened = true;
          optionsModalOperation = transaction;
        }}
        {transaction}
      />
    {/each}
  {/each}
</ul>

<Portal visible={operationId !== null}>
  <Layout
    header={{
      backButton: {
        onClick: closeOperationForm,
      },
      leftButton: null,
      rightButton: HeaderFormSubmitButton,
      title: $translate('transactions.edit_transaction'),
    }}
    hideMenu
  >
    <EditTransaction id={operationId} onBack={closeOperationForm} />
  </Layout>
</Portal>

{#if optionsModalOperation}
  <OperationOptionsModal bind:opened={optionsModalOpened} operation={optionsModalOperation} />
{/if}

<style>
  .operations-list {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-top: 1rem;
  }
</style>
