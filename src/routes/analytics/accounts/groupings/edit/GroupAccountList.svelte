<script lang="ts">
  import type { Group } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import GroupAccountListItem from './GroupAccountListItem.svelte';

  export let group: Group;

  export let onAddAccountToGroup: (groupId: string) => void;

  const deleteAccountFromGroup = (accountId: string) => {
    group.accountIds = group.accountIds?.filter((item) => item !== accountId);
  };
</script>

<div class="accounts flex-col gap-0.5">
  <InputLabel text={$translate('analytics.groupings.groups.accounts')} />
  <ul class="flex-col gap-1">
    {#each group.accountIds ?? [] as accountId (accountId)}
      <li>
        <GroupAccountListItem {accountId} onDelete={() => deleteAccountFromGroup(accountId)} />
      </li>
    {/each}
  </ul>
  <Button color="white" on:click={() => onAddAccountToGroup(group.id)}>
    {$translate('analytics.groupings.groups.accounts.add')}
  </Button>
</div>

<style>
  .accounts > ul {
    padding-left: 1.5rem;
  }
</style>
