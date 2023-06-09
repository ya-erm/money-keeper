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
  <div class="flex-col gap-0.25">
    <div>{$translate('accounts.tags')}</div>
    <Tags tags={accountTags.map((tag) => ({ id: tag.id, title: tag.name }))} bind:selected={selectedTags} readOnly />
  </div>
  <div class="flex-col gap-0.25">
    <div>{$translate('accounts.currency')}</div>
    <Tags
      tags={currencies.map((currency) => ({ id: currency, title: currency }))}
      bind:selected={selectedCurrencies}
      readOnly
    />
  </div>
</div>
