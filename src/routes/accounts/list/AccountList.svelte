<script lang="ts">
  import { mainService } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { groupBySelector } from '$lib/utils';
  import { calculateBalance } from '../utils';

  import AccountListItem from './AccountListItem.svelte';

  export let accounts: Account[];
  export let onClick: (account: Account) => void = () => {};

  const transactionsStore = mainService.$transactions;
  $: transactions = $transactionsStore;
  $: transactionsByAccount = groupBySelector(transactions, (t) => t.account.id);
</script>

<ul class="flex-col gap-1">
  {#each accounts as account (account.id)}
    <AccountListItem {account} {onClick} balance={calculateBalance(transactionsByAccount[account.id] ?? [])} />
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0 1rem;
  }
</style>
