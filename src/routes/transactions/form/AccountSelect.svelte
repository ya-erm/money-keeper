<script lang="ts">
  /** Deprecated: use AccountSelector */

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import type { Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import { getSearchParam } from '$lib/utils';

  export let name = 'accountId';
  export let label = $translate('transactions.account');
  export let accounts: Account[];
  export let fromUrl: boolean = false;
  export let accountId: string | null = null;
  export let testId: string | undefined = 'AccountSelect';

  $: accountIdFromUrl = getSearchParam($page, name);

  $: _accountId = fromUrl ? accountIdFromUrl : accountId;

  const setAccountId = async (value: string) => {
    if (fromUrl) {
      $page.url.searchParams.set(name, value);
      await goto($page.url, { replaceState: true, invalidateAll: true });
    } else {
      accountId = value;
    }
  };
</script>

<div class="flex-col gap-0.5" data-testId={testId}>
  <label class="label">
    <span data-testId={`${testId}.Label`}>{label}</span>
    <input {name} value={_accountId} class="hidden" readonly required />
  </label>
  <div class="grid" data-testId={`${testId}.Grid`}>
    {#each accounts as account (account.id)}
      <GridCircleItem
        selected={_accountId === account.id}
        onClick={() => setAccountId(account.id)}
        icon={account.icon || 'mdi:briefcase-outline'}
        testId={`${testId}.Item`}
        dataId={account.id}
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
