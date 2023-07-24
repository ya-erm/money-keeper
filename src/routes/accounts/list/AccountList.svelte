<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  import { currencyRatesStore, memberSettingsStore, membersService, operationsStore } from '$lib/data';
  import type { Account, AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { groupBySelector } from '$lib/utils';

  import { calculateBalance, findCurrencyRate } from '../utils';
  import AccountListItem from './AccountListItem.svelte';
  import Filters from './Filters.svelte';

  export let accounts: AccountViewModel[];
  export let onClick: (account: Account) => void = () => {};

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: operationsByAccount = groupBySelector($operationsStore, (t) => t.account.id);

  let showFilters = false;

  let search: string = '';
  let selectedTags: string[] = [];
  let selectedCurrencies: string[] = [];

  $: filteredAccounts = accounts
    .filter((account) => !selectedTags.length || selectedTags.some((tagId) => account.tagIds?.includes(tagId)))
    .filter((account) => !selectedCurrencies.length || selectedCurrencies.some((cur) => account.currency === cur))
    .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()));

  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent<DndEvent<AccountViewModel>>) {
    filteredAccounts = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<AccountViewModel>>) {
    filteredAccounts = e.detail.items;
    membersService.saveAccountsOrder(filteredAccounts.map((account) => account.id));
  }
</script>

<div class="p-1 flex-col gap-1">
  <div class="flex gap-1">
    <div class="flex-grow">
      <Input bind:value={search} placeholder={$translate('common.search')} clearable />
    </div>
    <Button color={showFilters ? 'primary' : 'white'} bordered on:click={() => (showFilters = !showFilters)}>
      <Icon size={1.25} name="mdi:filter" />
      {#if selectedTags.length || selectedCurrencies.length}
        <span class="filter-badge" />
      {/if}
    </Button>
  </div>
  {#if showFilters}
    <Filters {accounts} bind:selectedTags bind:selectedCurrencies />
  {/if}
  <ul
    class="flex-col gap-1"
    use:dndzone={{ items: filteredAccounts, flipDurationMs, dropTargetStyle: {} }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each filteredAccounts as account (account.id)}
      <li animate:flip={{ duration: flipDurationMs }}>
        <AccountListItem
          {account}
          {onClick}
          currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
          balance={calculateBalance(operationsByAccount[account.id] ?? [])}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
  .filter-badge {
    background: var(--active-color);
    border-radius: 100%;
    width: 8px;
    height: 8px;
    position: absolute;
    transform: translate(10px, 10px);
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    list-style: none;
  }
</style>
