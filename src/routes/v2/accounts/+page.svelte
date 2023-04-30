<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';

  import { mainService, accountsService, currencyRatesService } from '$lib/data';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { backLink, rightButton, title } from '$lib/ui/header';
  import { useRightButton, useTitle } from '$lib/ui/header/model';
  import { getSearchParam } from '$lib/utils';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';

  import type { TransactionViewModel } from '$lib/data/interfaces';
  import dayjs from 'dayjs';
  import AccountsButton from './AccountButtons.svelte';
  import AccountCard from './AccountCard.svelte';
  import AddOperationButton from './AddOperationButton.svelte';

  backLink.set(null);
  useTitle($translate('accounts.title'));
  useRightButton(AccountsButton);

  const accountsStore = accountsService.$accounts;
  const transactionsStore = mainService.$transactions;
  const currencyRatesStore = currencyRatesService.$currencyRates;

  // TODO: settings
  const settings = { currency: 'RUB' };
  $: accounts = $accountsStore;
  $: transactions = $transactionsStore;
  $: currencyRates = $currencyRatesStore;

  $: transactionsByAccount = transactions.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    if (!res[t.accountId]) res[t.accountId] = [];
    res[t.accountId].push(t);
    return res;
  }, {});

  let accountsContainerElement: Element;
  let accountListElement: Element;

  const scrollToCard = (id?: string | number) => {
    if (!id) return;
    const card = accountListElement.querySelector(`#account-card-${id}`);
    card?.scrollIntoView({ behavior: 'auto', inline: 'center' });
  };

  let search: string = '';

  $: cardId = getSearchParam($page, 'account-card');
  $: account = accounts.find((x) => x.id.toString() === cardId);
  $: accountTransactions = !!account ? transactions.filter((t) => t.accountId === account?.id) : null;
  $: filteredTransactions =
    (accountTransactions ?? transactions).filter(
      (t) =>
        !search ||
        t.comment?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        t.date.substring(0, 10).includes(search) ||
        `${t.amount} ${account?.currency}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  $: groups = filteredTransactions.reduce((res: { [key: string]: TransactionViewModel[] }, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {});

  const findCurrencyRate = (mainCurrency?: string | null, currency?: string | null) =>
    mainCurrency && currency && mainCurrency !== currency
      ? currencyRates.find(
          ({ cur1, cur2 }) => [cur1, cur2].includes(mainCurrency) && [cur1, cur2].includes(currency),
        ) ?? null
      : null;

  $: currencyRate = findCurrencyRate(settings?.currency, account?.currency ?? '');

  onMount(() => {
    if (cardId) {
      scrollToCard(cardId);
    } else if (!!accounts.length) {
      goto(`?account-card=${accounts[0].id}`, { noScroll: true });
    }
  });

  const handleScroll = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const index = accountListElement.scrollLeft / Math.min(26 * rem, accountsContainerElement.clientWidth - 1 * rem);
    if (Number.isInteger(index)) {
      if (index === accounts.length) {
        // TODO: refactor it
        goto(`#create-account`, { noScroll: true });
      } else if (!!accounts[index]) {
        const id = accounts[index].id;
        if (`${id}` !== cardId) {
          goto(`?account-card=${id}`, { noScroll: true });
        }
      }
    }
  };

  let header: 'accounts' | 'operations' = 'accounts';
  function handlePageScroll(e: Event) {
    const scrollTop = (e.target as HTMLElement).scrollTop;
    const operationsContainerPosition = accountsContainerElement.clientHeight + 38;
    if (scrollTop > operationsContainerPosition && header !== 'operations') {
      title.set($translate('transactions.title'));
      rightButton.set(AddOperationButton);
      header = 'operations';
    } else if (scrollTop < operationsContainerPosition && header !== 'accounts') {
      title.set($translate('accounts.title'));
      rightButton.set(AccountsButton);
      header = 'accounts';
    }
  }
  onDestroy(() => title.set(null));
</script>

<div class="container" on:scroll={handlePageScroll}>
  <div class="accounts-container" bind:this={accountsContainerElement}>
    <div class="accounts-list" bind:this={accountListElement} on:scroll={handleScroll}>
      {#each accounts as account}
        <div class="account-card" on:click={() => scrollToCard(account.id)} aria-hidden>
          <AccountCard {account} balance={-1} currencyRate={findCurrencyRate(settings?.currency, account.currency)} />
          <div id={`account-card-${account.id}`} class="account-card-anchor" />
        </div>
      {/each}
      <a id="create-account" href={route('accounts.create')} class="account-card dashed text-decoration-none">
        <span class="flex items-center gap-0.25">
          <Icon name="mdi:plus" />
          {$translate('accounts.create_account')}
        </span>
      </a>
    </div>
  </div>

  <div class="operations-container p-1">
    <div class="flex gap-1">
      <h3 style:font-weight="normal" class="m-0 flex-grow">{$translate('transactions.title')}</h3>
      <a href={`${route('transactions.create')}?accountId=${cardId}`}>{$translate('common.add')}</a>
    </div>
    <div class="operations-search-container flex gap-0.5">
      <div class="flex-grow">
        <Input bind:value={search} placeholder={$translate('common.search')} clearable />
      </div>
      <!-- <Button appearance="transparent" bordered>
      <Icon size={1.25} name="mdi:filter" />
    </Button> -->
    </div>
    <ul class="operations-list mt-1 flex-col gap-1">
      {#each Object.entries(groups) as [date, transactions] (date)}
        <div>{dayjs(date).format('DD MMMM YYYY')}</div>
        {#each transactions as transaction (transaction.id)}
          <TransactionListItem
            hideAccount={!!account}
            currencyRate={currencyRate ?? findCurrencyRate(settings?.currency, transaction.account.currency)}
            {transaction}
          />
        {/each}
      {/each}
    </ul>
  </div>
</div>

<style>
  .container {
    height: 100%;
    overflow-y: auto;
  }
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

  .operations-search-container {
    padding: 1rem 0;
    background: var(--background-color);
    position: relative;
  }

  .operations-search-container::before {
    content: '';
    position: absolute;
    pointer-events: none;
    background: linear-gradient(to top, rgba(255, 255, 255, 0) 50%, var(--background-color));
    left: 0;
    right: 0;
    height: 2rem;
    bottom: -2rem;
  }

  .operations-list {
    list-style: none;
    padding: 0;
  }
</style>
