<script lang="ts">
  import dayjs from 'dayjs';
  import type { TransactionViewModel } from '$lib/data/interfaces';
  import TransactionListItem from './TransactionListItem.svelte';
  import { goto } from '$app/navigation';
  import { route } from '$lib/routes';

  export let transactions: TransactionViewModel[];
  export let hideAccount: boolean = false;

  $: sortedTransactions = transactions.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  $: transactionsByDate = sortedTransactions.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  const onClick = ({ id }: { id: string }) => {
    // TODO: use search params instead of url
    goto(route('transactions') + `/${id}`);
  };
</script>

<ul class="flex-col gap-1">
  {#each Object.entries(transactionsByDate) as [date, transactions] (date)}
    <div>{dayjs(date).format('DD MMMM YYYY')}</div>
    {#each transactions as transaction (transaction.id)}
      <TransactionListItem {transaction} {hideAccount} currencyRate={undefined} {onClick} />
    {/each}
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0 1rem;
  }
</style>
