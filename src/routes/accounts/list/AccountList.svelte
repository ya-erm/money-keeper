<script lang="ts">
  import { currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
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
  <ul class="flex-col gap-1">
    {#each filteredAccounts as account (account.id)}
      <AccountListItem
        {account}
        {onClick}
        currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
        balance={calculateBalance(operationsByAccount[account.id] ?? [])}
      />
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
</style>
