<script lang="ts">
  import dayjs from 'dayjs';

  import { page } from '$app/stores';

  import Portal from '@ya-erm/svelte-ui/Portal';
  import ShowMoreContainer from '@ya-erm/svelte-ui/ShowMoreContainer';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import HeaderFormSubmitButton from '$lib/ui/layout/HeaderFormSubmitButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import { findCurrencyRate, getSearchParam, setSearchParam } from '$lib/utils';

  import TransactionListItem from './TransactionListItem.svelte';
  import EditTransaction from './edit/EditTransaction.svelte';

  export let transactions: TransactionViewModel[];
  export let hideAccount: boolean = false;

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  let limit = 20;

  $: sortedTransactions = transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  $: transactionsByDate = sortedTransactions
    .slice(0, limit)
    .reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
      const date = dayjs(t.date).format('YYYY-MM-DD');
      if (!res[date]) res[date] = [];
      res[date].push(t);
      return res;
    }, {});

  $: operationId = getSearchParam($page, 'operation-id');
  const openOperationForm = (id: string) => setSearchParam($page, 'operation-id', id, { replace: false });
  const closeOperationForm = () => history.back();
</script>

<ShowMoreContainer bind:limit step={20} total={sortedTransactions.length} translate={$translate}>
  <ul class="flex-col gap-1">
    {#each Object.entries(transactionsByDate) as [date, transactions] (date)}
      <div>{dayjs(date).format('DD MMMM YYYY')}</div>
      {#each transactions as transaction (transaction.id)}
        <TransactionListItem
          {transaction}
          {hideAccount}
          currencyRate={findCurrencyRate(currencyRates, settings?.currency, transaction.account.currency)}
          onClick={({ id }) => openOperationForm(id)}
        />
      {/each}
    {/each}
  </ul>
</ShowMoreContainer>

<Portal visible={operationId !== null}>
  <Layout
    title={$translate('transactions.edit_transaction')}
    leftSlot={HeaderBackButton}
    rightSlot={HeaderFormSubmitButton}
    hideMenu
  >
    <EditTransaction id={operationId} onBack={closeOperationForm} />
  </Layout>
</Portal>

<style>
  ul {
    list-style: none;
    padding: 0 1rem;
  }
</style>
