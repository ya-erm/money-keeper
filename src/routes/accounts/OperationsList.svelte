<script lang="ts">
  import { goto } from '$app/navigation';
  import dayjs from 'dayjs';

  import { currencyRatesService, mainService, membersService } from '$lib/data';
  import type { Account, TransactionViewModel } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Input from '$lib/ui/Input.svelte';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';

  import { findCurrencyRate } from './utils';

  export let account: Account | null = null;

  const transactionsStore = mainService.$transactions;
  const currencyRatesStore = currencyRatesService.$currencyRates;
  const settingsStore = membersService.$selectedMemberSettings;

  $: transactions = $transactionsStore;
  $: currencyRates = $currencyRatesStore;
  $: settings = $settingsStore;

  let search: string = '';

  $: accountTransactions = account ? transactions.filter((t) => t.accountId === account?.id) : null;
  $: filteredTransactions =
    (accountTransactions ?? transactions).filter(
      (t) =>
        !search ||
        t.comment?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        t.date.substring(0, 10).includes(search) ||
        `${t.amount} ${account?.currency}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  $: groups = filteredTransactions.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  $: currencyRate = findCurrencyRate(currencyRates, settings?.currency, account?.currency ?? '');

  const handleTransactionClick = (id: string) => {
    goto(route('transactions') + `/edit?id=${id}`);
  };
</script>

<div class="operations-container p-1">
  <div class="flex gap-1">
    <h3 style:font-weight="normal" class="m-0 flex-grow">{$translate('transactions.title')}</h3>
    <a href={`${route('transactions.create')}?accountId=${account?.id}`} data-testID="AddOperationButton">
      {$translate('common.add')}
    </a>
  </div>
  <div class="operations-search-container flex gap-0.5">
    <div class="flex-grow">
      <Input bind:value={search} placeholder={$translate('common.search')} clearable />
    </div>
    <!-- 
    <Button appearance="transparent" bordered>
      <Icon size={1.25} name="mdi:filter" />
    </Button> 
    -->
  </div>
  <ul class="operations-list mt-1 flex-col gap-1">
    {#each Object.entries(groups) as [date, transactions] (date)}
      <div>{dayjs(date).format('DD MMMM YYYY')}</div>
      {#each transactions as transaction (transaction.id)}
        <TransactionListItem
          hideAccount={!!account}
          currencyRate={currencyRate ??
            findCurrencyRate(currencyRates, settings?.currency, transaction.account.currency)}
          onClick={() => handleTransactionClick(transaction.id)}
          {transaction}
        />
      {/each}
    {/each}
  </ul>
</div>

<style>
  .operations-search-container {
    padding: 1rem 0;
    background: var(--background-color);
    position: relative;
  }

  .operations-search-container::before {
    content: '';
    position: absolute;
    pointer-events: none;
    background: linear-gradient(to top, rgba(255, 255, 255, 0) 50%, var(--background-color));
    left: 0;
    right: 0;
    height: 2rem;
    bottom: -2rem;
  }

  .operations-list {
    list-style: none;
    padding: 0;
  }
</style>
