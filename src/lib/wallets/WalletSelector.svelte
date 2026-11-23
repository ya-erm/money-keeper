<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { walletsStore, walletsService } from '#lib/data/wallets.js';
  import { participantHistoryStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { translate } from '#lib/translate/index.js';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import WalletListItem from './WalletListItem.svelte';
  import { walletOverviewStore } from './overview.js';
  import { orderedItems } from './calculations.js';

  export let name: string;
  export let label: string;
  export let walletId = '';
  export let testId: string;
  export let disabled = false;
  export let compact = false;
  export let allowUnallocated = true;
  export let excludedWalletIds: string[] = [];
  export let onSelect: ((id: string) => void) | null = null;
  let selecting = false;
  let search = '';
  let unallocated: VirtualWallet;
  $: unallocated = { id: '', name: $translate('wallets.unallocated') };
  $: selected =
    $walletsStore.find((wallet) => wallet.id === walletId) ??
    walletsService.deletedItems.find((wallet) => wallet.id === walletId) ??
    unallocated;
  $: names = new Map($participantHistoryStore.map((person) => [person.id, person.name]));
  $: choices = [
    ...(allowUnallocated ? [unallocated] : []),
    ...orderedItems(
      $walletsStore.filter(
        (wallet) =>
          (!wallet.archived || wallet.id === walletId) &&
          (!excludedWalletIds.includes(wallet.id) || wallet.id === walletId),
      ),
      $selectedParticipantStore?.walletsOrder,
    ),
  ].filter((wallet) =>
    `${wallet.name} ${names.get(wallet.participantId ?? '') ?? ''}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  function choose(id: string) {
    walletId = id;
    onSelect?.(id);
    selecting = false;
  }
</script>

<div class="selector" data-testId={testId}>
  {#if label}<InputLabel text={label} />{/if}
  <input type="hidden" {name} value={walletId} />
  {#if compact}
    <button
      type="button"
      class="compact-select"
      {disabled}
      aria-label={`${$translate('wallets.wallet')}: ${selected.name}`}
      on:click={() => {
        search = '';
        selecting = true;
      }}
    >
      <Icon name={selected.icon || 'mdi:wallet-outline'} size={1.15} /><span>{selected.name}</span><Icon
        name="mdi:chevron-down"
        size={0.9}
      />
    </button>
  {:else}
    <WalletListItem
      wallet={selected}
      ownerName={walletId ? (names.get(selected.participantId ?? '') ?? $translate('wallets.shared')) : ''}
      balances={$walletOverviewStore.get(walletId) ?? []}
      {disabled}
      ariaLabel={`${label}: ${selected.name}`}
      onClick={() => {
        search = '';
        selecting = true;
      }}
    >
      <Icon slot="end" name="mdi:chevron-right" />
    </WalletListItem>
  {/if}
</div>

<SubScreen
  visible={selecting}
  title={$translate('wallets.select_wallet')}
  onBack={() => (selecting = false)}
  testId={`${testId}.Portal`}
>
  <div class="choices">
    <Input bind:value={search} placeholder={$translate('common.search')} clearable />
    {#each choices as wallet (wallet.id)}
      <WalletListItem
        {wallet}
        ownerName={wallet.id ? (names.get(wallet.participantId ?? '') ?? $translate('wallets.shared')) : ''}
        balances={$walletOverviewStore.get(wallet.id) ?? []}
        onClick={() => choose(wallet.id)}
      />
    {/each}
    {#if !choices.length}<p>{$translate('wallets.no_wallets')}</p>{/if}
  </div>
</SubScreen>

<style>
  .selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .compact-select {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
    min-width: 0;
    min-height: 2.5rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font: inherit;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .compact-select span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }
  .compact-select :global(svg) {
    flex-shrink: 0;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  p {
    margin: 0;
  }
</style>
