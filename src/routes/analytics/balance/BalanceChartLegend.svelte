<script lang="ts">
  import type { Account } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';

  export let accounts: Account[];
  export let selectedAccounts: string[] = [];
  export let onApply: (selected: string[]) => void;

  const handleChange = (id: string, checked: boolean) => {
    selectedAccounts = checked ? selectedAccounts.concat(id) : selectedAccounts.filter((x) => x !== id);
  };

  $: allChecked = accounts.every((account) => selectedAccounts.includes(account.id));
  $: someChecked = accounts.some((account) => selectedAccounts.includes(account.id));
</script>

<div class="p-1 flex-col h-full">
  <Checkbox
    checked={allChecked}
    indeterminate={!allChecked && someChecked}
    onChange={(value) => (selectedAccounts = value ? accounts.map((account) => account.id) : [])}
  >
    <div class="py-0.5">
      {$translate('common.select_all')}
    </div>
  </Checkbox>
  <ul class="flex-col list">
    {#each accounts as account (account.id)}
      <li>
        <Checkbox checked={selectedAccounts.includes(account.id)} onChange={(value) => handleChange(account.id, value)}>
          <div class="py-0.5 flex gap-0.5">
            <div class="color" style="background-color: {account.color}" />
            <span>{account.name}</span>
          </div>
        </Checkbox>
      </li>
    {/each}
  </ul>
  <Button on:click={() => onApply(selectedAccounts)}>
    {$translate('common.apply')}
  </Button>
</div>

<style>
  .list {
    overflow-y: auto;
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
  }
  .color {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
  }
</style>
