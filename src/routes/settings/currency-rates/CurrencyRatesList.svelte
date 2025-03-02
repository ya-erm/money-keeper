<script lang="ts">
  import { page } from '$app/stores';

  import Input from '@ya-erm/svelte-ui/Input';

  import { currencyRatesStore, memberSettingsStore } from '$lib/data';
  import type { CurrencyRate } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import { deleteSearchParam, findRate, getSearchParam, groupByKeyToMap } from '$lib/utils';

  import CurrencyRateModal from './CurrencyRateModal.svelte';

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  let selectedItem: CurrencyRate | null = null;
  let opened = false;

  $: action = getSearchParam($page, 'action');
  $: if (action === 'create') {
    selectedItem = null;
    opened = true;
  }
  $: if (!!action && !opened) {
    void deleteSearchParam($page, 'action');
  }

  const changeCurrencyRate = (item: CurrencyRate) => {
    selectedItem = item;
    opened = true;
  };

  let search: string = '';
  $: filteredCurrencyRates = currencyRates.filter(
    (rate) =>
      !search ||
      rate.cur1.toLowerCase().includes(search.toLowerCase()) ||
      rate.cur2.toLowerCase().includes(search.toLowerCase()),
  );

  $: currencyRateByCurrency = groupByKeyToMap(filteredCurrencyRates, 'cur1');
  $: currencyKeys = Array.from(currencyRateByCurrency.keys());
  $: currencyKeys.forEach((currency) => {
    currencyRateByCurrency.get(currency)?.sort((a, b) => {
      const aRate = findRate(currencyRates, settings?.currency ?? undefined, a.cur2);
      const bRate = findRate(currencyRates, settings?.currency ?? undefined, b.cur2);
      return bRate - aRate;
    });
  });
  $: currenciesGroups = currencyKeys.sort((a, b) => {
    const aRate = findRate(currencyRates, settings?.currency ?? undefined, a);
    const bRate = findRate(currencyRates, settings?.currency ?? undefined, b);
    return bRate - aRate;
  });
</script>

<div class="flex-col gap-1">
  <div class="flex-grow">
    <Input bind:value={search} icon="mdi:search" placeholder={$translate('common.search')} clearable />
  </div>
  {#each currenciesGroups as currency}
    <h4 class="m-0">{currency}</h4>
    <div class="container">
      {#each currencyRateByCurrency.get(currency) ?? [] as item (item.id)}
        <button class="card" on:click={() => changeCurrencyRate(item)} on:keypress={() => {}}>
          <b>{item.cur1} / {item.cur2}</b>
          <div>1 {item.cur1} = {item.rate} {item.cur2}</div>
          <div>1 {item.cur2} = {(1 / item.rate).toFixed(4)} {item.cur1}</div>
        </button>
      {/each}
    </div>
  {/each}
</div>

{#if opened}
  <CurrencyRateModal item={selectedItem} bind:opened />
{/if}

<style>
  .container {
    gap: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  .card {
    font-size: 0.7rem;
    padding: 1rem 0.5rem;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    cursor: pointer;
  }
  @media (hover: hover) {
    .card:hover {
      opacity: 0.9;
    }
  }
</style>
