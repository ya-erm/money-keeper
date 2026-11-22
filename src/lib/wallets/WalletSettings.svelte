<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  export let participantsOnly = false;
  import { v4 as uuid } from 'uuid';
  import dayjs from 'dayjs';
  import { page } from '#lib/page.js';
  import { accountsStore, categoriesStore, operationsStore, settingsStore } from '#lib/data/index.js';
  import { accountsService } from '#lib/data/accounts.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { membersService, memberSettingsStore } from '#lib/data/members.js';
  import { walletsService, walletsStore, walletTransfersService, walletTransfersStore } from '#lib/data/wallets.js';
  import type { VirtualWallet, WalletTransfer } from '#lib/data/interfaces.js';
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
  import ParticipantPicker from '#lib/wallets/ParticipantPicker.svelte';
  import { orderedItems, validateWalletTransfer, walletBalance, walletEntries } from '#lib/wallets/calculations.js';

  type Mode = 'participant' | 'wallet' | 'transfer' | 'preferences' | null;
  let mode: Mode = null;
  let busy = false;
  let name = '';
  let ownerId = '';
  let editedWallet: VirtualWallet | null = null;
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
  $: visible = ordered.filter((wallet) => !wallet.archived && !participant?.hiddenWalletIds?.includes(wallet.id));
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
  function openParticipant() {
    draftId = uuid();
    mode = 'participant';
    name = '';
  }
  function openWallet(wallet: VirtualWallet | null = null) {
    draftId = wallet?.id ?? uuid();
    editedWallet = wallet;
    name = wallet?.name ?? '';
    ownerId = wallet?.participantId ?? '';
    mode = 'wallet';
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
  async function saveParticipant() {
    if (!name.trim()) return;
    await run(async () => {
      const id = draftId;
      await participantsService.save({
        id,
        name: name.trim(),
        accountsOrder: $accountsStore.map((account) => account.id),
      });
      if (!participant) await participantsService.select(id);
      mode = null;
    });
  }
  async function saveWallet() {
    if (!name.trim()) return;
    await run(async () => {
      const id = draftId;
      await walletsService.save({ ...editedWallet, id, name: name.trim(), participantId: ownerId || undefined });
      const owner = participantsService.getById(ownerId);
      if (!editedWallet && owner && !owner.walletsOrder?.length) {
        await participantsService.save({
          ...owner,
          walletsOrder: [id, ...$walletsStore.filter((wallet) => wallet.id !== id).map((wallet) => wallet.id)],
        });
      }
      mode = null;
    });
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
  async function move(kind: 'accountsOrder' | 'walletsOrder', id: string, shift: number) {
    const items = kind === 'accountsOrder' ? $accountsStore : ordered;
    const ids = items.map((item) => item.id);
    const index = ids.indexOf(id),
      next = index + shift;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    await run(() => participantsService.updatePreferences({ [kind]: ids }));
  }
  async function setVisible(kind: 'hiddenAccountIds' | 'hiddenWalletIds', id: string, shown: boolean) {
    const ids = participant?.[kind] ?? [];
    await run(() =>
      participantsService.updatePreferences({
        [kind]: shown ? ids.filter((value) => value !== id) : [...new Set([...ids, id])],
      }),
    );
  }
  onMount(() => {
    if (participantsOnly) {
      mode = participant ? 'preferences' : null;
      return;
    }
    if ($page.url.searchParams.get('action') === 'edit')
      openWallet($walletsStore.find((item) => item.id === $page.url.searchParams.get('id')) ?? null);
    if ($page.url.searchParams.get('action') === 'transfer') {
      openTransfer($walletTransfersStore.find((item) => item.id === $page.url.searchParams.get('transfer')) ?? null);
      if (!editedTransfer) toId = $page.url.searchParams.get('to') ?? '';
    }
  });
</script>

<Layout title={$translate(participantsOnly ? 'wallets.participants' : 'wallets.setup')} leftSlot={HeaderBackButton}>
  <div class="wallet-page" data-testId="WalletsPage">
    {#if !participantsOnly && !currentWallet}
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
    {#if participantsOnly}<ParticipantPicker />{/if}
    {#if participantsOnly && !currentWallet}
      <div class="toolbar">
        <button type="button" on:click={openParticipant}>{$translate('wallets.new_participant')}</button>
        {#if participant}<button type="button" on:click={() => (mode = mode === 'preferences' ? null : 'preferences')}
            >{$translate('wallets.preferences')}</button
          >{/if}
      </div>
    {/if}

    {#if mode === 'participant'}
      <form class="editor" on:submit|preventDefault={saveParticipant} data-testId="ParticipantForm">
        <h2>{$translate('wallets.new_participant')}</h2>
        <label
          >{$translate('wallets.participant_name')}<input
            name="participant-name"
            bind:value={name}
            required
            maxlength="100"
          /></label
        >
        <div class="toolbar">
          <button class="primary" disabled={busy}>{$translate('common.save')}</button><button
            type="button"
            on:click={() => (mode = null)}>{$translate('common.cancel')}</button
          >
        </div>
      </form>
    {:else if mode === 'wallet'}
      <form class="editor" on:submit|preventDefault={saveWallet} data-testId="WalletForm">
        <h2>{$translate(editedWallet ? 'wallets.edit_wallet' : 'wallets.new')}</h2>
        <label
          >{$translate('wallets.name')}<input name="wallet-name" bind:value={name} required maxlength="100" /></label
        >
        <label
          >{$translate('wallets.owner')}<select name="wallet-owner" bind:value={ownerId}
            ><option value="">{$translate('wallets.shared')}</option
            >{#each $participantsStore as person (person.id)}<option value={person.id}>{person.name}</option
              >{/each}</select
          ></label
        >
        <div class="toolbar">
          <button class="primary" disabled={busy}>{$translate('common.save')}</button><button
            type="button"
            on:click={() => (mode = null)}>{$translate('common.cancel')}</button
          >
        </div>
      </form>
    {:else if mode === 'transfer'}
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
    {:else if mode === 'preferences' && participant}
      <section class="editor" data-testId="ParticipantPreferences">
        <h2>{$translate('wallets.preferences')} · {participant.name}</h2>
        <p class="hint">{$translate('wallets.order_hint')}</p>
        <label
          >{$translate('wallets.name')}<input
            aria-label={$translate('wallets.name')}
            value={participant.name}
            on:change={(event) => {
              const value = event.currentTarget.value.trim();
              if (value) void run(() => participantsService.updatePreferences({ name: value }));
            }}
          /></label
        >
        <label
          >{$translate('currency_rates.default_currency')}<input
            name="participant-currency"
            value={participant.currency ?? ''}
            maxlength="3"
            on:change={(event) => {
              const currency = event.currentTarget.value.trim().toUpperCase();
              if (!currency || /^[A-Z]{3}$/.test(currency))
                void run(() => participantsService.updatePreferences({ currency: currency || undefined }));
            }}
          /></label
        >
        <label
          >{$translate('wallets.default_allocation')}<select
            name="allocation-preset"
            value={participant.allocationPreset ?? 'first'}
            on:change={(event) => {
              const allocationPreset = event.currentTarget.value as 'first' | 'other' | 'equal';
              void run(() => participantsService.updatePreferences({ allocationPreset }));
            }}
            ><option value="first">{$translate('wallets.first_wallet')}</option><option value="other"
              >{$translate('wallets.other_wallet')}</option
            ><option value="equal">{$translate('wallets.equal')}</option></select
          ></label
        >
        {#each ['accountsOrder', 'walletsOrder'] as kind (kind)}
          <h3>{$translate(kind === 'accountsOrder' ? 'accounts.title' : 'wallets.title')}</h3>
          {#each kind === 'accountsOrder' ? $accountsStore : ordered as item, index (item.id)}
            <div class="preference-row">
              <label class="visibility"
                ><input
                  type="checkbox"
                  aria-label={`${$translate('wallets.visible')} ${item.name}`}
                  checked={!(
                    kind === 'accountsOrder' ? participant.hiddenAccountIds : participant.hiddenWalletIds
                  )?.includes(item.id)}
                  on:change={(event) =>
                    setVisible(
                      kind === 'accountsOrder' ? 'hiddenAccountIds' : 'hiddenWalletIds',
                      item.id,
                      event.currentTarget.checked,
                    )}
                />{item.name}</label
              >
              <button
                type="button"
                aria-label={`${$translate('wallets.up')} ${item.name}`}
                disabled={busy || index === 0}
                on:click={() => move(kind as 'accountsOrder' | 'walletsOrder', item.id, -1)}>↑</button
              >
              <button
                type="button"
                aria-label={`${$translate('wallets.down')} ${item.name}`}
                disabled={busy || index === (kind === 'accountsOrder' ? $accountsStore : ordered).length - 1}
                on:click={() => move(kind as 'accountsOrder' | 'walletsOrder', item.id, 1)}>↓</button
              >
            </div>
          {/each}
        {/each}
        <button type="button" on:click={() => (mode = null)}>{$translate('common.done')}</button>
      </section>
    {/if}

    {#if !participantsOnly}
      <div class="section-heading">
        <h2>{$translate('wallets.title')}</h2>
        <button type="button" class="primary" on:click={() => openWallet()}>{$translate('wallets.new')}</button>
      </div>
      <p class="hint">{$translate('wallets.budget_hint')}</p>
      {#if !$walletsStore.length}<p>{$translate('wallets.empty')}</p>{/if}
      <div class="wallet-management">
        {#each ordered as wallet (wallet.id)}
          <div class="row">
            <a href={`/wallets?wallet=${wallet.id}`}>{wallet.name}</a>
            <div class="toolbar">
              <button type="button" on:click={() => openWallet(wallet)}>{$translate('common.edit')}</button><button
                type="button"
                disabled={busy}
                on:click={() => run(() => walletsService.save({ ...wallet, archived: !wallet.archived }))}
                >{$translate(wallet.archived ? 'wallets.restore' : 'wallets.archive')}</button
              >
            </div>
          </div>
        {/each}
      </div>
      <div class="wallet-grid">
        {#each visible as wallet (wallet.id)}
          <a class="wallet-card" href={`/wallets?wallet=${wallet.id}`} data-testId="WalletCard" data-id={wallet.id}>
            <strong>{wallet.name}</strong><span class="hint"
              >{wallet.participantId ? personName(wallet.participantId) : $translate('wallets.shared')}</span
            >
            {#each currencies as currency (currency)}{#if balance(wallet.id, currency) !== 0 || currencies.length === 1}<span
                  class="wallet-money"
                  class:overdrawn={balance(wallet.id, currency) < 0}
                  >{#if $settingsStore.hideBalances}<HiddenMoney {currency} />{:else}{money(
                      balance(wallet.id, currency),
                      currency,
                    )}{/if}</span
                >{/if}{/each}
            {#if currencies.length > 1 && currencies.every((currency) => balance(wallet.id, currency) === 0)}<span
                class="wallet-money"
                >{#if $settingsStore.hideBalances}<HiddenMoney />{:else}0{/if}</span
              >{/if}
          </a>
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
      {#if ordered.some((wallet) => wallet.archived)}<details>
          <summary>{$translate('wallets.archived')}</summary
          >{#each ordered.filter((wallet) => wallet.archived) as wallet (wallet.id)}<a
              class="archive-link"
              href={`/wallets?wallet=${wallet.id}`}>{wallet.name}</a
            >{/each}
        </details>{/if}
    {/if}
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
  h3 {
    font-size: 1rem;
    font-weight: 500;
    margin: 0.5rem 0 0;
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
  .danger,
  .overdrawn {
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
  .wallet-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1rem;
    text-decoration: none;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .wallet-money {
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
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
  .preference-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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
  .archive-link {
    display: block;
    padding: 0.75rem 0;
    color: var(--active-color);
  }
</style>
