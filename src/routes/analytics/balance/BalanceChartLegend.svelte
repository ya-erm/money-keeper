<script lang="ts">
  import type { Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Checkbox from '$lib/ui/Checkbox.svelte';

  export let accounts: Account[];
  export let selectedAccounts: string[] = [];
  export let onChange: (id: 'all' | string, checked: boolean) => void;

  $: allChecked = accounts.every((account) => selectedAccounts.includes(account.id));
  $: someChecked = accounts.some((account) => selectedAccounts.includes(account.id));
</script>

<div class="legend">
  <Checkbox
    checked={allChecked}
    indeterminate={!allChecked && someChecked}
    onChange={(value) => onChange('all', value)}
  >
    {$translate('common.select_all')}</Checkbox
  >
  {#each accounts as account (account.id)}
    <Checkbox checked={selectedAccounts.includes(account.id)} onChange={(value) => onChange(account.id, value)}>
      <div class="color" style="background-color: {account.color}" />
      <span>{account.name}</span>
    </Checkbox>
  {/each}
</div>

<style>
  .legend {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .color {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
  }
</style>
