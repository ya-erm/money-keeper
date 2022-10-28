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

  const scrollToCard = (id: string | number) => {
    const card = accountListElement.querySelector(`#account-card-${id}`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  };

  onMount(() => {
    const hash = $page.url.hash;
    const id = hash.substring('#account-card-'.length);
    if (id) {
      scrollToCard(id);
    }
  });

  const handleClick = (id: number) => async () => {
    await goto(`${routes.accounts.path}#account-card-${id}`, { noscroll: true });
    scrollToCard(id);
  };
</script>

<div class="accounts-container">
  <div bind:this={accountListElement} class="accounts-list">
    {#each accounts as account}
      <div class="account-card" on:click={handleClick(account.id)} aria-hidden>
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
    gap: 1rem;
  }
  .accounts-list::-webkit-scrollbar {
    display: none;
  }
  .account-card {
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
