<script lang="ts">
  import dayjs from 'dayjs';

  import {
    categoriesStore,
    currencyRatesService,
    currencyRatesStore,
    memberSettingsStore,
    operationsStore,
  } from '$lib/data';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';
  import { groupBy } from '$lib/utils/groupBy';
  import { findCurrencyRate } from '../accounts/utils';

  const categories = $categoriesStore;
  const currencyRates = $currencyRatesStore;
  const transactions = $operationsStore;
  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  let startDate = dayjs().startOf('month');
  let endDate = dayjs().endOf('month');

  function prevMonth() {
    startDate = startDate.subtract(1, 'month').startOf('month');
    endDate = endDate.subtract(1, 'month').endOf('month');
  }

  function nextMonth() {
    startDate = startDate.add(1, 'month').startOf('month');
    endDate = endDate.add(1, 'month').endOf('month');
  }

  let globalRates: Record<string, number> | null = null;
  let globalRatesUsed = false;

  async function loadGlobalRates() {
    globalRatesUsed = true;
    globalRates = await currencyRatesService.getGlobalCurrencyRates();
  }

  $: findRate = (currency: string) => {
    if (currency === mainCurrency) {
      return 1;
    }
    const rate = findCurrencyRate(currencyRates, mainCurrency, currency);
    if (rate) {
      return rate.cur1 === currency ? rate.rate : 1 / rate.rate;
    }
    if (!globalRatesUsed) {
      console.debug(`No rate for ${currency} found, try to use global rates`);
      loadGlobalRates();
      return 0;
    }
    if (!globalRates) {
      // console.debug('No global rates yet', { currency });
      return 0;
    }
    if (!globalRates?.[currency] || !globalRates?.[mainCurrency]) {
      console.warn(`No rate for ${currency} to ${mainCurrency}`);
      // TODO: show warning four user, add transaction to the special list
      return 0;
    }
    const usdToCur = globalRates[currency];
    const usdToMain = globalRates[mainCurrency];
    const curToMain = usdToMain / usdToCur;
    // console.log(`Rate for ${currency} to ${mainCurrency} is ${curToMain}`);
    return curToMain;
  };

  $: filteredTransactions = transactions.filter(
    (t) => dayjs(t.date).isAfter(startDate) && dayjs(t.date).isBefore(endDate) && !t.category.system,
  );

  $: transactionsByCategories = groupBy(filteredTransactions, 'categoryId');
  $: groups = Object.entries(transactionsByCategories)
    .map(([categoryId, transactions]) => {
      const category = categories.find((c) => c.id === categoryId) ?? transactions?.[0]?.category;
      return {
        category,
        categoryId,
        transactions: transactions ?? [],
        sum:
          transactions?.reduce(
            (sum, t) => sum + (t.category.type == 'IN' ? 1 : -1) * t.amount * findRate(t.account.currency),
            0,
          ) ?? 0,
      };
    })
    .sort((a, b) => a.sum - b.sum);
</script>

<div class="p-1">
  <div class="flex gap-1 items-center justify-between">
    <Button color="white" bordered on:click={prevMonth}>
      <Icon name="mdi:chevron-left" />
    </Button>
    <h2 class="month">{startDate.format('MMMM YYYY')}</h2>
    <Button color="white" bordered on:click={nextMonth}>
      <Icon name="mdi:chevron-right" />
    </Button>
  </div>
  <ul class="list">
    {#each groups as group (group.categoryId)}
      <li class="item" data-id={group.categoryId}>
        <div class="category">
          <Icon name={group.category?.icon ?? 'mdi:help'} />
          <span>{group.category?.name ?? group.categoryId}</span>
        </div>
        <span>
          {formatMoney(group.sum, { currency: mainCurrency })}
        </span>
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

<style>
  .month {
    margin: 0;
  }
  .list {
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
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
