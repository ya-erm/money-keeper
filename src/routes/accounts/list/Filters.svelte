<script lang="ts">
  import { accountTagsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Tags from '$lib/ui/Tags.svelte';

  import { hideZeroBalanceAccounts } from './store';

  export let accounts: AccountViewModel[];

  export let selectedTags: string[] = [];
  export let selectedCurrencies: string[] = [];

  $: accountTags = $accountTagsStore;

  $: currencies = [...new Set(accounts.map((account) => account.currency))];
</script>

<div class="filters-container p-1 flex-col gap-1">
  {#if accountTags.length > 0}
    <div class="filter-group flex-col gap-0.5">
      <div class="filter-title">{$translate('accounts.tags')}</div>
      <Tags tags={accountTags.map((tag) => ({ id: tag.id, title: tag.name }))} bind:selected={selectedTags} readOnly />
    </div>
  {/if}
  <div class="filter-group flex-col gap-0.5">
    <div class="filter-title">{$translate('accounts.currency')}</div>
    <Tags
      tags={currencies.map((currency) => ({ id: currency, title: currency }))}
      bind:selected={selectedCurrencies}
      readOnly
    />
  </div>
  <Checkbox
    checked={$hideZeroBalanceAccounts}
    onChange={(value) => hideZeroBalanceAccounts.set(value)}
    label={$translate('analytics.accounts.hide_zero_balance_accounts')}
  />
</div>

<style>
  .filters-container {
    border-radius: 1rem;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
  }
  .filter-title {
    font-weight: 500;
  }
</style>
