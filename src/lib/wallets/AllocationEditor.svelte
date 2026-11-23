<script lang="ts">
  import { tick } from 'svelte';
  import MultiSwitch from '@ya-erm/svelte-ui/MultiSwitch';
  import Input from '@ya-erm/svelte-ui/Input';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import { $initialized as dataInitialized } from '#lib/data/initialized.js';
  import type { WalletAllocation } from '#lib/data/interfaces.js';
  import { participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { memberSettingsStore } from '#lib/data/members.js';
  import { walletsStore } from '#lib/data/wallets.js';
  import { translate } from '#lib/translate/index.js';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import { fromMinor, toMinor } from '#lib/debts/calculations.js';
  import { orderedItems, splitEqually } from './calculations';
  import WalletSelector from './WalletSelector.svelte';

  export let allocation: WalletAllocation | undefined = undefined;
  export let currency: string;
  export let amount: number;
  export let useDefault = false;
  export let initialWalletId: string | null = null;
  type Mode = 'self' | 'other' | 'shared' | 'custom';
  let mode: Mode = 'custom';
  let initialized = false;
  let initializing = false;
  let previousAmount = amount;
  let automaticCustomWallet: string | null = null;
  $: participant = $selectedParticipantStore;
  $: people = $participantsStore.filter((person) => !person.archived);
  $: activeOwnerIds = new Set(people.map((person) => person.id));
  $: available = orderedItems(
    $walletsStore.filter((wallet) => !wallet.archived),
    participant?.walletsOrder,
  );
  $: ownWallet = participant ? available.find((wallet) => wallet.participantId === participant.id) : undefined;
  $: otherWallet = participant
    ? available.find(
        (wallet) =>
          wallet.participantId && activeOwnerIds.has(wallet.participantId) && wallet.participantId !== participant.id,
      )
    : undefined;
  $: other = people.find((person) => person.id === otherWallet?.participantId);
  $: rows = allocation?.shares ?? [];
  $: options = [
    ...(ownWallet && participant ? [{ id: 'self', title: participant.name }] : []),
    ...(otherWallet && other ? [{ id: 'other', title: other.name }] : []),
    ...(ownWallet && otherWallet ? [{ id: 'shared', title: $translate('wallets.shared_allocation') }] : []),
    { id: 'custom', title: '', icon: 'mdi:cog-outline' },
  ];
  $: remaining = fromMinor(
    toMinor(amount || 0, currency) - rows.reduce((sum, row) => sum + toMinor(row.amount || 0, currency), 0),
    currency,
  );
  $: void initialize(available, useDefault, $dataInitialized);
  async function initialize(choices: typeof available, _defaults: boolean, ready: boolean) {
    if (!ready || initialized || initializing || !choices.length) return;
    initializing = true;
    await tick();
    initializing = false;
    if (!$dataInitialized || initialized) return;
    initialized = true;
    previousAmount = amount;
    if (allocation) {
      const positive = allocation.shares.filter((share) => share.amount > 0);
      if (remaining === 0 && positive.length === 1 && positive[0].walletId === ownWallet?.id) mode = 'self';
      else if (remaining === 0 && positive.length === 1 && positive[0].walletId === otherWallet?.id) mode = 'other';
      else if (
        remaining === 0 &&
        positive.length === 2 &&
        ownWallet &&
        otherWallet &&
        positive.some((share) => share.walletId === ownWallet!.id) &&
        positive.some((share) => share.walletId === otherWallet!.id) &&
        Math.abs(toMinor(positive[0].amount, currency) - toMinor(positive[1].amount, currency)) <= 1
      )
        mode = 'shared';
      return;
    }
    if (!useDefault || !$memberSettingsStore?.walletsEnabled) return;
    if (initialWalletId && initialWalletId !== ownWallet?.id) {
      allocation = { shares: [{ walletId: initialWalletId, amount: amount || 0 }] };
      mode = 'custom';
      automaticCustomWallet = initialWalletId;
    } else
      choose(
        participant?.allocationPreset === 'equal'
          ? 'shared'
          : participant?.allocationPreset === 'other'
            ? 'other'
            : 'self',
      );
  }
  function choose(next: string) {
    automaticCustomWallet = null;
    mode = next as Mode;
    if (mode === 'custom') return;
    if ((mode === 'shared' && (!ownWallet || !otherWallet)) || (mode === 'other' && !otherWallet))
      mode = ownWallet ? 'self' : 'custom';
    if (mode === 'self' && !ownWallet) mode = 'custom';
    if (mode === 'custom') return;
    const choices =
      mode === 'shared' && ownWallet && otherWallet
        ? [ownWallet, otherWallet]
        : mode === 'other' && otherWallet
          ? [otherWallet]
          : ownWallet
            ? [ownWallet]
            : [];
    if (!choices.length) {
      mode = 'custom';
      return;
    }
    const amounts = splitEqually(amount || 0, choices.length, currency);
    allocation = { shares: choices.map((wallet, index) => ({ walletId: wallet.id, amount: amounts[index] })) };
  }
  $: updateAmount(amount);
  function updateAmount(value: number) {
    if (initialized && value !== previousAmount) {
      if (mode !== 'custom') choose(mode);
      else if (automaticCustomWallet)
        allocation = { shares: [{ walletId: automaticCustomWallet, amount: value || 0 }] };
    }
    previousAmount = value;
  }
  function changeAmount(index: number, value: string | null) {
    automaticCustomWallet = null;
    allocation = { shares: rows.map((share, i) => (i === index ? { ...share, amount: Number(value || 0) } : share)) };
  }
  function changeWallet(index: number, walletId: string) {
    automaticCustomWallet = null;
    allocation = { shares: rows.map((share, i) => (i === index ? { ...share, walletId } : share)) };
  }
  function add() {
    automaticCustomWallet = null;
    const wallet = available.find((wallet) => !rows.some((row) => row.walletId === wallet.id));
    if (wallet) allocation = { shares: [...rows, { walletId: wallet.id, amount: Math.max(0, remaining) }] };
  }
  function remove(index: number) {
    automaticCustomWallet = null;
    const shares = rows.filter((_, i) => i !== index);
    allocation = shares.length ? { shares } : undefined;
  }
  function equal() {
    automaticCustomWallet = null;
    const amounts = splitEqually(amount || 0, rows.length, currency);
    allocation = { shares: rows.map((share, index) => ({ ...share, amount: amounts[index] })) };
  }
  function labelSettings(node: HTMLElement, label: string) {
    let disposed = false;
    let previous: Element | null = null;
    async function apply() {
      await tick();
      if (disposed) return;
      const button = node.querySelector('[data-testid="WalletAllocationMode.Button.custom"]');
      if (previous && previous !== button) {
        previous.removeAttribute('aria-label');
        previous.removeAttribute('title');
      }
      button?.setAttribute('aria-label', label);
      button?.setAttribute('title', label);
      previous = button;
    }
    void apply();
    return {
      update: (next: string) => {
        label = next;
        void apply();
      },
      destroy: () => {
        disposed = true;
      },
    };
  }
</script>

{#if ($memberSettingsStore?.walletsEnabled && available.length) || rows.length}
  <section class="allocation" data-testId="WalletAllocation" aria-label={$translate('wallets.allocation')}>
    <InputLabel text={$translate('wallets.allocation')} />
    <div class="presets" use:labelSettings={$translate('wallets.allocation_settings')}>
      <MultiSwitch
        {options}
        selected={options.find((option) => option.id === mode)}
        onChange={(option) => choose(option.id)}
        testId="WalletAllocationMode"
        ariaLabel={$translate('wallets.allocation')}
      />
    </div>
    {#if mode === 'custom'}
      <div class="shares" data-testId="WalletAllocationSettings">
        {#each rows as row, index (row.walletId)}
          <div class="share">
            <WalletSelector
              name={`allocation-wallet-${index}`}
              label=""
              compact
              allowUnallocated={false}
              walletId={row.walletId}
              excludedWalletIds={rows.filter((_, i) => i !== index).map((share) => share.walletId)}
              onSelect={(id) => changeWallet(index, id)}
              testId={`AllocationWallet.${index}`}
            />
            <Input
              type="number"
              inputmode="decimal"
              min="0"
              step="any"
              aria-label={$translate('transactions.amount')}
              placeholder="0"
              value={row.amount ? String(row.amount) : ''}
              onChange={(value) => changeAmount(index, value)}
              clearable
              translate={$translate}
              testId={`AllocationAmount.${index}`}
            />
            <Button
              appearance="transparent"
              aria-label={$translate('common.delete')}
              onClick={() => remove(index)}
              testId={`RemoveAllocation.${index}`}><Icon name="mdi:delete-outline" size={1.25} /></Button
            >
          </div>
        {/each}
        <div class="actions">
          <Button
            appearance="link"
            onClick={add}
            disabled={rows.length >= available.length}
            text={$translate('wallets.add_share')}
          />
          {#if rows.length > 1}<Button appearance="link" onClick={equal} text={$translate('wallets.equal')} />{/if}
          {#if rows.length}<Button
              appearance="link"
              onClick={() => {
                automaticCustomWallet = null;
                allocation = undefined;
              }}
              text={$translate('wallets.no_allocation')}
            />{/if}
        </div>
        <div
          class="hint"
          class:overallocated={remaining < 0}
          aria-live="polite"
          data-testId="UnallocatedOperationAmount"
        >
          {$translate('wallets.remaining')}: {formatDebtMoney(remaining, { currency })}
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  .allocation {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .presets {
    min-width: 0;
  }
  .presets :global(.multi-switch) {
    width: 100%;
  }
  .presets :global(.switch-item) {
    flex: 1;
    padding: 0.5rem;
    white-space: nowrap;
  }
  .presets :global(.switch-item.with-icon) {
    flex: 0 0 2.75rem;
  }
  .shares {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .share {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) 2.5rem;
    gap: 0.4rem;
    align-items: center;
    min-width: 0;
  }
  .share :global(button.transparent) {
    padding: 0.25rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  .overallocated {
    color: var(--red-color);
  }
</style>
