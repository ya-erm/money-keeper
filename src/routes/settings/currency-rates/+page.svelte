<script lang="ts">
  import type { CurrencyRate } from '@prisma/client';
  import { applyAction, enhance } from '$app/forms';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { backLink } from '$lib/ui/header';
  import Icon from '$lib/ui/Icon.svelte';

  import type { PageData } from './$types';
  import CurrencyRateModal from './CurrencyRateModal.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { showSuccessToast } from '$lib/ui/toasts';

  export let data: PageData;
  $: items = data.items;
  $: settings = data.settings;

  backLink.set(routes.settings.path);

  let opened = false;
  let selectedItem: CurrencyRate | null = null;

  const changeCurrencyRate = (item: CurrencyRate) => {
    selectedItem = item;
    opened = true;
  };

  const addCurrencyRate = () => {
    selectedItem = null;
    opened = true;
  };
</script>

<div class="p-1 flex-col gap-1">
  <form
    class="flex gap-0.5 items-end"
    action="?/setCurrency"
    method="POST"
    use:enhance={() =>
      ({ result }) => {
        if (result.type == 'success') {
          showSuccessToast($translate('common.save_changes_success'));
        }
      }}
  >
    <Input name="currency" label={$translate('currency_rates.default_currency')} value={settings?.currency} />
    <Button text={$translate('common.save')} type="submit" />
  </form>
  <div class:container={!!items.length}>
    {#each items as item (item.id)}
      <div class="card" on:click={() => changeCurrencyRate(item)} role="button" on:keypress={() => {}}>
        <b>{item.cur1} / {item.cur2}</b>
        <div>1 {item.cur1} = {item.rate} {item.cur2}</div>
        <div>1 {item.cur2} = {(1 / item.rate).toFixed(4)} {item.cur1}</div>
      </div>
    {/each}
    <div class="card add flex-center" on:click={addCurrencyRate} role="button" on:keypress={() => {}}>
      <Icon name="mdi:add" />
      <span>{$translate('common.add')}</span>
    </div>
  </div>
</div>

{#if opened}
  <CurrencyRateModal item={selectedItem} bind:opened />
{/if}

<style>
  .container {
    gap: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  }
  .card {
    padding: 1rem;
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
  .add {
    border-style: dashed;
    background-color: transparent;
    border-color: var(--active-color);
    color: var(--active-color);
  }
</style>
