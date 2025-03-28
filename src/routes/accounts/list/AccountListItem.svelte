<script lang="ts">
  import type { Account, AccountViewModel, CurrencyRate } from '$lib/data/interfaces';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { formatMoney } from '$lib/utils/formatMoney';

  export let account: AccountViewModel;
  export let balance: number | null = null;
  export let currencyRate: CurrencyRate | null = null;
  export let draggable = false;

  export let onClick: (account: Account) => void = () => {};

  const rate = currencyRate?.cur1 === account.currency ? currencyRate.rate : 1 / (currencyRate?.rate ?? 1);
  const otherCurrency = currencyRate?.cur1 === account.currency ? currencyRate.cur2 : currencyRate?.cur1;

  const handleClick = () => {
    if (draggable) {
      return;
    }
    onClick(account);
  };
</script>

<button
  type="button"
  data-id={account.id}
  aria-label={account.name}
  id={`account-list-item ${account.id}`}
  class="flex items-center justify-between"
  class:draggable
  on:click={handleClick}
>
  <div class="drag-zone" class:drag-zone-hidden={!draggable}>
    <Icon name="mdi:drag" />
  </div>
  <div class="flex items-center gap-0.5">
    <div class="account-icon" style:background={account.color}>
      <Icon name={account.icon ?? 'mdi:credit-card-outline'} padding={0.5} />
    </div>
    <div class="flex-col items-start gap-0.25">
      <div class="account-name text-ellipsis-all">{account.name}</div>
      {#if account.tags.length > 0}
        <div class="account-tags text-ellipsis-all">{account.tags.map((t) => `#${t.name}`).join(' ')}</div>
      {/if}
    </div>
  </div>
  <div class="flex-grow self-stretch"></div>
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
    overflow: hidden;
  }
  @media (hover: hover) {
    button:hover {
      box-shadow: 0.25rem 0.25rem 0.5rem 0 rgba(0, 0, 0, 0.1);
    }
  }
  button.draggable {
    cursor: grab;
  }
  .drag-zone {
    pointer-events: auto;
    justify-content: flex-start;
    color: var(--secondary-text-color);
    transition: width 0.5s;
    width: 2.5rem;
  }
  .drag-zone-hidden {
    width: 0;
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
