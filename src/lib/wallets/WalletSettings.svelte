<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';
  import dayjs from 'dayjs';
  import { page } from '#lib/page.js';
  import { accountsStore, categoriesStore, operationsStore, settingsStore } from '#lib/data/index.js';
  import { accountsService } from '#lib/data/accounts.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { membersService, memberSettingsStore } from '#lib/data/members.js';
  import { walletsStore, walletTransfersService, walletTransfersStore } from '#lib/data/wallets.js';
  import type { WalletTransfer } from '#lib/data/interfaces.js';
  import {
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  } from '#lib/data/categories.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderBackButton from '#lib/ui/layout/HeaderBackButton.svelte';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import { fromMinor, toMinor } from '#lib/debts/calculations.js';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import WalletOverviewCard from './WalletOverviewCard.svelte';
  import { orderedItems, validateWalletTransfer, walletBalance, walletEntries } from '#lib/wallets/calculations.js';

  type Mode = 'transfer' | null;
  let mode: Mode = null;
  let busy = false;
  let editedTransfer: WalletTransfer | null = null;
  let fromId = '';
  let toId = '';
  let transferCurrency = 'RSD';
  let amount = '';
  let date = dayjs().format('YYYY-MM-DD');
  let comment = '';
  let draftId = uuid();
  $: participant = $selectedParticipantStore;
  $: allAccounts = [...$accountsStore, ...accountsService.deletedItems];
  $: allCategories = [
    ...$categoriesStore,
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  ];
  $: ordered = orderedItems($walletsStore, participant?.walletsOrder);
  $: walletId = $page.url.searchParams.get('wallet');
  $: currentWallet = $walletsStore.find((wallet) => wallet.id === walletId);
  $: entriesByWallet = new Map(
    $walletsStore.map((wallet) => [
      wallet.id,
      walletEntries(wallet, $operationsStore, allCategories, allAccounts, $walletTransfersStore),
    ]),
  );
  $: currencySet = Array.from(
    new Set([
      ...allAccounts.map((account) => account.currency),
      ...$walletTransfersStore.map((transfer) => transfer.currency),
    ]),
  ).sort();
  $: currencies = currencySet.length ? currencySet : ['RSD'];
  $: realBalances = new Map(
    currencies.map((currency) => [
      currency,
      fromMinor(
        $operationsStore
          .filter((operation) => operation.account.currency === currency && Date.parse(operation.date) <= Date.now())
          .reduce(
            (sum, operation) => sum + toMinor(operation.amount * (operation.category.type === 'IN' ? 1 : -1), currency),
            0,
          ),
        currency,
      ),
    ]),
  );
  $: unallocated = currencies.map((currency) => ({
    currency,
    amount: fromMinor(
      toMinor(realBalances.get(currency) ?? 0, currency) -
        $walletsStore.reduce(
          (sum, wallet) => sum + toMinor(balance(wallet.id, currency, entriesByWallet), currency),
          0,
        ),
      currency,
    ),
  }));

  function balance(id: string, currency: string, source = entriesByWallet) {
    return walletBalance(source.get(id) ?? [], currency);
  }
  function personName(id: string) {
    return (
      $participantsStore.find((item) => item.id === id)?.name ??
      participantsService.deletedItems.find((item) => item.id === id)?.name ??
      '…'
    );
  }
  function money(value: number, currency: string, signed = false) {
    return formatDebtMoney(value, { currency, withSign: signed });
  }
  async function run(work: () => Promise<void>) {
    if (busy) return;
    busy = true;
    try {
      await work();
    } catch {
      showErrorToast($translate('wallets.save_failed'));
    } finally {
      busy = false;
    }
  }
  function openTransfer(transfer: WalletTransfer | null = null) {
    draftId = transfer?.id ?? uuid();
    editedTransfer = transfer;
    fromId = transfer?.fromWalletId ?? '';
    toId = transfer?.toWalletId ?? currentWallet?.id ?? '';
    transferCurrency =
      transfer?.currency ?? (currencies.includes(participant?.currency ?? '') ? participant!.currency! : currencies[0]);
    amount = transfer?.amount.toString() ?? '';
    date = transfer ? dayjs(transfer.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    comment = transfer?.comment ?? '';
    mode = 'transfer';
  }
  async function saveTransfer() {
    const fromWallet = $walletsStore.find((wallet) => wallet.id === fromId);
    const toWallet = $walletsStore.find((wallet) => wallet.id === toId);
    const sameEndpoints =
      editedTransfer?.fromWalletId === (fromId || undefined) && editedTransfer?.toWalletId === (toId || undefined);
    const transfer: WalletTransfer = {
      id: draftId,
      fromWalletId: fromId || undefined,
      toWalletId: toId || undefined,
      currency: transferCurrency.trim().toUpperCase(),
      amount: Number(amount),
      date:
        editedTransfer && dayjs(editedTransfer.date).format('YYYY-MM-DD') === date
          ? editedTransfer.date
          : dayjs(date).hour(12).toISOString(),
      comment: comment.trim() || undefined,
      contributorParticipantId: sameEndpoints
        ? editedTransfer?.contributorParticipantId
        : (fromWallet?.participantId ?? toWallet?.participantId),
    };
    if (!validateWalletTransfer(transfer, $walletsStore)) {
      showErrorToast($translate('wallets.invalid_transfer'));
      return;
    }
    await run(async () => {
      await walletTransfersService.save(transfer);
      mode = null;
      await goto(`/wallets?wallet=${transfer.toWalletId ?? transfer.fromWalletId ?? ''}`);
    });
  }
  onMount(() => {
    if ($page.url.searchParams.get('action') === 'create')
      void goto('/wallets/create?from=settings', { replace: true });
    if ($page.url.searchParams.get('action') === 'edit')
      void goto(`/wallets/edit?id=${encodeURIComponent($page.url.searchParams.get('id') ?? '')}&from=settings`, {
        replace: true,
      });
    if ($page.url.searchParams.get('action') === 'transfer') {
      openTransfer($walletTransfersStore.find((item) => item.id === $page.url.searchParams.get('transfer')) ?? null);
      if (!editedTransfer) toId = $page.url.searchParams.get('to') ?? '';
    }
  });
</script>

<Layout title={$translate('wallets.setup')} leftSlot={HeaderBackButton}>
  <div class="wallet-page" data-testId="WalletsPage">
    {#if !currentWallet}
      <label class="visibility"
        ><input
          type="checkbox"
          data-testId="EnableWallets"
          checked={$memberSettingsStore?.walletsEnabled ?? false}
          disabled={busy}
          on:change={(event) => {
            const enabled = event.currentTarget.checked;
            void run(() => membersService.updateWalletsEnabled(enabled));
          }}
        />{$translate('wallets.enable')}</label
      >
    {/if}
    {#if mode === 'transfer'}
      <form class="editor" on:submit|preventDefault={saveTransfer} data-testId="WalletTransferForm">
        <h2>{$translate('wallets.transfer')}</h2>
        <label
          >{$translate('wallets.from')}<select name="from-wallet" bind:value={fromId}
            ><option value="">{$translate('wallets.unallocated')}</option
            >{#each ordered.filter((wallet) => !wallet.archived || wallet.id === fromId) as wallet (wallet.id)}<option
                value={wallet.id}>{wallet.name}</option
              >{/each}</select
          ></label
        >
        <label
          >{$translate('wallets.to')}<select name="to-wallet" bind:value={toId}
            ><option value="">{$translate('wallets.unallocated')}</option
            >{#each ordered.filter((wallet) => !wallet.archived || wallet.id === toId) as wallet (wallet.id)}<option
                value={wallet.id}>{wallet.name}</option
              >{/each}</select
          ></label
        >
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
          ><label
            >{$translate('accounts.currency')}<input
              name="wallet-currency"
              bind:value={transferCurrency}
              required
              pattern={'[A-Za-z]{3}'}
              list="wallet-currencies"
            /></label
          >
        </div>
        <datalist id="wallet-currencies"
          >{#each currencies as currency (currency)}<option value={currency}></option>{/each}</datalist
        >
        <label
          >{$translate('transactions.date')}<input name="wallet-date" type="date" bind:value={date} required /></label
        >
        <label>{$translate('transactions.comment')}<input name="wallet-comment" bind:value={comment} /></label>
        <div class="toolbar">
          <button class="primary" disabled={busy}>{$translate('common.save')}</button><button
            type="button"
            on:click={() => (mode = null)}>{$translate('common.cancel')}</button
          >
          {#if editedTransfer}<button
              type="button"
              class="danger"
              disabled={busy}
              on:click={() =>
                run(async () => {
                  await walletTransfersService.save({ ...editedTransfer!, deleted: true });
                  mode = null;
                })}>{$translate('common.delete')}</button
            >{/if}
        </div>
      </form>
    {/if}

    <div class="section-heading">
      <h2>{$translate('wallets.title')}</h2>
      <a class="create-wallet" href="/wallets/create?from=settings">{$translate('wallets.new')}</a>
    </div>
    <p class="hint">{$translate('wallets.budget_hint')}</p>
    {#if !$walletsStore.length}<p>{$translate('wallets.empty')}</p>{/if}
    <div class="wallet-grid" data-testId="ActiveWallets">
      {#each ordered.filter((wallet) => !wallet.archived) as wallet (wallet.id)}
        <WalletOverviewCard
          {wallet}
          ownerName={wallet.participantId ? personName(wallet.participantId) : $translate('wallets.shared')}
          balances={currencies.map((currency) => ({ currency, amount: balance(wallet.id, currency) }))}
        />
      {/each}
    </div>
    <section class="unallocated">
      <h2>{$translate('wallets.unallocated')}</h2>
      {#each unallocated as value (value.currency)}<div class="row">
          <span>{value.currency}</span><strong data-testId="UnallocatedBalance"
            >{#if $settingsStore.hideBalances}<HiddenMoney currency={value.currency} />{:else}{money(
                value.amount,
                value.currency,
              )}{/if}</strong
          >
        </div>{/each}<button type="button" on:click={() => openTransfer()} disabled={!$walletsStore.length}
        >{$translate('wallets.transfer')}</button
      >
    </section>
    {#if ordered.some((wallet) => wallet.archived)}<details data-testId="ArchivedWallets">
        <summary>{$translate('wallets.archived')}</summary>
        <div class="wallet-grid">
          {#each ordered.filter((wallet) => wallet.archived) as wallet (wallet.id)}
            <WalletOverviewCard
              {wallet}
              ownerName={wallet.participantId ? personName(wallet.participantId) : $translate('wallets.shared')}
              balances={currencies.map((currency) => ({ currency, amount: balance(wallet.id, currency) }))}
            />
          {/each}
        </div>
      </details>{/if}
  </div>
</Layout>

<style>
  .wallet-page {
    padding: 1rem;
    max-width: 48rem;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 0;
  }

  p {
    margin: 0;
  }
  button,
  input,
  select {
    font: inherit;
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
  .editor {
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    min-width: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  input,
  select {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.65rem;
    background: var(--background-color);
    color: var(--primary-text-color);
    font-size: 1rem;
  }
  .two-fields {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 0.5rem;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    overflow-wrap: anywhere;
  }
  .section-heading,
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .wallet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
    gap: 0.75rem;
  }
  .unallocated {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .unallocated {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
  }
  .visibility {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    overflow-wrap: anywhere;
  }
  .visibility input {
    width: 1.2rem;
    flex-shrink: 0;
  }
  .create-wallet {
    padding: 0.6rem 0.8rem;
    border-radius: 0.75rem;
    color: var(--background-color);
    background: var(--active-color);
    text-decoration: none;
  }
  summary {
    cursor: pointer;
    padding: 0.75rem 0;
  }
</style>
