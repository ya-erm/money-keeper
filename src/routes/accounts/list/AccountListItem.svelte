<script lang="ts">
  import type { Account, AccountViewModel, CurrencyRate } from '$lib/data/interfaces';
  import Icon from '$lib/ui/Icon.svelte';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let account: AccountViewModel;
  export let balance: number | null = null;
  export let currencyRate: CurrencyRate | null = null;

  export let onClick: (account: Account) => void = () => {};

  const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;
</script>

<button
  type="button"
  data-id={account.id}
  aria-label={account.name}
  id={`account-list-item ${account.id}`}
  class="flex items-center justify-between"
  on:click={() => onClick(account)}
>
  <div class="flex items-center gap-0.5">
    <div class="account-icon">
      <Icon name={account.icon ?? 'mdi:credit-card-outline'} padding={0.5} />
    </div>
    <div class="flex-col items-start gap-0.25">
      <div class="account-name">{account.name}</div>
      <div class="account-tags">{account.tags.map((t) => `#${t.name}`).join(' ')}</div>
    </div>
  </div>
  <div class="flex-grow self-stretch" />
  <div class="flex gap-0.25 items-center">
    <div class="flex-col items-end gap-0.25">
      <div class="money-value flex gap-0.5">
        {formatMoney(balance ?? 0, { currency: account.currency })}
      </div>
      {#if currencyRate && balance !== null}
        <div class="other-money-value">
          {formatMoney(balance * rate, { currency: otherCurrency })}
        </div>
      {/if}
    </div>
    <slot name="end" />
  </div>
</button>

<style>
  button {
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 1rem;
    background-color: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    border: 1px solid var(--border-color);
    width: 100%;
    transition: box-shadow 0.2s ease-in-out;
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
  .account-tags {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .money-value {
    font-size: 1rem;
  }
  .other-money-value {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
</style>
