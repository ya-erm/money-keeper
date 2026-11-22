<script lang="ts">
  import type { WalletAllocation } from '#lib/data/interfaces.js';
  import { selectedParticipantStore } from '#lib/data/participants.js';
  import { memberSettingsStore } from '#lib/data/members.js';
  import { walletsService, walletsStore } from '#lib/data/wallets.js';
  import { translate } from '#lib/translate/index.js';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import { fromMinor, toMinor } from '#lib/debts/calculations.js';
  import { orderedItems, splitEqually } from './calculations';

  export let allocation: WalletAllocation | undefined = undefined;
  export let currency: string;
  export let amount: number;
  export let useDefault = false;
  export let initialWalletId: string | null = null;
  let initialized = false;
  let previousAmount = amount;
  let automaticSingle = useDefault && !allocation;
  let automaticEqual = false;
  $: participant = $selectedParticipantStore;
  $: available = orderedItems(
    $walletsStore.filter((wallet) => !wallet.archived && !participant?.hiddenWalletIds?.includes(wallet.id)),
    participant?.walletsOrder,
  );
  $: rows = allocation?.shares ?? [];
  $: firstWallet = available.find((wallet) => wallet.id === initialWalletId) ?? available[0];
  $: otherWallet = available.find(
    (wallet) => wallet.participantId && wallet.participantId !== participant?.id && wallet.id !== firstWallet?.id,
  );
  $: remaining = fromMinor(
    toMinor(amount || 0, currency) - rows.reduce((sum, row) => sum + toMinor(row.amount || 0, currency), 0),
    currency,
  );
  $: initialize(available, useDefault);
  function initialize(choices: typeof available, defaults: boolean) {
    if (!initialized && choices.length && ($memberSettingsStore?.walletsEnabled || allocation)) {
      initialized = true;
      if (defaults && !allocation) {
        const first = choices.find((wallet) => wallet.id === initialWalletId) ?? choices[0];
        const other = choices.find(
          (wallet) => wallet.participantId && wallet.participantId !== participant?.id && wallet.id !== first.id,
        );
        if (!initialWalletId && participant?.allocationPreset === 'equal' && other) {
          const values = splitEqually(amount || 0, 2, currency);
          allocation = {
            shares: [
              { walletId: first.id, amount: values[0] },
              { walletId: other.id, amount: values[1] },
            ],
          };
          automaticEqual = true;
        } else {
          allocation = {
            shares: [
              {
                walletId: !initialWalletId && participant?.allocationPreset === 'other' && other ? other.id : first.id,
                amount: amount || 0,
              },
            ],
          };
        }
        automaticSingle = true;
      }
    }
  }
  $: updateAmount(amount);
  function updateAmount(value: number) {
    if (automaticSingle && value !== previousAmount && allocation?.shares.length === 1) {
      allocation = { shares: [{ walletId: allocation.shares[0].walletId, amount: value || 0 }] };
    }
    if (automaticEqual && value !== previousAmount && allocation?.shares.length) {
      const amounts = splitEqually(value || 0, allocation.shares.length, currency);
      allocation = { shares: allocation.shares.map((share, index) => ({ ...share, amount: amounts[index] })) };
    }
    previousAmount = value;
  }
  function add() {
    const wallet = available.find((wallet) => !rows.some((row) => row.walletId === wallet.id));
    if (!wallet) return;
    automaticSingle = false;
    automaticEqual = false;
    allocation = { shares: [...rows, { walletId: wallet.id, amount: Math.max(0, remaining) }] };
  }
  function equal() {
    automaticSingle = false;
    automaticEqual = true;
    const amounts = splitEqually(amount, rows.length, currency);
    allocation = { shares: rows.map((row, i) => ({ ...row, amount: amounts[i] })) };
  }
  function remove(index: number) {
    automaticSingle = false;
    automaticEqual = false;
    const shares = rows.filter((_, i) => i !== index);
    allocation = shares.length ? { shares } : undefined;
  }
  function preset(equal = false, other = false) {
    if (!firstWallet) return;
    const choices =
      equal && otherWallet ? [firstWallet, otherWallet] : [other && otherWallet ? otherWallet : firstWallet];
    const amounts = splitEqually(amount || 0, choices.length, currency);
    allocation = { shares: choices.map((wallet, index) => ({ walletId: wallet.id, amount: amounts[index] })) };
    automaticSingle = choices.length === 1;
    automaticEqual = equal;
  }
