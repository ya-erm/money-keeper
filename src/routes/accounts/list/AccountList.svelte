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

  import Spoiler from '$lib/ui/Spoiler.svelte';
  import { calculateBalance, findCurrencyRate } from '../utils';
  import AccountListItem from './AccountListItem.svelte';
  import Filters from './Filters.svelte';

  export let accounts: AccountViewModel[];
  export let onClick: (account: Account) => void = () => {};
  export let sortable = false;

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: operationsByAccount = groupBySelector($operationsStore, (t) => t.account.id);

  let showFilters = false;

  let search: string = '';
  let selectedTags: string[] = [];
  let selectedCurrencies: string[] = [];

  $: filteredAccounts = sortable
    ? accounts
    : accounts
        .filter((account) => !selectedTags.length || selectedTags.some((tagId) => account.tagIds?.includes(tagId)))
        .filter((account) => !selectedCurrencies.length || selectedCurrencies.some((cur) => account.currency === cur))
        .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()));

  $: sortedAccounts = filteredAccounts;

  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent<DndEvent<AccountViewModel>>) {
    sortedAccounts = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<AccountViewModel>>) {
    sortedAccounts = e.detail.items;
  }

  function saveAccountsOrder() {
    membersService.saveAccountsOrder(sortedAccounts.map((account) => account.id));
    sortable = false;
  }

  function restoreAccountsOrder() {
    sortedAccounts = accounts;
    sortable = false;
  }
</script>

<div class="py-1 flex-col h-full">
  <div class="header" class:x-0={sortable} class:x-50={!sortable}>
    <!-- {#if sortable} -->
    <div class="sorting px-1 mb-1 flex-center gap-1">
      <span>{$translate('accounts.sort')}</span>
      <Button color="white" on:click={restoreAccountsOrder}>
        {$translate('common.cancel')}
      </Button>
      <Button color="primary" on:click={saveAccountsOrder}>
        {$translate('common.save')}
      </Button>
    </div>
    <!-- {:else} -->
    <div class="search-and-filters">
      <div class="px-1 mb-1 flex gap-1">
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
      <Spoiler hidden={sortable || !showFilters}>
        <div class="px-1 pb-1">
          <Filters {accounts} bind:selectedTags bind:selectedCurrencies />
        </div>
      </Spoiler>
    </div>
    <!-- {/if} -->
  </div>

  <ul
    class="flex-col gap-1 px-1"
    use:dndzone={{ items: sortedAccounts, flipDurationMs, dragDisabled: !sortable, dropTargetStyle: {} }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each sortedAccounts as account (account.id)}
      <li animate:flip={{ duration: flipDurationMs }}>
        <AccountListItem
          {account}
          {onClick}
          currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
          balance={calculateBalance(operationsByAccount[account.id] ?? [])}
          draggable={sortable}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
  .header {
    display: grid;
    width: 200vw;
    grid-template-columns: 1fr 1fr;
    transition: transform 0.5s;
  }
  .x-50 {
    transform: translateX(-50%);
  }
  .x-0 {
    transform: translateX(0%);
  }
  .filter-badge {
    background: var(--active-color);
    border-radius: 100%;
    width: 8px;
    height: 8px;
    position: absolute;
    transform: translate(10px, 10px);
  }
  ul {
    overflow-y: auto;
    list-style: none;
    margin: 0;
  }
  li {
    list-style: none;
  }
</style>
