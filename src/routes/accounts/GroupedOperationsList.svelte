<script lang="ts">
  import { goto } from '$app/navigation';
  import dayjs from 'dayjs';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { Account, TransactionViewModel } from '$lib/data/interfaces';
  import { route } from '$lib/routes';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';

  import { findCurrencyRate } from './utils';

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

  const handleTransactionClick = async (id: string) => {
    await goto(route('transactions') + `/edit?id=${id}`);
  };
</script>

<ul class="operations-list flex-col gap-1">
  {#each Object.entries(groups) as [date, transactions] (date)}
    <div>{dayjs(date).format('DD MMMM YYYY, dddd')}</div>
    {#each transactions as transaction (transaction.id)}
      <TransactionListItem
        hideAccount={!!account}
        currencyRate={currencyRate ?? findCurrencyRate(currencyRates, settings?.currency, transaction.account.currency)}
        onClick={() => handleTransactionClick(transaction.id)}
        {transaction}
      />
    {/each}
  {/each}
</ul>

<style>
  .operations-list {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-top: 1rem;
  }
</style>
