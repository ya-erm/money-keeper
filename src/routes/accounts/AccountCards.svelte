<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import { accountsStore, currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import { getSearchParam, groupBySelector } from '$lib/utils';

  import AccountCard from './AccountCard.svelte';
  import { calculateBalance, findCurrencyRate, pastOperationsPredicate } from './utils';

  export let onEdit: (account: AccountViewModel) => void;

  $: accounts = $accountsStore;
  $: operations = $operationsStore;
  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: operationsByAccount = groupBySelector(operations, (t) => t.account.id);

  $: cardId = getSearchParam($page, 'account-card');

  let accountsContainerElement: Element;
  let accountListElement: Element;

  const scrollToCard = (id?: string | number) => {
    if (!id) return;
    const card = accountListElement.querySelector(`#account-card-${id}`);
    card?.scrollIntoView({ behavior: 'auto', inline: 'center' });
  };

  const handleScroll = async () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const index = accountListElement.scrollLeft / Math.min(26 * rem, accountsContainerElement.clientWidth - 1 * rem);
    if (Number.isInteger(index)) {
      if (index < accounts.length) {
        const id = accounts[index].id;
        if (`${id}` !== cardId) {
          await goto(`?account-card=${id}`, { noScroll: true });
        }
      }
    }
  };

  onMount(async () => {
    if (cardId) {
      scrollToCard(cardId);
    } else if (accounts.length) {
      // Select first account card by default
      await goto(`?account-card=${accounts[0].id}`, { noScroll: true });
    }
  });
</script>

<div class="accounts-container" bind:this={accountsContainerElement}>
  <div class="accounts-list" bind:this={accountListElement} on:scroll={handleScroll}>
    {#each accounts as account}
      <div class="account-card" on:click={() => scrollToCard(account.id)} aria-hidden>
        <AccountCard
          {account}
          balance={calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? [])}
          currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
          {onEdit}
        />
        <div id={`account-card-${account.id}`} class="account-card-anchor" />
      </div>
    {/each}
    {#if accounts.length === 0}
      <a id="create-account" href={'?action=create'} class="account-card dashed text-decoration-none">
        <span class="flex items-center gap-0.25">
          <Icon name="mdi:plus" />
          {$translate('accounts.create_account')}
        </span>
      </a>
    {/if}
  </div>
</div>

<style>
  .accounts-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .accounts-list {
    padding: 1rem;
    min-width: 100vw;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1rem;
  }
  .accounts-list::-webkit-scrollbar {
    display: none;
  }
  .account-card {
    scroll-snap-align: center;
    flex-shrink: 0;
    height: 15rem;
    width: 25rem;
    max-width: 100%;
    border-radius: 2rem;
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    background: var(--header-background-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    cursor: pointer;
    transition: box-shadow 0.2s;
    box-shadow: 4px 4px 8px 0px rgba(127, 127, 127, 0.1);
  }
  .account-card.dashed {
    border-style: dashed;
    background-color: transparent;
    border-color: var(--active-color);
    color: var(--active-color);
  }
  @media (hover: hover) {
    .account-card:hover {
      box-shadow: 4px 4px 8px 0px rgba(127, 127, 127, 0.2);
    }
  }
  @media (min-width: 27rem) {
    .account-card:first-child {
      margin-left: calc((100% - 25rem) / 2);
    }
    .account-card:last-child {
      margin-right: calc((100% - 25rem) / 2);
    }
  }
  .account-card-anchor {
    position: absolute;
    pointer-events: none;
    top: -1rem;
    bottom: -1rem;
    width: 100vw;
  }
</style>
