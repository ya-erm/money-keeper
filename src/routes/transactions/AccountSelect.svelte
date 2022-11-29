<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Account } from '@prisma/client';

  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import { getNumberSearchParam } from '$lib/utils';

  export let name = 'accountId';
  export let label = $translate('transactions.account');
  export let accounts: Account[];
  export let fromUrl: boolean = false;
  export let accountId: number | null = null;

  $: accountIdFromUrl = getNumberSearchParam($page, name);

  $: _accountId = fromUrl ? accountIdFromUrl : accountId;

  const setAccountId = (value: number) => {
    if (fromUrl) {
      $page.url.searchParams.set(name, `${value}`);
      goto($page.url, { replaceState: true });
    } else {
      accountId = value;
    }
  };
</script>

<div class="flex-col gap-0.5">
  <label class="label">
    <span>{label}</span>
    <input {name} value={_accountId} class="hidden" readonly required />
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
    gap: 0.25rem;
  }
</style>
