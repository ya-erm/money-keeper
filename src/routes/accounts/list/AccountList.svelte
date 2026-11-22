<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { participantsService, selectedParticipantStore } from '#lib/data/participants.js';
  import { flip } from 'svelte/animate';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import Spoiler from '@ya-erm/svelte-ui/Spoiler';
  import SpoilerToggle from '@ya-erm/svelte-ui/SpoilerToggle';

  import { currencyRatesStore, memberSettingsStore, membersService, operationsStore } from '#lib/data/index.js';
  import type { Account, AccountViewModel, Participant } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import { calculateBalance, findCurrencyRate, groupBySelector, pastOperationsPredicate } from '#lib/utils/index.js';

  import { hideZeroBalanceAccounts } from './store';

  import AccountListItem from './AccountListItem.svelte';
  import Filters from './Filters.svelte';

  export let accounts: AccountViewModel[];
  export let onClick: (account: Account) => void = () => {};
  export let sortable = false;

  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: operationsByAccount = groupBySelector($operationsStore, (t) => t.account.id);

  let showFilters = false;

  let search: string = '';
  let selectedTags: string[] = [];
  let selectedCurrencies: string[] = [];

  $: filteredAccounts = sortable
    ? accounts
    : accounts
        .filter((account) => {
          const balance = calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? []);
          return $hideZeroBalanceAccounts ? Number(balance.toFixed(8)) !== 0 : true;
        })
        .filter((account) => !selectedTags.length || selectedTags.some((tagId) => account.tagIds?.includes(tagId)))
        .filter((account) => !selectedCurrencies.length || selectedCurrencies.some((cur) => account.currency === cur))
        .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()));

  $: archivedAccounts = filteredAccounts.filter((account) => account.archived);

  let sortedAccounts: AccountViewModel[] = [];
  let draftOpen = false;
  let sortingParticipantId: string | null = null;
  let busy = false;
  $: syncDraft(sortable, accounts, filteredAccounts, $selectedParticipantStore);
  function syncDraft(
    sorting: boolean,
    all: AccountViewModel[],
    filtered: AccountViewModel[],
    participant: Participant | null,
  ) {
    if (sorting && !draftOpen) {
      sortingParticipantId = participant?.id ?? null;
      sortedAccounts = all.filter((account) => !account.archived);
    } else if (!sorting) {
      sortedAccounts = filtered.filter((account) => !account.archived);
    }
    draftOpen = sorting;
  }

  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent<DndEvent<AccountViewModel>>) {
    sortedAccounts = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<AccountViewModel>>) {
    sortedAccounts = e.detail.items;
  }

  async function saveAccountsOrder() {
    if (busy) return;
    busy = true;
    try {
      const ids = sortedAccounts.map((account) => account.id);
      const accountsOrder = [
        ...ids,
        ...accounts.filter((account) => !ids.includes(account.id)).map((account) => account.id),
      ];
      if (sortingParticipantId) {
        const current = participantsService.getById(sortingParticipantId);
        if (!current) throw new Error('Participant is no longer available');
        await participantsService.save({ ...current, accountsOrder });
      } else {
        await membersService.saveAccountsOrder(accountsOrder);
      }
      sortable = false;
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
  function restoreAccountsOrder() {
    if (!busy) sortable = false;
  }

  let scrollTop = 0;

  let archivedHidden = true;
</script>

<div on:scroll={(e) => (scrollTop = e.currentTarget.scrollTop)} class="accounts-list pb-1 flex-col">
  <div class="header py-1" class:sticky={sortable} class:bordered={scrollTop > 0}>
    {#if sortable}
      <div class="sorting flex-center px-1 gap-1">
        <span class="sorting-caption"
          >{$translate('common.sorting')}{#if $selectedParticipantStore}<small>{$selectedParticipantStore.name}</small
            >{/if}</span
        >
        <div class="grid-col-2 gap-1">
          <Button color="white" onClick={restoreAccountsOrder} disabled={busy}>
            {$translate('common.cancel')}
          </Button>
          <Button color="primary" onClick={saveAccountsOrder} disabled={busy}>
            {$translate('common.save')}
          </Button>
        </div>
      </div>
    {:else}
      <div class="search-and-filters">
        <div class="flex px-1 gap-1">
          <div class="flex-grow">
            <Input bind:value={search} placeholder={$translate('common.search')} clearable />
          </div>
          <Button color={showFilters ? 'primary' : 'white'} bordered onClick={() => (showFilters = !showFilters)}>
            <Icon size={1.25} name="mdi:filter" />
            {#if selectedTags.length || selectedCurrencies.length || $hideZeroBalanceAccounts}
              <span class="filter-badge"></span>
            {/if}
          </Button>
        </div>
        <Spoiler hidden={sortable || !showFilters}>
          <div class="px-1 pt-1">
            <Filters {accounts} bind:selectedTags bind:selectedCurrencies />
          </div>
        </Spoiler>
      </div>
    {/if}
  </div>

  {#if accounts.length === 0}
    <span class="no-data">{$translate('accounts.no_data')}</span>
  {/if}

  <ul
    class="flex-col gap-1 px-1"
    data-testId="AccountSortList"
    use:dndzone={{
      items: sortedAccounts,
      dragDisabled: !sortable || busy,
      dropTargetStyle: {},
      flipDurationMs,
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    on:contextmenu|preventDefault
  >
    {#each sortedAccounts as account (account.id)}
      <li
        class="management-row"
        animate:flip={{ duration: flipDurationMs }}
        data-id={account.id}
        aria-label={account.name}
      >
        <div class="row-content">
          <AccountListItem
            {account}
            {onClick}
            currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
            balance={calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? [])}
            draggable={sortable}
          />
        </div>
      </li>
    {/each}
  </ul>

  {#if archivedAccounts.length > 0}
    <Spoiler hidden={archivedHidden}>
      <div slot="spoiler-header" class="mt-1 px-1">
        <SpoilerToggle bind:hidden={archivedHidden} translate={$translate}>
          <div class="ml-0.5 flex items-center gap-0.5">
            <Icon name="ri:archive-line" size={1.5} />
            <span class="text-ellipsis-all">{$translate('accounts.archived_accounts')}</span>
          </div>
        </SpoilerToggle>
      </div>
      <ul class="flex-col gap-1 pt-1 px-1">
        {#each archivedAccounts as account (account.id)}
          <li animate:flip={{ duration: flipDurationMs }}>
            <AccountListItem
              {account}
              {onClick}
              currencyRate={findCurrencyRate(currencyRates, settings?.currency, account.currency)}
              balance={calculateBalance(operationsByAccount[account.id]?.filter(pastOperationsPredicate()) ?? [])}
            />
          </li>
        {/each}
      </ul>
    </Spoiler>
  {/if}
</div>

<style>
  .management-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .row-content {
    flex: 1;
    min-width: 0;
  }

  .sorting-caption {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .sorting-caption small {
    color: var(--secondary-text-color);
  }
  .no-data {
    text-align: center;
    color: var(--secondary-text-color);
  }
  .accounts-list {
    overflow-x: hidden;
    height: 100%;
  }
  .sticky {
    position: sticky;
    top: 0;
  }
  .header {
    display: flex;
    background: var(--background-color);
    border-bottom: 1px solid transparent;
    transition: border 0.3s;
  }
  .header.sticky.bordered {
    border-bottom: 1px solid var(--border-color);
  }
  .header > div {
    width: 100%;
    min-width: 0;
  }
  .filter-badge {
    background: var(--active-color);
    border-radius: 100%;
    width: 8px;
    height: 8px;
    position: absolute;
    transform: translate(10px, 10px);
  }
  ul {
    list-style: none;
    margin: 0;
  }
</style>
