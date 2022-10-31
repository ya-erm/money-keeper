<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Account } from '@prisma/client';

  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';

  export let accounts: Account[];
  export let fromUrl: boolean = false;
  export let accountId: number | null = null;

  $: accountIdFromUrl = parseInt($page.url.searchParams.get('accountId') ?? '') || null;

  $: _accountId = fromUrl ? accountIdFromUrl : accountId;

  const setAccountId = (value: number) => {
    if (fromUrl) {
      $page.url.searchParams.set('accountId', `${value}`);
      goto($page.url, { replaceState: true });
    } else {
      accountId = value;
    }
  };
</script>

<div class="flex-col gap-0.5">
  <label class="label">
    <span>{$translate('transactions.account')}</span>
    <input name="accountId" value={_accountId} class="hidden" readonly required />
  </label>
  <div class="grid">
    {#each accounts as account}
      <GridCircleItem
        selected={_accountId === account.id}
        onClick={() => setAccountId(account.id)}
        icon={account.icon || 'mdi:briefcase-outline'}
        text={account.name}
      />
    {/each}
  </div>
</div>

<style>
  .label {
    text-align: center;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
</style>
