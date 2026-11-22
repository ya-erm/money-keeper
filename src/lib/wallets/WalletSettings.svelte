<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { page } from '#lib/page.js';
  import { accountsStore, categoriesStore, operationsStore, settingsStore } from '#lib/data/index.js';
  import { accountsService } from '#lib/data/accounts.js';
  import { participantsService, participantsStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { membersService, memberSettingsStore } from '#lib/data/members.js';
  import { walletsStore, walletTransfersStore } from '#lib/data/wallets.js';
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
  import { orderedItems, walletBalance, walletEntries } from '#lib/wallets/calculations.js';

  let busy = false;
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
  onMount(() => {
    if ($page.url.searchParams.get('action') === 'create')
      void goto('/wallets/create?from=settings', { replace: true });
    if ($page.url.searchParams.get('action') === 'edit')
      void goto(`/wallets/edit?id=${encodeURIComponent($page.url.searchParams.get('id') ?? '')}&from=settings`, {
        replace: true,
      });
    if ($page.url.searchParams.get('action') === 'transfer') {
      const params = new SvelteURLSearchParams($page.url.searchParams.toString());
      params.delete('action');
      void goto(`/wallets/transfer?${params}`, { replace: true });
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

    <p class="hint">{$translate('wallets.budget_hint')}</p>
    <div class="section-heading">
      <h2>{$translate('wallets.title')}</h2>
      <a class="create-wallet" href="/wallets/create?from=settings">{$translate('wallets.new')}</a>
    </div>
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
        </div>{/each}<button
        type="button"
        on:click={() => goto('/wallets/transfer?from=settings')}
        disabled={!$walletsStore.length}>{$translate('wallets.transfer')}</button
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

  input {
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
