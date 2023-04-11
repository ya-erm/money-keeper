<script lang="ts">
  import type { Account } from '$lib/data/interfaces';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let account: Account;
  export let balance: number | null = null;
  export let currencyRate: unknown | null = null;

  export let onClick: (account: Account) => void = () => {};

  // const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  // const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;
</script>

<li>
  <button aria-label={account.name} on:click={() => onClick(account)} class="flex items-center justify-between">
    <div class="flex items-center gap-0.5">
      <div class="account-icon">
        <Icon name={account.icon ?? 'mdi:credit-card-outline'} padding={0.5} />
      </div>
      <div class="account-name">{account.name}</div>
    </div>
    <div>
      <div class="money-value flex gap-0.5">
        {formatMoney(balance ?? 0, { currency: account.currency })}
      </div>
      {#if currencyRate}
        <div class="other-money-value">
          <!-- {formatMoney(balance * rate, { currency: otherCurrency })} -->
        </div>
      {/if}
    </div>
  </button>
</li>

<style>
  button {
    padding: 0.5rem;
    border-radius: 1rem;
    background-color: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    border: none;
    width: 100%;
  }
  @media (hover: hover) {
    button:hover {
      box-shadow: 0.25rem 0.25rem 0.5rem 0 rgba(0, 0, 0, 0.1);
      opacity: 0.9;
    }
  }
  .account-icon {
    border-radius: 100%;
    background-color: var(--background-color);
  }
  .account-name {
    font-size: 1rem;
  }
  .money-value {
    font-size: 1rem;
  }
  .other-money-value {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
</style>
