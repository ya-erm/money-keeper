<script lang="ts">
  import { $initialized as dataInitialized } from '#lib/data/initialized.js';
  import { goto } from '$app/navigation';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { page } from '#lib/page.js';
  import { accountsStore, categoriesStore, operationsStore } from '#lib/data/index.js';
  import { accountsService } from '#lib/data/accounts.js';
  import {
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  } from '#lib/data/categories.js';
  import { participantsService, participantHistoryStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { walletsStore, walletTransfersStore } from '#lib/data/wallets.js';
  import type { VirtualWallet, Participant } from '#lib/data/interfaces.js';
  import { orderedItems, walletEntries, walletBalance } from '#lib/wallets/calculations.js';
  import WalletListItem from '#lib/wallets/WalletListItem.svelte';
  import WalletListButtons from '#lib/wallets/WalletListButtons.svelte';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  let search = '';
  let items: VirtualWallet[] = [];
  let draftOpen = false;
  let sortingParticipantId: string | null = null;
  let hiddenIds: string[] = [];
  let busy = false;
  $: participant = $selectedParticipantStore;
  $: sortable = $dataInitialized && $page.url.searchParams.get('action') === 'sort' && !!participant;
  $: ordered = orderedItems($walletsStore, participant?.walletsOrder);
  $: filtered = ordered.filter(
    (wallet) =>
      !search ||
      `${wallet.name} ${ownerName(wallet.participantId)}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  $: archived = filtered.filter((wallet) => wallet.archived);
  $: syncDraft(sortable, ordered, filtered, participant);
  function syncDraft(
    sorting: boolean,
    all: VirtualWallet[],
    matching: VirtualWallet[],
    participant: Participant | null,
  ) {
    if (sorting && !draftOpen) {
      sortingParticipantId = participant?.id ?? null;
      items = all.filter((wallet) => !wallet.archived);
      hiddenIds = [...(participant?.hiddenWalletIds ?? [])];
    } else if (!sorting) {
      items = matching.filter((wallet) => !wallet.archived);
    }
    draftOpen = sorting;
  }
  $: allAccounts = [...$accountsStore, ...accountsService.deletedItems];
  $: allCategories = [
    ...$categoriesStore,
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  ];
  $: currencies = [
    ...new Set([
      ...allAccounts.map((account) => account.currency),
      ...$walletTransfersStore.map((transfer) => transfer.currency),
    ]),
  ];
  $: balances = new Map(
    $walletsStore.map((wallet) => {
      const entries = walletEntries(wallet, $operationsStore, allCategories, allAccounts, $walletTransfersStore);
      return [wallet.id, currencies.map((currency) => ({ currency, amount: walletBalance(entries, currency) }))];
    }),
  );
  function ownerName(id?: string) {
    return id ? ($participantHistoryStore.find((item) => item.id === id)?.name ?? '…') : $translate('wallets.shared');
  }
  $: displayHiddenIds = sortable ? hiddenIds : (participant?.hiddenWalletIds ?? []);
  function toggleHidden(id: string) {
    hiddenIds = hiddenIds.includes(id) ? hiddenIds.filter((value) => value !== id) : [...hiddenIds, id];
  }
  function reordered(event: CustomEvent<DndEvent<VirtualWallet>>) {
    items = event.detail.items;
  }
  async function save() {
    if (busy || !sortingParticipantId) return;
    busy = true;
    try {
      const current = participantsService.getById(sortingParticipantId);
      if (!current) throw new Error('Participant is no longer available');
      const ids = items.map((item) => item.id);
      await participantsService.save({
        ...current,
        walletsOrder: [...ids, ...ordered.filter((wallet) => !ids.includes(wallet.id)).map((wallet) => wallet.id)],
        hiddenWalletIds: hiddenIds,
      });
      await goto('/wallets/list', { replace: true });
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
</script>

<Layout title={$translate('wallets.title')} onBack={() => goto('/wallets')} rightSlot={WalletListButtons}>
  <div class="wallet-list" data-testId="WalletList">
    {#if !participant}<p><a href="/settings/participants">{$translate('wallets.choose_for_sorting')}</a></p>{/if}
    {#if sortable}
      <div class="sorting-bar">
        <span class="caption">{$translate('common.sorting')}<small>{participant?.name}</small></span>
        <div class="grid-col-2 gap-1">
          <Button color="white" disabled={busy} onClick={() => goto('/wallets/list', { replace: true })}
            >{$translate('common.cancel')}</Button
          ><Button disabled={busy} onClick={save}>{$translate('common.save')}</Button>
        </div>
      </div>
    {:else}<Input bind:value={search} placeholder={$translate('common.search')} clearable />{/if}
    <ul
      class="items"
      data-testId="WalletSortList"
      use:dndzone={{ items, dragDisabled: !sortable || busy, dropTargetStyle: {}, flipDurationMs: 200 }}
      on:consider={reordered}
      on:finalize={reordered}
    >
      {#each items as wallet (wallet.id)}<li
          class:personal-hidden={displayHiddenIds.includes(wallet.id)}
          data-id={wallet.id}
          aria-label={wallet.name}
          animate:flip={{ duration: 200 }}
        >
          <div class="row-content">
            <WalletListItem
              {wallet}
              ownerName={ownerName(wallet.participantId)}
              balances={balances.get(wallet.id) ?? []}
              draggable={sortable}
              onClick={() => goto(`/wallets?wallet=${encodeURIComponent(wallet.id)}`)}
            />
          </div>
          {#if sortable}<button
              class="visibility-button"
              type="button"
              disabled={busy}
              aria-label={`${$translate(displayHiddenIds.includes(wallet.id) ? 'common.show' : 'common.hide')} ${wallet.name}`}
              aria-pressed={displayHiddenIds.includes(wallet.id)}
              on:click|stopPropagation={() => toggleHidden(wallet.id)}
              on:keydown|stopPropagation
              ><Icon
                name={displayHiddenIds.includes(wallet.id) ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                size={1.25}
              /></button
            >{/if}
        </li>{/each}
    </ul>
    {#if !items.length}<p>{$translate('wallets.no_wallets')}</p>{/if}
    {#if archived.length && !sortable}<details>
        <summary>{$translate('wallets.archived')}</summary>
        <ul class="items">
          {#each archived as wallet (wallet.id)}<li>
              <WalletListItem
                {wallet}
                ownerName={ownerName(wallet.participantId)}
                balances={balances.get(wallet.id) ?? []}
                onClick={() => goto(`/wallets?wallet=${encodeURIComponent(wallet.id)}`)}
              />
            </li>{/each}
        </ul>
      </details>{/if}
  </div>
</Layout>

<style>
  .wallet-list {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .row-content {
    flex: 1;
    min-width: 0;
  }
  .personal-hidden .row-content {
    opacity: 0.5;
    filter: grayscale(1);
  }
  .visibility-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    background: var(--header-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
  }
  .sorting-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    background: var(--background-color);
    position: sticky;
    top: 0;
    z-index: 1;
    padding-bottom: 0.5rem;
  }
  .caption {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  small {
    color: var(--secondary-text-color);
  }
  p {
    margin: 0;
  }
  a {
    color: var(--active-color);
  }
  summary {
    padding: 0.5rem 0;
    cursor: pointer;
  }
</style>
