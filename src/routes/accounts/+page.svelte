<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';

  import type { TransactionWithCategory } from '$lib/interfaces';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import { backLink, rightButton } from '$lib/ui/header';
  import Icon from '$lib/ui/Icon.svelte';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';

  import type { PageData } from './$types';
  import AccountCard from './AccountCard.svelte';
  import AddAccountButton from './AddAccountButton.svelte';

  backLink.set(null);
  rightButton.set(AddAccountButton);
  onDestroy(() => rightButton.set(null));

  export let data: PageData;
  $: accounts = data.accounts;

  let accountListElement: Element;

  const scrollToCard = (id?: string | number) => {
    if (!id) return;
    const card = accountListElement.querySelector(`#account-card-${id}`);
    card?.scrollIntoView({ behavior: 'auto', inline: 'center' });
  };

  $: cardId = $page.url.hash.match(/\#account-card-(\d+)/)?.[1];
  $: account = accounts.find((x) => x.id.toString() === cardId);
  $: groups = (account?.transactions ?? []).reduce((res, t) => {
    const date = t.date.toISOString().substring(0, 10);
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {} as { [key: string]: TransactionWithCategory[] });

  onMount(() => {
    if (cardId) {
      scrollToCard(cardId);
    } else if (!!accounts.length) {
      goto(`${routes.accounts.path}#account-card-${accounts[0].id}`, { noscroll: true });
    }
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

<div class="p-1">
  <h3 style:font-weight="normal" class="mt-0">{$translate('transactions.title')}</h3>
  <a class="flex-col" href={`${routes['transactions.create'].path}?accountId=${cardId}`}>
    <Button>
      <Icon name="mdi:plus" />
      {$translate('transactions.new_transaction')}
    </Button>
  </a>
  {#if !!account?.transactions?.length}
    <div class="mt-1 flex-col gap-1">
      {#each Object.entries(groups) as [date, transactions] (date)}
        <div>{date}</div>
        {#each transactions as transaction (transaction.id)}
          <TransactionListItem hideAccount transaction={{ ...transaction, account }} />
        {/each}
      {/each}
    </div>
  {/if}
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
  .account-card:hover {
    box-shadow: 4px 4px 8px 0px rgba(127, 127, 127, 0.2);
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
