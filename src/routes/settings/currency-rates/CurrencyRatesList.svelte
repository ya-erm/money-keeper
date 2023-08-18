<script lang="ts">
  import { page } from '$app/stores';

  import { currencyRatesStore } from '$lib/data';
  import type { CurrencyRate } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import { useRightButton, useTitle } from '$lib/ui/header';
  import { deleteSearchParam, getSearchParam } from '$lib/utils';

  import AddCurrencyRateButton from './AddCurrencyRateButton.svelte';
  import CurrencyRateModal from './CurrencyRateModal.svelte';

  useTitle($translate('currency_rates.title'));
  useRightButton(AddCurrencyRateButton);

  $: currencyRates = $currencyRatesStore;

  let selectedItem: CurrencyRate | null = null;
  let opened = false;

  $: action = getSearchParam($page, 'action');
  $: if (action === 'create') {
    selectedItem = null;
    opened = true;
  }
  $: if (!!action && !opened) {
    deleteSearchParam($page, 'action');
  }

  const changeCurrencyRate = (item: CurrencyRate) => {
    selectedItem = item;
    opened = true;
  };
</script>

<div class="container">
  {#each currencyRates as item (item.id)}
    <button class="card" on:click={() => changeCurrencyRate(item)} on:keypress={() => {}}>
      <b>{item.cur1} / {item.cur2}</b>
      <div>1 {item.cur1} = {item.rate} {item.cur2}</div>
      <div>1 {item.cur2} = {(1 / item.rate).toFixed(4)} {item.cur1}</div>
    </button>
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
