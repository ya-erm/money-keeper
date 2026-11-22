<script lang="ts">
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { settingsStore } from '#lib/data/settings.js';
  import { translate } from '#lib/translate/index.js';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import WalletOptionsButton from './WalletOptionsButton.svelte';

  export let wallet: VirtualWallet;
  export let ownerName: string;
  export let balances: { currency: string; amount: number }[];
  $: nonzero = balances.filter((balance) => balance.amount !== 0 || balances.length === 1);
</script>

<article class="wallet-card" data-testId="WalletCard" data-id={wallet.id}>
  <div class="heading">
    <a class="name" href={`/wallets?wallet=${encodeURIComponent(wallet.id)}`}
      ><strong>{wallet.name}</strong><span class="hint">{ownerName}</span></a
    >
    <WalletOptionsButton {wallet} from="settings" />
  </div>
  <a class="balances" href={`/wallets?wallet=${encodeURIComponent(wallet.id)}`}>
    {#each nonzero as balance (balance.currency)}<span class="wallet-money" class:overdrawn={balance.amount < 0}>
        {#if $settingsStore.hideBalances}<HiddenMoney currency={balance.currency} />{:else}{formatDebtMoney(
            balance.amount,
            { currency: balance.currency },
          )}{/if}
      </span>{/each}
    {#if !nonzero.length}<span class="wallet-money"
        >{#if $settingsStore.hideBalances}<HiddenMoney />{:else}0{/if}</span
      >{/if}
  </a>
  {#if wallet.archived}<span class="hint">{$translate('accounts.archived')}</span>{/if}
</article>

<style>
  .wallet-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1rem;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .heading {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .name,
  .balances {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: inherit;
    text-decoration: none;
    min-width: 0;
  }
  .name {
    flex: 1;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .wallet-money {
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
  }
  .overdrawn {
    color: var(--red-color);
  }
</style>
