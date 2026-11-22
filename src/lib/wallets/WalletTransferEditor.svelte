<script lang="ts">
  import { goto } from '$app/navigation';
  import { v4 as uuid } from 'uuid';
  import dayjs from 'dayjs';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import WalletSelector from './WalletSelector.svelte';
  import WalletCurrencyModal from './WalletCurrencyModal.svelte';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { page } from '#lib/page.js';
  import { $initialized as dataInitialized } from '#lib/data/initialized.js';
  import { accountsStore } from '#lib/data/accounts.js';
  import { selectedParticipantStore } from '#lib/data/participants.js';
  import { walletsStore, walletTransfersService, walletTransfersStore } from '#lib/data/wallets.js';
  import type { Participant, WalletTransfer } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderFormSubmitButton from '#lib/ui/layout/HeaderFormSubmitButton.svelte';
  import { validateWalletTransfer } from './calculations.js';

  let busy = false;
  let ready = false;
  let initializedKey: string | null = null;
  let editedTransfer: WalletTransfer | null = null;
  let draftId = uuid();
  let fromId = '';
  let toId = '';
  let transferCurrency = 'RSD';
  let amount = '';
  let date = dayjs().format('YYYY-MM-DD');
  let time = dayjs().format('HH:mm');
  let selectingCurrency = false;
  let comment = '';
  $: transferId = $page.url.searchParams.get('transfer');
  $: targetId = $page.url.searchParams.get('to') ?? '';
  $: contextId = $page.url.searchParams.get('wallet') ?? targetId;
  $: currencies = [
    ...new Set([
      ...$accountsStore.map((account) => account.currency),
      ...$walletTransfersStore.map((transfer) => transfer.currency),
    ]),
  ].sort();
  $: initialize($dataInitialized, transferId, targetId, $walletTransfersStore, currencies, $selectedParticipantStore);
  function initialize(
    loaded: boolean,
    id: string | null,
    target: string,
    transfers: WalletTransfer[],
    currencies: string[],
    participant: Participant | null,
  ) {
    if (!loaded) return;
    const key = JSON.stringify([id, target]);
    if (initializedKey === key) return;
    initializedKey = key;
    const transfer = id ? transfers.find((item) => item.id === id) : undefined;
    ready = !id || !!transfer;
    editedTransfer = transfer ?? null;
    draftId = transfer?.id ?? uuid();
    fromId = transfer?.fromWalletId ?? '';
    toId = transfer?.toWalletId ?? target;
    transferCurrency =
      transfer?.currency ??
      (currencies.includes(participant?.currency ?? '') ? participant!.currency! : (currencies[0] ?? 'RSD'));
    amount = transfer?.amount.toString() ?? '';
    date = transfer ? dayjs(transfer.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    time = transfer ? dayjs(transfer.date).format('HH:mm') : dayjs().format('HH:mm');
    comment = transfer?.comment ?? '';
  }
  async function finish(selected?: string) {
    const walletId = contextId || selected || editedTransfer?.toWalletId || editedTransfer?.fromWalletId;
    await goto(
      $page.url.searchParams.get('from') === 'settings'
        ? '/settings/wallets'
        : walletId
          ? `/wallets?wallet=${encodeURIComponent(walletId)}`
          : '/wallets',
      { replace: true },
    );
  }
  async function saveTransfer() {
    if (busy || !ready) return;
    const current = transferId ? walletTransfersService.getById(draftId) : undefined;
    if (transferId && !current) {
      showErrorToast($translate('wallets.save_failed'));
      return;
    }
    const fromWallet = $walletsStore.find((wallet) => wallet.id === fromId);
    const toWallet = $walletsStore.find((wallet) => wallet.id === toId);
    const sameEndpoints =
      current?.fromWalletId === (fromId || undefined) && current?.toWalletId === (toId || undefined);
    const transfer: WalletTransfer = {
      id: draftId,
      fromWalletId: fromId || undefined,
      toWalletId: toId || undefined,
      currency: transferCurrency.trim().toUpperCase(),
      amount: Number(amount),
      date:
        current && dayjs(current.date).format('YYYY-MM-DD') === date && dayjs(current.date).format('HH:mm') === time
          ? current.date
          : dayjs(`${date}T${time}`).toISOString(),
      comment: comment.trim() || undefined,
      contributorParticipantId: sameEndpoints
        ? current?.contributorParticipantId
        : (fromWallet?.participantId ?? toWallet?.participantId),
    };
    if (!validateWalletTransfer(transfer, $walletsStore)) {
      showErrorToast($translate('wallets.invalid_transfer'));
      return;
    }
    busy = true;
    try {
      await walletTransfersService.save(transfer);
      await finish(transfer.toWalletId ?? transfer.fromWalletId);
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
  async function remove() {
    const current = walletTransfersService.getById(draftId);
    if (busy || !current) return;
    busy = true;
    try {
      await walletTransfersService.save({ ...current, deleted: true });
      await finish();
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
</script>

<Layout title={$translate('wallets.transfer')} onBack={() => finish()} rightSlot={HeaderFormSubmitButton} hideMenu>
  {#if ready}
    <form class="editor" on:submit|preventDefault={saveTransfer} data-testId="WalletTransferForm">
      <WalletSelector
        name="from-wallet"
        label={$translate('wallets.from')}
        bind:walletId={fromId}
        testId="SourceWalletSelect"
        disabled={busy}
      />
      <WalletSelector
        name="to-wallet"
        label={$translate('wallets.to')}
        bind:walletId={toId}
        testId="DestinationWalletSelect"
        disabled={busy}
      />
      <div class="two-fields">
        <label
          >{$translate('transactions.amount')}<input
            name="wallet-amount"
            type="number"
            min="0"
            step="any"
            bind:value={amount}
            required
          /></label
        >
        <div class="field">
          <InputLabel text={$translate('accounts.currency')} />
          <button
            class="currency-button"
            type="button"
            data-testId="WalletCurrencyButton"
            disabled={busy}
            aria-label={`${$translate('accounts.currency')}: ${transferCurrency}`}
            on:click={() => (selectingCurrency = true)}
          >
            <span>{transferCurrency}</span><Icon name="mdi:chevron-down" size={1.1} />
          </button>
        </div>
      </div>
      <div class="date-time">
        <label
          >{$translate('transactions.date')}<input name="wallet-date" type="date" bind:value={date} required /></label
        >
        <label
          >{$translate('transactions.time')}<input name="wallet-time" type="time" bind:value={time} required /></label
        >
      </div>
      <label>{$translate('transactions.comment')}<input name="wallet-comment" bind:value={comment} /></label>
      <div class="toolbar">
        <button type="submit" class="primary" disabled={busy || !ready}>{$translate('common.save')}</button><button
          type="button"
          disabled={busy}
          on:click={() => finish()}>{$translate('common.cancel')}</button
        >
        {#if editedTransfer}<button type="button" class="danger" disabled={busy} on:click={remove}
            >{$translate('common.delete')}</button
          >{/if}
      </div>
    </form>
  {:else if $dataInitialized}<p>{$translate('wallets.transfer_not_found')}</p>{/if}
</Layout>

{#if selectingCurrency}<WalletCurrencyModal
    currency={transferCurrency}
    onSelect={(value) => (transferCurrency = value)}
    onClose={() => (selectingCurrency = false)}
  />{/if}

<style>
  .editor {
    padding: 1rem;
    max-width: 36rem;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  button,
  input {
    font: inherit;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.65rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    font-size: 1rem;
  }
  button {
    min-height: 2.75rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .primary {
    background: var(--active-color);
    color: var(--background-color);
  }
  .danger {
    color: var(--red-color);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .two-fields {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 0.5rem;
  }
  .date-time {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  .currency-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--active-color);
    gap: 0.5rem;
  }
  p {
    padding: 1rem;
  }
</style>
