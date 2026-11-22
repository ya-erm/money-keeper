<script lang="ts">
  import { goto } from '$app/navigation';
  import dayjs from 'dayjs';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import ShowMoreContainer from '@ya-erm/svelte-ui/ShowMoreContainer';
  import { page } from '#lib/page.js';
  import { accountsStore, categoriesStore, operationsStore, settingsStore } from '#lib/data/index.js';
  import { accountsService } from '#lib/data/accounts.js';
  import { memberSettingsStore } from '#lib/data/members.js';
  import { participantHistoryStore, selectedParticipantStore } from '#lib/data/participants.js';
  import { walletsService, walletsStore, walletTransfersStore } from '#lib/data/wallets.js';
  import {
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  } from '#lib/data/categories.js';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import WalletHeaderActions from '#lib/wallets/WalletHeaderActions.svelte';
  import ReloadPageButton from '#lib/ui/ReloadPageButton.svelte';
  import HiddenMoney from '#lib/ui/HiddenMoney.svelte';
  import { formatDebtMoney } from '#lib/debts/formatMoney.js';
  import { fromMinor, toMinor } from '#lib/debts/calculations.js';
  import {
    orderedItems,
    walletBalance,
    walletContributions,
    walletEntries,
    walletDayExpenses,
  } from '#lib/wallets/calculations.js';
  import OperationsHeader from '#lib/ui/OperationsHeader.svelte';
  import OperationDayHeader from '#lib/ui/OperationDayHeader.svelte';
  import { formatMoney } from '#lib/utils/formatMoney.js';
  import { groupBySelectorToMap } from '#lib/utils/groupBy.js';
  import WalletCards from '#lib/wallets/WalletCards.svelte';
  import TransactionListItem from '../transactions/TransactionListItem.svelte';

  let search = '';
  let limit = 20;
  $: participant = $selectedParticipantStore;
  $: visible = orderedItems(
    $walletsStore.filter((wallet) => !wallet.archived),
    participant?.walletsOrder,
  );
  $: currentWallet = $walletsStore.find((wallet) => wallet.id === $page.url.searchParams.get('wallet')) ?? visible[0];
  $: cardWallets =
    currentWallet && !visible.some((wallet) => wallet.id === currentWallet.id) ? [...visible, currentWallet] : visible;
  $: allAccounts = [...$accountsStore, ...accountsService.deletedItems];
  $: categories = [
    ...$categoriesStore,
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  ];
  $: currencies = Array.from(
    new Set([
      ...allAccounts.map((account) => account.currency),
      ...$walletTransfersStore.map((transfer) => transfer.currency),
    ]),
  );
  $: entriesByWallet = new Map(
    $walletsStore.map((wallet) => [
      wallet.id,
      walletEntries(wallet, $operationsStore, categories, allAccounts, $walletTransfersStore),
    ]),
  );
  $: history = currentWallet ? (entriesByWallet.get(currentWallet.id) ?? []) : [];
  $: filtered = history.filter((entry) => {
    if (
      entry.operation?.linkedTransactionId &&
      history.some(
        (other) =>
          other.operation?.id === entry.operation?.linkedTransactionId &&
          other.operation?.categoryId === SYSTEM_CATEGORY_TRANSFER_OUT.id,
      )
    )
      return false;
    const text = entry.operation
      ? `${entry.operation.comment ?? ''} ${categories.find((category) => category.id === entry.operation?.categoryId)?.name ?? ''}`
      : `${walletName(entry.transfer?.fromWalletId)} ${walletName(entry.transfer?.toWalletId)} ${entry.transfer?.comment ?? ''}`;
    return (
      !search ||
      `${text} ${entry.date} ${entry.amount} ${entry.currency}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    );
  });
  $: shown = filtered.slice(0, limit);
  $: dayGroups = groupBySelectorToMap(shown, (entry) => dayjs(entry.date).format('YYYY-MM-DD'));
  $: dayExpenses = new Map(
    [...groupBySelectorToMap(filtered, (entry) => dayjs(entry.date).format('YYYY-MM-DD'))].map(([date, entries]) => [
      date,
      walletDayExpenses(entries, categories),
    ]),
  );
  $: contributions = currentWallet
    ? currencies.flatMap((currency) =>
        walletContributions(currentWallet, $walletTransfersStore, currency).map((value) => ({ ...value, currency })),
      )
    : [];
  $: unallocated = currencies.map((currency) => ({
    currency,
    amount: fromMinor(
      $operationsStore
        .filter((operation) => operation.account.currency === currency && Date.parse(operation.date) <= Date.now())
        .reduce(
          (sum, operation) => sum + toMinor(operation.amount * (operation.category.type === 'IN' ? 1 : -1), currency),
          0,
        ) -
        $walletsStore.reduce(
          (sum, wallet) => sum + toMinor(walletBalance(entriesByWallet.get(wallet.id) ?? [], currency), currency),
          0,
        ),
      currency,
    ),
  }));
  function walletName(id?: string) {
    return (
      $walletsStore.find((wallet) => wallet.id === id)?.name ??
      walletsService.deletedItems.find((wallet) => wallet.id === id)?.name ??
      $translate('wallets.unallocated')
    );
  }
  function expense(scan = false) {
    const params = new SvelteURLSearchParams({ type: 'OUT' });
    if (currentWallet && currentWallet.id !== visible[0]?.id) params.set('walletId', currentWallet.id);
    if (scan) params.set('scan-receipt', '1');
    return `/transactions/create?${params}`;
  }
</script>

<Layout title={$translate('wallets.title')} leftSlot={ReloadPageButton} rightSlot={WalletHeaderActions}>
  <div data-testId="WalletsPage">
    {#if $memberSettingsStore?.walletsEnabled}
      <WalletCards
        wallets={cardWallets}
        participants={$participantHistoryStore}
        selectedId={currentWallet?.id}
        currencies={currencies.length ? currencies : ['RSD']}
        getBalance={(id, currency) => walletBalance(entriesByWallet.get(id) ?? [], currency)}
      />
      {#if currentWallet}
        <section class="operations" data-testId="WalletDetails">
          <OperationsHeader
            count={filtered.length}
            addHref={!currentWallet.archived ? expense() : null}
            scanHref={!currentWallet.archived ? expense(true) : null}
            addTestId="WalletAddExpense"
            scanTestId="WalletScanReceipt"
          />
          <div class="operations-search-container">
            <Input bind:value={search} icon="mdi:search" placeholder={$translate('common.search')} clearable />
          </div>
          {#if !currentWallet.participantId && contributions.length}
            <details class="contributions" open>
              <summary>{$translate('wallets.contributions')}</summary>
              {#each contributions as contribution (`${contribution.participantId}:${contribution.currency}`)}<div
                  class="contribution"
                  data-testId="WalletContribution"
                >
                  <span
                    >{$participantHistoryStore.find((person) => person.id === contribution.participantId)?.name ??
                      '…'}</span
                  ><span
                    >{#if $settingsStore.hideBalances}<HiddenMoney
                        currency={contribution.currency}
                      />{:else}{formatDebtMoney(contribution.contributed, {
                        currency: contribution.currency,
                      })}{/if}{#if contribution.returned}<span class="hint">
                        · {$translate('wallets.returned')}: {#if $settingsStore.hideBalances}<HiddenMoney
                            currency={contribution.currency}
                          />{:else}{formatDebtMoney(contribution.returned, {
                            currency: contribution.currency,
                          })}{/if}</span
                      >{/if}</span
                  >
                </div>{/each}
            </details>
          {/if}
          <ShowMoreContainer bind:limit step={20} total={filtered.length} translate={$translate}>
            <ul class="history">
              {#each [...dayGroups] as [date, entries] (date)}
                <li class="day-group" data-testId="WalletDayGroup">
                  <OperationDayHeader
                    {date}
                    expenses={$settingsStore.hideBalances
                      ? []
                      : (dayExpenses.get(date) ?? []).map(
                          (value) => `-${formatMoney(value.amount, { currency: value.currency })}`,
                        )}
                  />
                  <ul class="day-entries">
                    {#each entries as entry (entry.id)}
                      {@const operation = entry.operation
                        ? $operationsStore.find((operation) => operation.id === entry.operation?.id)
                        : undefined}
                      {@const linked = operation?.linkedTransactionId
                        ? history.find((other) => other.operation?.id === operation.linkedTransactionId)
                        : undefined}
                      {#if operation}
                        <li data-testId="WalletHistoryEntry">
                          <ul class="operation-item">
                            <TransactionListItem
                              transaction={operation}
                              amountOverride={Math.abs(entry.amount)}
                              linkedAmountOverride={linked ? Math.abs(linked.amount) : null}
                              onClick={() => goto(`/transactions/edit?id=${operation.id}`)}
                            />
                          </ul>
                        </li>
                      {:else if entry.transfer}
                        <li data-testId="WalletHistoryEntry">
                          <button
                            class="transfer"
                            type="button"
                            on:click={() =>
                              goto(
                                `/wallets/transfer?transfer=${encodeURIComponent(entry.transfer!.id)}&wallet=${encodeURIComponent(currentWallet.id)}`,
                              )}
                            ><span class="transfer-icon"
                              ><Icon name="mdi:swap-horizontal" size={1.75} padding={0.75} /></span
                            ><span class="transfer-text"
                              ><span
                                >{walletName(entry.transfer.fromWalletId)} → {walletName(
                                  entry.transfer.toWalletId,
                                )}</span
                              ><span class="hint">{entry.transfer.comment || $translate('wallets.internal')}</span
                              ></span
                            ><span class="amount"
                              >{#if $settingsStore.hideBalances}<HiddenMoney
                                  currency={entry.currency}
                                />{:else}{formatDebtMoney(entry.amount, {
                                  currency: entry.currency,
                                  withSign: true,
                                })}{/if}</span
                            ></button
                          >
                        </li>
                      {/if}
                    {/each}
                  </ul>
                </li>
              {/each}
            </ul>
          </ShowMoreContainer>
          {#if !filtered.length}<p class="hint">{$translate('wallets.no_history')}</p>{/if}
        </section>
      {/if}
      <details class="unallocated">
        <summary>{$translate('wallets.unallocated')}</summary>{#each unallocated as value (value.currency)}<div
            class="contribution"
          >
            <span>{value.currency}</span><span data-testId="UnallocatedBalance"
              >{#if $settingsStore.hideBalances}<HiddenMoney currency={value.currency} />{:else}{formatDebtMoney(
                  value.amount,
                  { currency: value.currency },
                )}{/if}</span
            >
          </div>{/each}<a href="/wallets/transfer">{$translate('wallets.transfer')}</a>
      </details>
    {:else}
      <div class="empty">
        <p>{$translate('wallets.empty')}</p>
        <a href="/settings/wallets">{$translate('wallets.enable')}</a>
      </div>
    {/if}
  </div>
</Layout>

<style>
  .operations {
    padding: 1rem;
  }
  .operations-search-container {
    padding: 1rem 0;
    background: var(--background-color);
    position: relative;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
  }
  a {
    color: var(--active-color);
    text-decoration: none;
  }
  .history,
  .day-entries,
  .operation-item {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .history,
  .day-entries,
  .day-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .history {
    padding-top: 1rem;
  }
  .transfer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 0;
    border-radius: 1rem;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    width: 100%;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }
  .transfer-icon {
    background: var(--header-background-color);
    border-radius: 100%;
    flex-shrink: 0;
  }
  .transfer-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }
  .amount {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .contribution {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }
  .contributions summary,
  .unallocated summary {
    cursor: pointer;
    padding: 0.5rem 0;
  }
  .unallocated,
  .empty {
    padding: 1rem;
  }
</style>
