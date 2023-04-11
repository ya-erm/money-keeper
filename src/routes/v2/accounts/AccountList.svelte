<script lang="ts">
  import type { Account } from '$lib/data/interfaces';
  import AccountListItem from './AccountListItem.svelte';

  export let accounts: Account[];
  export let onClick: (account: Account) => void = () => {};
</script>

<ul class="flex-col gap-1">
  {#each accounts as account (account.id)}
    <AccountListItem {account} {onClick} />
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0 1rem;
  }
</style>
