<script lang="ts">
  import dayjs from 'dayjs';

  import { page } from '$app/stores';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/Layout.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import { getSearchParam, setSearchParam } from '$lib/utils';

  import { findCurrencyRate } from '../accounts/utils';
  import TransactionListItem from './TransactionListItem.svelte';
  import EditTransaction from './edit/EditTransaction.svelte';

  export let transactions: TransactionViewModel[];
  export let hideAccount: boolean = false;

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: sortedTransactions = transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  $: transactionsByDate = sortedTransactions.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  $: operationId = getSearchParam($page, 'operation-id');
  const openOperationForm = (id: string) => setSearchParam($page, 'operation-id', id, { replace: false });
  const closeOperationForm = () => history.back();
</script>

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

<Portal visible={operationId !== null}>
  <Layout
    header={{
      backButton: {
        onClick: closeOperationForm,
      },
      leftButton: null,
      rightButton: null,
      title: $translate('transactions.edit_transaction'),
    }}
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
