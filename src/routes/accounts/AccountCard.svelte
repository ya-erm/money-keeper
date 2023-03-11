<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Account, CurrencyRate } from '@prisma/client';

  import { routes } from '$lib/routes';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let account: Account & { sum: number };
  export let currencyRate: CurrencyRate | null = null;

  const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;
</script>

<div class="w-full h-full p-1 flex-col items-center justify-between">
  <div class="w-full flex items-center gap-0.5">
    <div class="account-icon flex items-center justify-center">
      <Icon name={account.icon || 'mdi:briefcase-outline'} padding={0.5} />
    </div>
    <div class="flex-grow">{account.name}</div>
    <Button appearance="link" color="white" on:click={() => goto(`${routes.accounts.path}/${account.id}`)}>
      <Icon name="mdi:pencil" padding={0.5} />
    </Button>
  </div>
  <div class="flex-col items-center gap-0.25">
    <div class="money-value">
      {formatMoney(account.sum, account.currency)}
    </div>
    {#if currencyRate}
      <div class="other-money-value">
        {formatMoney(account.sum * rate, otherCurrency)}
      </div>
    {/if}
  </div>
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
  .other-money-value {
    font-size: 1rem;
    color: var(--secondary-text-color);
  }
  .footer {
    min-height: 2.5rem;
  }
</style>
