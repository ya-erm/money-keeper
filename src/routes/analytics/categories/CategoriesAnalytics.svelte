<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';

  import { categoriesStore, currencyRatesStore, memberSettingsStore, operationsStore, settingsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Spoiler from '@ya-erm/svelte-ui/Spoiler';
  import SpoilerToggle from '@ya-erm/svelte-ui/SpoilerToggle';
  import HiddenMoney from '$lib/ui/HiddenMoney.svelte';
  import { findRate, formatMoney, groupByKey, hasHiddenBalanceAccount } from '$lib/utils';

  import TransactionList from '../../transactions/TransactionList.svelte';

  import { analyticsBalancesVisibilityMode } from '../store';
  import MonthSelect from './MonthSelect.svelte';
  import { groupTransactionsByComment } from './groupTransactionsByComment';
  import { intervalEndStore, intervalStartStore, intervalTypeStore } from './store';

  $: categories = $categoriesStore;
  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;
  $: transactions = $operationsStore;

  $: mainCurrency = settings?.currency ?? 'USD';
  $: balancesHidden = $settingsStore.hideBalances ?? false;

  let startDate = dayjs().startOf('month');
  let endDate = dayjs().endOf('month');

  $: if ($intervalTypeStore === 'custom') {
    startDate = dayjs($intervalStartStore);
    endDate = dayjs($intervalEndStore);
  } else {
    startDate = dayjs().startOf('month');
    endDate = dayjs().endOf('month');
  }

  const handleDateChange = (value: { startDate: Dayjs; endDate: Dayjs }) => {
    startDate = value.startDate;
    endDate = value.endDate;
    selectedCategoryId = null;
  };

  $: findRateFn = (currency: string) => findRate(currencyRates, mainCurrency, currency);

  $: filteredTransactions = transactions.filter(
    (t) =>
      dayjs(t.date).isAfter(startDate) &&
      dayjs(t.date).isBefore(endDate) &&
      !t.excludeFromAnalysis &&
      !t.category.system,
  );

  $: transactionsByCategories = groupByKey(filteredTransactions, 'categoryId');
  $: groups = Object.entries(transactionsByCategories)
    .map(([categoryId, transactions]) => {
      const category = categories.find((c) => c.id === categoryId) ?? transactions?.[0]?.category;
      return {
        category,
        categoryId,
        transactions: transactions ?? [],
        hasHiddenBalanceAccount: hasHiddenBalanceAccount(
          null,
          transactions?.map((transaction) => transaction.account) ?? [],
        ),
        sum:
          transactions?.reduce(
            (sum, t) => sum + (t.category.type === 'IN' ? 1 : -1) * t.amount * findRateFn(t.account.currency),
            0,
          ) ?? 0,
      };
    })
    .sort((a, b) => a.sum - b.sum);

  let selectedCategoryId: string | null = null;
  let commentsHidden = false;
  $: selectedGroup = groups.find((group) => group.categoryId === selectedCategoryId);
  $: commentGroups = selectedGroup
    ? groupTransactionsByComment(
        selectedGroup.transactions,
        (transaction) =>
          (transaction.category.type === 'IN' ? 1 : -1) * transaction.amount * findRateFn(transaction.account.currency),
      ).map((group) => ({
        ...group,
        hasHiddenBalanceAccount: hasHiddenBalanceAccount(
          null,
          group.transactions.map((transaction) => transaction.account),
        ),
      }))
    : [];
  $: incomingTotal = groups.filter((g) => g.category?.type === 'IN').reduce((sum, g) => sum + g.sum, 0);
  $: outgoingTotal = Math.abs(groups.filter((g) => g.category?.type === 'OUT').reduce((sum, g) => sum + g.sum, 0));
  $: totalsHidden =
    $analyticsBalancesVisibilityMode === 'hide' ||
    ($analyticsBalancesVisibilityMode !== 'show' &&
      (balancesHidden || groups.some((group) => group.hasHiddenBalanceAccount)));

  const getGroupPercentage = (group: (typeof groups)[number], incomingTotal: number, outgoingTotal: number) => {
    const total = group.category?.type === 'IN' ? incomingTotal : outgoingTotal;
    return total ? (100 * Math.abs(group.sum)) / total : 0;
  };

  const getCommentGroupPercentage = (sum: number, categorySum: number) =>
    categorySum ? (100 * Math.abs(sum)) / Math.abs(categorySum) : 0;

  const formatPercent = (value: number) => `${formatMoney(value, { maxPrecision: value > 10 ? 0 : 1 })}%`;
</script>

<div class="p-1">
  <MonthSelect {startDate} {endDate} onChange={handleDateChange} />

  <div class="summary-by-categories">
    <ul class="list">
      {#each groups as group (group.categoryId)}
        <li class="item" class:selected={selectedCategoryId === group.categoryId} data-id={group.categoryId}>
          <button
            on:click={() => (selectedCategoryId = selectedCategoryId !== group.categoryId ? group.categoryId : null)}
            aria-expanded={selectedCategoryId === group.categoryId}
          >
            <div class="category">
              <Icon name={group.category?.icon ?? 'mdi:help'} />
              <span>{group.category?.name ?? group.categoryId}</span>
            </div>
            <div class="category-values">
              <span class="amount">
                {#if $analyticsBalancesVisibilityMode === 'hide' || ((balancesHidden || group.hasHiddenBalanceAccount) && $analyticsBalancesVisibilityMode !== 'show')}
                  <HiddenMoney currency={mainCurrency} />
                {:else}
                  {formatMoney(group.sum, { currency: mainCurrency })}
                {/if}
              </span>
              <span class="percentage">{formatPercent(getGroupPercentage(group, incomingTotal, outgoingTotal))}</span>
            </div>
          </button>
        </li>
      {/each}
    </ul>
    <hr />
    <div class="total-container">
      <div class="total">
        <div>{$translate('categories.incomings')}:</div>
        <div>
          {#if totalsHidden}
            <HiddenMoney currency={mainCurrency} />
          {:else}
            {formatMoney(incomingTotal, { currency: mainCurrency })}
          {/if}
        </div>
        <div>{$translate('categories.outgoings')}:</div>
        <div>
          {#if totalsHidden}
            <HiddenMoney currency={mainCurrency} />
          {:else}
            {formatMoney(-outgoingTotal, { currency: mainCurrency })}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

{#if selectedGroup}
  <section class="comments-summary p-1" aria-label={$translate('analytics.categories.comments')}>
    {#key selectedGroup.categoryId}
      <Spoiler hidden={commentsHidden}>
        <div slot="spoiler-header" class="comments-summary-header">
          <SpoilerToggle bind:hidden={commentsHidden} translate={$translate}>
            {$translate('analytics.categories.comments')}
          </SpoilerToggle>
        </div>
        <ul class="comment-list">
          {#each commentGroups as group (group.comment)}
            <li>
              <span class:no-comment={!group.comment}>
                {group.comment ?? $translate('analytics.categories.no_comment')}
              </span>
              <div class="comment-values">
                <span class="comment-amount">
                  {#if $analyticsBalancesVisibilityMode === 'hide' || ((balancesHidden || group.hasHiddenBalanceAccount) && $analyticsBalancesVisibilityMode !== 'show')}
                    <HiddenMoney currency={mainCurrency} />
                  {:else}
                    {formatMoney(group.sum, { currency: mainCurrency })}
                  {/if}
                </span>
                <span class="percentage">{formatPercent(getCommentGroupPercentage(group.sum, selectedGroup.sum))}</span>
              </div>
            </li>
          {/each}
        </ul>
      </Spoiler>
    {/key}
  </section>
  <div class="transactions-preview">
    <TransactionList transactions={selectedGroup.transactions} />
  </div>
{/if}

<style>
  .list {
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .item button {
    padding: 0;
    border: none;
    font-size: 1rem;
    color: var(--primary-text-color);
    background: transparent;
    cursor: pointer;

    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .item.selected button {
    color: var(--active-color);
  }
  @media (hover: hover) {
    .item button:hover {
      color: var(--active-color);
    }
  }
  .category {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .category > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .category-values {
    display: grid;
    grid-template-columns: minmax(6rem, auto) minmax(2.75rem, max-content);
    align-items: center;
    column-gap: 0.5rem;
    flex-shrink: 0;
    text-align: right;
  }
  .percentage {
    color: var(--secondary-text-color);
  }
  .amount {
    word-break: keep-all;
  }
  .total-container {
    display: flex;
    justify-content: flex-end;
    text-align: right;
  }
  .total {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: auto auto;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }
  .comments-summary {
    margin-top: 0.5rem;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }
  .comments-summary-header {
    margin-bottom: 0.75rem;
  }
  .comment-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .comment-list li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .comment-list li > span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .no-comment {
    color: var(--secondary-text-color);
    font-style: italic;
  }
  .comment-amount {
    text-align: right;
  }
  .comment-values {
    display: grid;
    grid-template-columns: minmax(6rem, auto) minmax(2.75rem, max-content);
    align-items: center;
    column-gap: 0.5rem;
    flex-shrink: 0;
    text-align: right;
  }
</style>