</script>

{#if ($memberSettingsStore?.walletsEnabled && available.length) || rows.length}
  <fieldset class="allocation" data-testId="WalletAllocation">
    <legend>{$translate('wallets.allocation')}</legend>
    {#if firstWallet}<div class="actions">
        <button type="button" on:click={() => preset()}>{firstWallet.name}</button>
        {#if otherWallet}<button type="button" on:click={() => preset(false, true)}>{otherWallet.name}</button><button
            type="button"
            on:click={() => preset(true)}>{$translate('wallets.equal')}</button
          >{/if}
      </div>{/if}
    {#each rows as row, index (row.walletId)}
      <div class="share">
        <label
          ><span class="sr-only">{$translate('wallets.wallet')}</span><select
            aria-label={$translate('wallets.wallet')}
            value={row.walletId}
            on:change={(event) => {
              automaticSingle = false;
              automaticEqual = false;
              allocation = {
                shares: rows.map((share, i) =>
                  i === index ? { ...share, walletId: event.currentTarget.value } : share,
                ),
              };
            }}
          >
            {#each $walletsStore.filter((wallet) => !wallet.archived || wallet.id === row.walletId) as wallet (wallet.id)}<option
                value={wallet.id}>{wallet.name}</option
              >{/each}
            {#if !$walletsStore.some((wallet) => wallet.id === row.walletId)}<option value={row.walletId}
                >{walletsService.deletedItems.find((wallet) => wallet.id === row.walletId)?.name ?? '…'}</option
              >{/if}
          </select></label
        >
        <label
          ><span class="sr-only">{$translate('transactions.amount')}</span><input
            type="number"
            min="0"
            step="any"
            aria-label={$translate('transactions.amount')}
            value={row.amount}
            on:input={(event) => {
              automaticSingle = false;
              automaticEqual = false;
              allocation = {
                shares: rows.map((share, i) =>
                  i === index ? { ...share, amount: Number(event.currentTarget.value) } : share,
                ),
              };
            }}
          /></label
        >
        <button type="button" aria-label={$translate('common.delete')} on:click={() => remove(index)}>×</button>
      </div>
    {/each}
    <div class="actions">
      <button type="button" on:click={add} disabled={rows.length >= available.length}
        >{$translate('wallets.add_share')}</button
      >
      {#if rows.length > 2}<button type="button" on:click={equal}>{$translate('wallets.equal')}</button>{/if}
      {#if rows.length}<button
          type="button"
          on:click={() => {
            allocation = undefined;
            automaticSingle = false;
            automaticEqual = false;
          }}>{$translate('wallets.no_allocation')}</button
        >{/if}
    </div>
    {#if rows.length}<div class="hint" aria-live="polite">
        {$translate('wallets.remaining')}: {formatDebtMoney(remaining, { currency })}
      </div>{/if}
  </fieldset>
{/if}

<style>
  .allocation {
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 0.75rem;
    min-width: 0;
    margin: 0;
  }
  legend {
    padding: 0 0.25rem;
  }
  .share {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(4rem, 6rem) 2.75rem;
    gap: 0.4rem;
    margin: 0.5rem 0;
    align-items: center;
  }
  label {
    min-width: 0;
  }
  input,
  select {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    background: var(--background-color);
    color: var(--primary-text-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.6rem 0.4rem;
    font: inherit;
    font-size: 1rem;
  }
  button {
    border: 0;
    border-radius: 0.5rem;
    background: var(--header-background-color);
    color: var(--active-color);
    font: inherit;
    min-height: 2.75rem;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
