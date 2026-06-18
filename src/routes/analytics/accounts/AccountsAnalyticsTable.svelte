<script lang="ts">
  import { goto } from '$app/navigation';
  import { memberSettingsStore, settingsStore } from '$lib/data';
  import { currencySymbols } from '$lib/data/currencySymbols';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HiddenMoney from '$lib/ui/HiddenMoney.svelte';
  import { formatMoney, hasHiddenBalanceAccount, isBalanceHidden } from '$lib/utils';

  import { hideVisibleAnalyticsBalances, showHiddenAnalyticsBalances } from '../store';
  import type { GroupSummary } from './interfaces';
  import { countPreviousItems } from './utils';

  export let totalBalance: number;
  export let groups: GroupSummary[];

  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';
  $: balancesHidden = $settingsStore.hideBalances ?? false;
  $: totalBalanceHidden =
    $hideVisibleAnalyticsBalances ||
    (!$showHiddenAnalyticsBalances &&
      (balancesHidden ||
        hasHiddenBalanceAccount(
          null,
          groups.flatMap((group) => group.accountSummaries.map((item) => item.account)),
        )));

  const isGroupBalanceHidden = (accountSummaries: GroupSummary['accountSummaries']) =>
    $hideVisibleAnalyticsBalances ||
    (!$showHiddenAnalyticsBalances &&
      hasHiddenBalanceAccount(
        null,
        accountSummaries.map((item) => item.account),
      ));

  const onClick = async (item: AccountViewModel) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<div class="table-container">
  <table>
    {#each groups as { groupId, group, accountSummaries, percentages, ratedBalance }, i (groupId)}
      <tbody data-group-id={groupId}>
        {#if groups.length > 1}
          <tr>
            <th class="text-left" colspan="2">
              <div class="flex gap-0.25 items-center">
                <span class="color-badge" style:background={group?.color ?? '#bbb'}></span>
                <span class="text-ellipsis">
                  {group?.name ?? $translate('analytics.groupings.groups.other')}
                </span>
              </div>
            </th>
            <th class="text-right">
              {#if $hideVisibleAnalyticsBalances || (balancesHidden && !$showHiddenAnalyticsBalances) || isGroupBalanceHidden(accountSummaries)}
                <HiddenMoney currency={currencySymbols[mainCurrency] ?? mainCurrency} size="sm" />
              {:else}
                {formatMoney(ratedBalance, {
                  maxPrecision: 0,
                  currency: currencySymbols[mainCurrency] ?? mainCurrency,
                })}
              {/if}
            </th>
            <th class="percentages">
              {formatMoney(percentages, { maxPrecision: percentages > 10 ? 0 : 1 }) + '%'}
            </th>
          </tr>
        {/if}
        {#each accountSummaries as item, j (item.account.id)}
          <tr on:click={() => onClick(item.account)}>
            <td class="number-cell text-right">
              {countPreviousItems(groups, i) + j + 1}.
            </td>
            <td class="name-cell">
              <div class="flex gap-0.25 items-end">
                <div class="flex gap-0.25 items-center">
                  <span class="color-badge" style:background={item.color}></span>
                  <span class="account-name text-ellipsis-all">{item.account.name}</span>
                </div>
                <span class="original-currency secondary">{item.account.currency}</span>
              </div>
            </td>
            <td class="rated-balance">
              <div class="flex gap-0.25 items-baseline justify-end">
                <span>
                  {#if $hideVisibleAnalyticsBalances || (!$showHiddenAnalyticsBalances && isBalanceHidden($settingsStore, item.account))}
                    <HiddenMoney size="sm" />
                  {:else}
                    {formatMoney(item.ratedBalance, { maxPrecision: 0 })}
                  {/if}
                </span>
                <span class="main-currency">{currencySymbols[mainCurrency] ?? mainCurrency}</span>
              </div>
            </td>
            <td class="percentages secondary">
              {formatMoney(item.percentages, { maxPrecision: item.percentages > 10 ? 0 : 1 }) + '%'}
            </td>
          </tr>
        {/each}
      </tbody>
    {/each}
    <tbody></tbody>
    <tfoot>
      <tr>
        <td></td>
        <td>
          <div class="text-right">{$translate('analytics.accounts.total')}:</div>
        </td>
        <td>
          <div class="flex gap-0.25 items-baseline justify-end">
            <span>
              {#if totalBalanceHidden}
                <HiddenMoney size="sm" />
              {:else}
                {formatMoney(totalBalance, { maxPrecision: 0 })}
              {/if}
            </span>
          </div>
        </td>
        <td>{mainCurrency} </td>
      </tr>
    </tfoot>
  </table>
</div>

<style>
  .table-container {
    padding: 0.5rem;
    @media (min-width: 768px) {
      padding: 1rem;
    }
  }
  table {
    margin: 0;
    width: 100%;
  }
  @media (hover: hover) {
    table tbody tr td {
      cursor: pointer;
    }
    table tbody tr:hover td {
      color: var(--active-color);
    }
  }
  @media (hover: none) {
    table tbody tr:active td {
      color: var(--active-color);
    }
  }
  .number-cell {
    position: relative;
  }
  .color-badge {
    width: 8px;
    height: 8px;
    border-radius: 100%;
    flex-shrink: 0;
  }
  .name-cell {
    word-break: break-all;
    width: 100%;
    padding-right: 0.25rem;
  }
  .rated-balance {
    text-align: right;
    word-break: keep-all;
  }
  .original-currency {
    font-size: 0.8rem;
    word-break: keep-all;
  }
  .percentages {
    flex-shrink: 0;
    text-align: right;
    min-width: 40px;
  }
  .secondary {
    color: var(--secondary-text-color);
  }
  tfoot tr td {
    border-top: 1px solid var(--border-color);
  }
</style>
