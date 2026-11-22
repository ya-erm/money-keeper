<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { walletsStore } from '#lib/data/wallets.js';
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
  let selecting = false;
  let search = '';
  let unallocated: VirtualWallet;
  $: unallocated = { id: '', name: $translate('wallets.unallocated') };
  $: selected = $walletsStore.find((wallet) => wallet.id === walletId) ?? unallocated;
  $: names = new Map($participantHistoryStore.map((person) => [person.id, person.name]));
  $: choices = [
    unallocated,
    ...orderedItems(
      $walletsStore.filter((wallet) => !wallet.archived || wallet.id === walletId),
      $selectedParticipantStore?.walletsOrder,
    ),
  ].filter((wallet) =>
    `${wallet.name} ${names.get(wallet.participantId ?? '') ?? ''}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  function choose(id: string) {
    walletId = id;
    selecting = false;
  }
</script>

<div class="selector" data-testId={testId}>
  <InputLabel text={label} />
  <input type="hidden" {name} value={walletId} />
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
