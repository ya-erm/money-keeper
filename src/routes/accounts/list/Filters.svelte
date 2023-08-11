<script lang="ts">
  import { accountTagsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Tags from '$lib/ui/Tags.svelte';

  export let accounts: AccountViewModel[];

  export let selectedTags: string[] = [];
  export let selectedCurrencies: string[] = [];

  $: accountTags = $accountTagsStore;

  $: currencies = [...new Set(accounts.map((account) => account.currency))];
</script>

<div class="flex-col gap-1">
  {#if accountTags.length > 0}
    <div class="flex-col gap-0.5">
      <div>{$translate('accounts.tags')}</div>
      <Tags tags={accountTags.map((tag) => ({ id: tag.id, title: tag.name }))} bind:selected={selectedTags} readOnly />
    </div>
  {/if}
  <div class="flex-col gap-0.5">
    <div>{$translate('accounts.currency')}</div>
    <Tags
      tags={currencies.map((currency) => ({ id: currency, title: currency }))}
      bind:selected={selectedCurrencies}
      readOnly
    />
  </div>
</div>
