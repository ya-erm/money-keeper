<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { backLink } from '$lib/ui/header';

  import type { PageData } from './$types';
  import AccountCard from './AccountCard.svelte';

  backLink.set(null);

  export let data: PageData;
  $: accounts = data.accounts;

  let accountListElement: Element;

  const scrollToCard = (id?: string | number) => {
    if (!id) return;
    const card = accountListElement.querySelector(`#account-card-${id}`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  };

  $: cardId = $page.url.hash.match(/\#account-card-(\d+)/)?.[1];

  onMount(() => {
    scrollToCard(cardId);
  });

  const handleScroll = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const index = accountListElement.scrollLeft / (26 * rem);
    if (Number.isInteger(index) && !!accounts[index]) {
      const id = accounts[index]?.id;
      if (`${id}` !== cardId) {
        goto(`${routes.accounts.path}#account-card-${id}`, { noscroll: true });
      }
    }
  };
</script>

<div class="accounts-container">
  <div class="accounts-list" bind:this={accountListElement} on:scroll={handleScroll}>
    {#each accounts as account}
      <div class="account-card" on:click={() => scrollToCard(account.id)} aria-hidden>
        <AccountCard {account} />
        <div id={`account-card-${account.id}`} class="account-card-anchor" />
      </div>
    {/each}
    <a class="account-card" href={routes['accounts.create'].path}>
      {$translate('accounts.create_account')}
    </a>
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
  .account-card:hover {
    box-shadow: 4px 4px 8px 0px rgba(127, 127, 127, 0.2);
  }
  .account-card:first-child {
    margin-left: calc((100% - 25rem) / 2);
  }
  .account-card:last-child {
    margin-right: calc((100% - 25rem) / 2);
  }
  .account-card-anchor {
    position: absolute;
    pointer-events: none;
    top: 0;
    bottom: 0;
    width: 100vw;
  }
</style>
