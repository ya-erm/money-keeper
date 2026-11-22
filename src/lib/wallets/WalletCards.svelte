<script lang="ts">
  import { tick, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { Participant, VirtualWallet } from '#lib/data/interfaces.js';
  import { settingsStore } from '#lib/data/settings.js';
  import { translate } from '#lib/translate/index.js';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';

  export let wallets: VirtualWallet[];
  export let participants: Participant[];
  export let selectedId: string | undefined;
  export let currencies: string[];
  export let getBalance: (walletId: string, currency: string) => number;
  let container: HTMLDivElement;
  let previousId: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let locallyHidden: Record<string, boolean> = {};
  $: align(selectedId, container);
  async function align(id: string | undefined, element: HTMLDivElement) {
    if (!element || !id || id === previousId) return;
    previousId = id;
    await tick();
    const card = Array.from(element.querySelectorAll<HTMLElement>('[data-id]')).find((item) => item.dataset.id === id);
    if (card)
      element.scrollTo({ left: card.offsetLeft - (element.clientWidth - card.clientWidth) / 2, behavior: 'instant' });
  }
  function scroll() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-id]'));
      const center = container.scrollLeft + container.clientWidth / 2;
      const closest = cards.reduce<HTMLElement | null>(
        (best, card) =>
          !best ||
          Math.abs(card.offsetLeft + card.clientWidth / 2 - center) <
            Math.abs(best.offsetLeft + best.clientWidth / 2 - center)
            ? card
            : best,
        null,
      );
      if (closest?.dataset.id && closest.dataset.id !== selectedId)
        void goto(`/wallets?wallet=${closest.dataset.id}`, { reset: false, replace: true });
    }, 150);
  }
  onDestroy(() => clearTimeout(timer));
</script>

<div class="cards" bind:this={container} on:scroll={scroll} data-testId="WalletCards">
  {#each wallets as wallet (wallet.id)}
    <div class="card" data-id={wallet.id} data-testId="WalletCard">
      <div class="card-content">
        <div class="card-heading">
          <span class="wallet-icon"><Icon name="mdi:wallet-outline" padding={0.5} /></span>
          <a class="name" href={`/wallets?wallet=${wallet.id}`}
            ><span>{wallet.name}</span><span class="owner"
              >{wallet.participantId
                ? participants.find((person) => person.id === wallet.participantId)?.name
                : $translate('wallets.shared')}</span
            ></a
          >
          <a
            class="options"
            href={`/settings/wallets?action=edit&id=${wallet.id}`}
            aria-label={$translate('common.additional_options')}><Icon name="mdi:dots-vertical" padding={0.5} /></a
          >
        </div>
        <button
          type="button"
          class="balance"
          aria-label={$translate(
            $settingsStore.hideBalances || locallyHidden[wallet.id] ? 'accounts.show_balance' : 'accounts.hide_balance',
          )}
          on:click={() => (locallyHidden = { ...locallyHidden, [wallet.id]: !locallyHidden[wallet.id] })}
        >
          {#each currencies.filter((currency) => getBalance(wallet.id, currency) !== 0 || currencies.length === 1) as currency (currency)}<span
              data-testId="WalletBalance"
              >{#if $settingsStore.hideBalances || locallyHidden[wallet.id]}<HiddenMoney
                  {currency}
                  size="lg"
                />{:else}{formatDebtMoney(getBalance(wallet.id, currency), { currency })}{/if}</span
            >{/each}
          {#if currencies.length > 1 && currencies.every((currency) => getBalance(wallet.id, currency) === 0)}<span
              data-testId="WalletBalance"
              >{#if $settingsStore.hideBalances || locallyHidden[wallet.id]}<HiddenMoney size="lg" />{:else}0{/if}</span
            >{/if}
        </button>
        <div class="footer">
          {#if !wallet.archived}<a href={`/settings/wallets?action=transfer&to=${wallet.id}`}
              >{$translate('wallets.transfer')}</a
            >{:else}<span class="owner">{$translate('accounts.archived')}</span>{/if}
        </div>
      </div>
    </div>
  {/each}
  {#if !wallets.length}<a href="/settings/wallets" class="card dashed"
      ><Icon name="mdi:plus" />{$translate('wallets.new')}</a
    >{/if}
</div>

<style>
  .cards {
    padding: 1rem;
    min-width: 100%;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1rem;
    position: relative;
  }
  .cards::-webkit-scrollbar {
    display: none;
  }
  .card {
    scroll-snap-align: center;
    flex-shrink: 0;
    height: 15rem;
    width: 25rem;
    max-width: 100%;
    border-radius: 2rem;
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    background: var(--header-background-color);
    position: relative;
    box-shadow: 4px 4px 8px 0 rgba(127, 127, 127, 0.1);
  }
  .card-content {
    width: 100%;
    height: 100%;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }
  .card-heading {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .wallet-icon {
    border-radius: 100%;
    background: var(--background-color);
  }
  .name {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    text-decoration: none;
    color: var(--primary-text-color);
  }
  .name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .owner {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .options {
    color: var(--primary-text-color);
    min-width: 2.75rem;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .balance {
    border: 0;
    padding: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
  }
  .footer {
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }
  .footer a {
    color: var(--active-color);
    text-decoration: none;
    padding: 0.5rem;
  }
  .dashed {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    border-style: dashed;
    background: transparent;
    border-color: var(--active-color);
    color: var(--active-color);
    text-decoration: none;
  }
  @media (min-width: 27rem) {
    .card:first-child {
      margin-left: calc((100% - 25rem) / 2);
    }
    .card:last-child {
      margin-right: calc((100% - 25rem) / 2);
    }
  }
</style>
