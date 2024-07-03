<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  import { currencyRatesStore, memberSettingsStore, membersService, operationsStore } from '$lib/data';
  import type { Account, AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Spoiler from '$lib/ui/Spoiler.svelte';
  import SpoilerToggle from '$lib/ui/SpoilerToggle.svelte';
  import { calculateBalance, findCurrencyRate, groupBySelector, pastOperationsPredicate } from '$lib/utils';

  import { hideZeroBalanceAccounts } from './store';

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
        .filter((account) => {
          const balance = calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? []);
          return $hideZeroBalanceAccounts ? Number(balance.toFixed(8)) !== 0 : true;
        })
        .filter((account) => !selectedTags.length || selectedTags.some((tagId) => account.tagIds?.includes(tagId)))
        .filter((account) => !selectedCurrencies.length || selectedCurrencies.some((cur) => account.currency === cur))
        .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()));

  $: archivedAccounts = filteredAccounts.filter((account) => account.archived);

  $: sortedAccounts = filteredAccounts.filter((account) => !account.archived);

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

  let scrollTop = 0;

  let archivedHidden = true;
</script>

<div on:scroll={(e) => (scrollTop = e.currentTarget.scrollTop)} class="accounts-list pb-1 flex-col">
  <div class="header py-1" class:sticky={sortable} class:bordered={scrollTop > 0}>
    <!-- {#if sortable} -->
    <div class="sorting flex-center px-1 gap-1" class:left={!sortable}>
      <span>{$translate('common.sorting')}</span>
      <div class="grid-col-2 gap-1">
        <Button color="white" on:click={restoreAccountsOrder}>
          {$translate('common.cancel')}
        </Button>
        <Button color="primary" on:click={saveAccountsOrder}>
          {$translate('common.save')}
        </Button>
      </div>
    </div>
    <!-- {:else} -->
    <div class="search-and-filters" class:left={!sortable}>
      <div class="flex px-1 gap-1">
        <div class="flex-grow">
          <Input bind:value={search} placeholder={$translate('common.search')} clearable />
        </div>
        <Button color={showFilters ? 'primary' : 'white'} bordered on:click={() => (showFilters = !showFilters)}>
          <Icon size={1.25} name="mdi:filter" />
          {#if selectedTags.length || selectedCurrencies.length || $hideZeroBalanceAccounts}
            <span class="filter-badge" />
          {/if}
        </Button>
      </div>
      <Spoiler hidden={sortable || !showFilters}>
        <div class="px-1 pt-1">
          <Filters {accounts} bind:selectedTags bind:selectedCurrencies />
        </div>
      </Spoiler>
    </div>
    <!-- {/if} -->
  </div>

  {#if accounts.length === 0}
    <span class="no-data">{$translate('accounts.no_data')}</span>
  {/if}

  <ul
    class="flex-col gap-1 px-1"
    use:dndzone={{
      items: sortedAccounts,
      dragDisabled: !sortable,
      dropTargetStyle: {},
      flipDurationMs,
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    on:contextmenu|preventDefault
  >
    {#each sortedAccounts as account (account.id)}
      <li animate:flip={{ duration: flipDurationMs }}>
        <AccountListItem
          {account}
          {onClick}
          currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
          balance={calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? [])}
          draggable={sortable}
        />
      </li>
    {/each}
  </ul>

  {#if archivedAccounts.length > 0}
    <Spoiler hidden={archivedHidden}>
      <div class="mt-1 px-1" slot="spoiler-header">
        <SpoilerToggle bind:hidden={archivedHidden}>
          <div class="ml-0.5 flex items-center gap-0.5">
            <Icon name="ri:archive-line" size={1.5} />
            <span>{$translate('accounts.archived_accounts')}</span>
          </div>
        </SpoilerToggle>
      </div>
      <ul class="flex-col gap-1 pt-1 px-1">
        {#each archivedAccounts as account (account.id)}
          <li animate:flip={{ duration: flipDurationMs }}>
            <AccountListItem
              {account}
              {onClick}
              currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
              balance={calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? [])}
            />
          </li>
        {/each}
      </ul>
    </Spoiler>
  {/if}
</div>

<style>
  .no-data {
    text-align: center;
    color: var(--secondary-text-color);
  }
  .accounts-list {
    overflow-x: hidden;
    height: 100%;
  }
  .sticky {
    position: sticky;
    top: 0;
  }
  .header {
    display: flex;
    background: var(--background-color);
    border-bottom: 1px solid transparent;
    transition: border 0.3s;
  }
  .header.sticky.bordered {
    border-bottom: 1px solid var(--border-color);
  }
  .header > div {
    transition: transform 0.5s;
    min-width: 100%;
  }
  .header > div.left {
    transform: translateX(-100%);
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
    list-style: none;
    margin: 0;
  }
</style>
