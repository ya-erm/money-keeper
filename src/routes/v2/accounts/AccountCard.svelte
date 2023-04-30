<script lang="ts">
  import type { Account, CurrencyRate } from '$lib/data/interfaces';
  import { accountsService } from '$lib/data';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';

  import AccountModal from './list/AccountModal.svelte';

  export let account: Account;
  export let balance: number | null = null;
  export let currencyRate: CurrencyRate | null = null;

  const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;

  let opened = false;

  const onSave = (item: Account) => {
    accountsService.save(item);
  };

  const onDelete = (item: Account) => {
    accountsService.delete(item);
  };

  const handleEdit = () => {
    opened = true;
  };
</script>

<div class="w-full h-full p-1 flex-col items-center justify-between">
  <div class="w-full flex items-center gap-0.5">
    <div class="account-icon flex items-center justify-center">
      <Icon name={account.icon || 'mdi:briefcase-outline'} padding={0.5} />
    </div>
    <div class="flex-grow">{account.name}</div>
    <Button appearance="link" color="white" on:click={handleEdit}>
      <Icon name="mdi:pencil" padding={0.5} />
    </Button>
  </div>
  <div class="flex-col items-center gap-0.25">
    <div class="money-value">
      {formatMoney(balance ?? 0, { currency: account.currency })}
    </div>
    {#if currencyRate && balance !== null}
      <div class="other-money-value">
        {formatMoney(balance * rate, { currency: otherCurrency })}
      </div>
    {/if}
  </div>
  <div class="flex footer" />
</div>

{#if opened}
  <AccountModal {account} bind:opened {onSave} {onDelete} />
{/if}

<style>
  .account-icon {
    border-radius: 100%;
    background-color: var(--background-color);
  }
  .money-value {
    font-size: 1.2rem;
  }
  .other-money-value {
    font-size: 1rem;
    color: var(--secondary-text-color);
  }
  .footer {
    min-height: 2.5rem;
  }
</style>
