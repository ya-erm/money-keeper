<script lang="ts">
  import dayjs from 'dayjs';

  import { page } from '$app/stores';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { Account, TransactionViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import SubScreen from '$lib/ui/layout/SubScreen.svelte';
  import HeaderFormSubmitButton from '$lib/ui/layout/HeaderFormSubmitButton.svelte';
  import { findCurrencyRate, formatMoney, getSearchParam, setSearchParam } from '$lib/utils';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';
  import EditTransaction from '../transactions/edit/EditTransaction.svelte';
  import OperationOptionsModal from './OperationOptionsModal.svelte';

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  export let account: Account | null = null;
  export let operations: TransactionViewModel[];
  /** Show technical descriptions of operations, e.g. while searching */
  export let showDescription: boolean = false;
  /** Details are shown next to the list by the parent, do not open them as a nested screen */
  export let inlineDetails: boolean = false;

  $: currencyRate = findCurrencyRate(currencyRates, settings?.currency, account?.currency ?? '');

  $: groups = operations.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  /** Sum of expenses per currency (transfers and excluded from analysis operations are skipped) */
  function formatDayExpenses(transactions: TransactionViewModel[]) {
    const byCurrency: Record<string, number> = {};
    for (const t of transactions) {
      if (t.category.type !== 'OUT' || t.category.system || t.linkedTransaction || t.excludeFromAnalysis) continue;
      const currency = t.account.currency;
      byCurrency[currency] = (byCurrency[currency] ?? 0) + t.amount;
    }
    return Object.entries(byCurrency).map(([currency, amount]) => `-${formatMoney(amount, { currency })}`);
  }

  $: operationId = getSearchParam($page, 'operation-id');
  const openOperationForm = (id: string) => setSearchParam($page, 'operation-id', id, { replace: inlineDetails });
  const closeOperationForm = () => history.back();

  let optionsModalOpened = false;
  let optionsModalOperation: TransactionViewModel | null = null;
</script>

<ul class="operations-list flex-col gap-1">
  {#each Object.entries(groups) as [date, transactions] (date)}
    {@const dayExpenses = formatDayExpenses(transactions)}
    <div class="day-header flex items-center justify-between gap-0.5">
      <span>{dayjs(date).format('DD MMMM YYYY, dddd')}</span>
      {#if dayExpenses.length}
        <div class="day-expenses flex-col items-end" data-testId="DayExpenses">
          {#each dayExpenses as dayExpense (dayExpense)}
            <span>{dayExpense}</span>
          {/each}
        </div>
      {/if}
    </div>
    {#each transactions as transaction (transaction.id)}
      <TransactionListItem
        hideAccount={!!account}
        {showDescription}
        currencyRate={currencyRate ?? findCurrencyRate(currencyRates, settings?.currency, transaction.account.currency)}
        onClick={() => openOperationForm(transaction.id)}
        selected={inlineDetails && transaction.id === operationId}
        onLongPress={() => {
          optionsModalOpened = true;
          optionsModalOperation = transaction;
        }}
        {transaction}
      />
    {/each}
  {/each}
</ul>

<SubScreen
  visible={!inlineDetails && operationId !== null}
  title={$translate('transactions.edit_transaction')}
  onBack={closeOperationForm}
  rightSlot={HeaderFormSubmitButton}
>
  <EditTransaction id={operationId} onBack={closeOperationForm} />
</SubScreen>

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
  .day-expenses {
    flex-shrink: 0;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    opacity: 0.6;
    white-space: nowrap;
  }
</style>
