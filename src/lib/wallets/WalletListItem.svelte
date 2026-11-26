<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { settingsStore } from '#lib/data/settings.js';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  export let wallet: VirtualWallet;
  export let ownerName: string;
  export let balances: { currency: string; amount: number }[];
  export let draggable = false;
  export let placeholder = false;
  export let disabled = false;
  export let ariaLabel: string | undefined = undefined;
  export let onClick: () => void;
  $: shown = balances.filter((balance) => balance.amount !== 0 || balances.length === 1);
</script>

<button
  type="button"
  {disabled}
  class:draggable
  class:placeholder
  aria-label={ariaLabel ?? wallet.name}
  data-testId="WalletListItem"
  data-id={wallet.id}
  on:click={() => {
    if (!draggable) onClick();
  }}
>
  <span class="drag-zone" class:collapsed={!draggable}><Icon name="mdi:drag" /></span>
  <span class="wallet-icon"><Icon name={wallet.icon || 'mdi:wallet-outline'} padding={0.5} /></span>
  <span class="identity"
    ><span>{wallet.name}</span>{#if ownerName}<small>{ownerName}</small>{/if}</span
  >
  {#if !placeholder}<span class="balances">
      {#each shown as balance (balance.currency)}<span
          >{#if $settingsStore.hideBalances}<HiddenMoney currency={balance.currency} />{:else}{formatDebtMoney(
              balance.amount,
              { currency: balance.currency },
            )}{/if}</span
        >{/each}
      {#if !shown.length}<span
          >{#if $settingsStore.hideBalances}<HiddenMoney />{:else}0{/if}</span
        >{/if}
    </span>{/if}
  <slot name="end" />
</button>

<style>
  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    width: 100%;
    min-width: 0;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    font: inherit;
    cursor: pointer;
    text-align: left;
    overflow: hidden;
  }
  button.draggable {
    cursor: grab;
  }
  .drag-zone {
    display: inline-flex;
    color: var(--secondary-text-color);
    flex-shrink: 0;
    width: 2rem;
    transition:
      width 0.5s,
      margin-right 0.5s;
    overflow: hidden;
  }
  .drag-zone.collapsed {
    width: 0;
    margin-right: -0.5rem;
  }
  .wallet-icon {
    display: inline-flex;
    border-radius: 50%;
    background: var(--background-color);
    flex-shrink: 0;
  }
  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }
  .identity > span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .placeholder .identity > span {
    color: var(--secondary-text-color);
  }
  .balances {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-end;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
