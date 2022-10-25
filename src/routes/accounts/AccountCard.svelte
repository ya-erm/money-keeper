<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Account } from '@prisma/client';

  import { routes } from '$lib/routes';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  export let account: Account;

  const value = 0;
</script>

<div class="w-full h-full p-1 flex-col items-center justify-between">
  <div class="w-full flex items-center gap-0.5">
    <div class="account-icon flex items-center justify-center">
      <Icon path={account.icon || '/icons/briefcase-outline.svg'} padding={0.5} />
    </div>
    <div class="flex-grow">{account.name}</div>
    <Button appearance="link" color="white" on:click={() => goto(`${routes.accounts.path}/${account.id}`)}>
      <Icon path="/icons/pencil.svg" size={1.5} padding={0.5} />
    </Button>
  </div>
  <div class="money-value flex">{value} {account.currency}</div>
  <div class="flex footer" />
</div>

<style>
  .account-icon {
    border-radius: 100%;
    background-color: var(--background-color);
  }
  .money-value {
    font-size: 1.2rem;
  }
  .footer {
    min-height: 2.5rem;
  }
</style>
