<script lang="ts">
  import dayjs from 'dayjs';

  import { categoriesStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney, groupByKey } from '$lib/utils';
  import TransactionList from '../../transactions/TransactionList.svelte';
  import { findRate } from '../utils/findRate';
  import MonthSelect from './MonthSelect.svelte';

  const categories = $categoriesStore;
  const currencyRates = $currencyRatesStore;
  const transactions = $operationsStore;
  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  let startDate = dayjs().startOf('month');
  let endDate = dayjs().endOf('month');

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  $: filteredTransactions = transactions.filter(
    (t) => dayjs(t.date).isAfter(startDate) && dayjs(t.date).isBefore(endDate) && !t.category.system,
  );

  $: transactionsByCategories = groupByKey(filteredTransactions, 'categoryId');
  $: groups = Object.entries(transactionsByCategories)
    .map(([categoryId, transactions]) => {
      const category = categories.find((c) => c.id === categoryId) ?? transactions?.[0]?.category;
      return {
        category,
        categoryId,
        transactions: transactions ?? [],
        sum:
          transactions?.reduce(
            (sum, t) => sum + (t.category.type == 'IN' ? 1 : -1) * t.amount * findRateFn(t.account.currency),
            0,
          ) ?? 0,
      };
    })
    .sort((a, b) => a.sum - b.sum);

  let selectedGroup: (typeof groups)[number] | null = null;
</script>

<div class="p-1">
  <MonthSelect bind:startDate bind:endDate onChange={() => (selectedGroup = null)} />

  <div class="summary-by-categories">
    <ul class="list">
      {#each groups as group (group.categoryId)}
        <li class="item" class:selected={selectedGroup === group} data-id={group.categoryId}>
          <button on:click={() => (selectedGroup = selectedGroup !== group ? group : null)}>
            <div class="category">
              <Icon name={group.category?.icon ?? 'mdi:help'} />
              <span>{group.category?.name ?? group.categoryId}</span>
            </div>
            <span>
              {formatMoney(group.sum, { currency: mainCurrency })}
            </span>
          </button>
        </li>
      {/each}
    </ul>
    <hr />
    <div class="total-container">
      <div class="total">
        <div>{$translate('categories.incomings')}:</div>
        <div>
          {formatMoney(
            groups.filter((g) => g.category?.type === 'IN').reduce((sum, g) => sum + g.sum, 0),
            { currency: mainCurrency },
          )}
        </div>
        <div>{$translate('categories.outgoings')}:</div>
        <div>
          {formatMoney(
            groups.filter((g) => g.category?.type === 'OUT').reduce((sum, g) => sum + g.sum, 0),
            { currency: mainCurrency },
          )}
        </div>
      </div>
    </div>
  </div>
</div>

{#if selectedGroup}
  <div class="transactions-preview">
    <TransactionList transactions={selectedGroup.transactions} />
  </div>
{/if}

<style>
  .list {
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .item button {
    padding: 0;
    border: none;
    font-size: 1rem;
    color: var(--primary-text-color);
    background: transparent;
    cursor: pointer;

    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .item.selected button {
    color: var(--active-color);
  }
  @media (hover: hover) {
    .item button:hover {
      color: var(--active-color);
    }
  }
  .category {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .total-container {
    display: flex;
    justify-content: flex-end;
    text-align: right;
  }
  .total {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: auto auto;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }
</style>
