<script lang="ts">
  import { goto } from '$app/navigation';
  import { memberSettingsStore } from '$lib/data';
  import { currencySymbols } from '$lib/data/currencySymbols';
  import type { AccountViewModel } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import { formatMoney } from '$lib/utils';

  import type { GroupSummary } from './interfaces';
  import { countPreviousItems } from './utils';

  export let totalBalance: number;
  export let groups: GroupSummary[];

  const settings = $memberSettingsStore;

  const mainCurrency = settings?.currency ?? 'USD';

  const onClick = async (item: AccountViewModel) => {
    await goto(`${route('accounts')}?account-card=${item.id}`);
  };
</script>

<table class="p-1">
  {#each groups as { groupId, group, accountSummaries, percentages, ratedBalance }, i (groupId)}
    <tbody data-group-id={groupId}>
      {#if groups.length > 1}
        <tr>
          <th class="text-left" colspan="2">
            <div class="flex gap-0.25 items-center">
              <span class="color-badge" style:background={group?.color ?? '#bbb'} />
              <span class="account-name">
                {group?.name ?? $translate('analytics.groupings.groups.other')}
              </span>
            </div>
          </th>
          <th class="text-right">
            {formatMoney(ratedBalance, { maxPrecision: 0 })}
            {currencySymbols[mainCurrency] ?? mainCurrency}
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
                <span class="color-badge" style:background={item.color} />
                <span class="account-name">{item.account.name}</span>
              </div>
              <span class="original-currency secondary">{item.account.currency}</span>
            </div>
          </td>
          <td class="rated-balance">
            <div class="flex gap-0.25 items-baseline justify-end">
              <span>{formatMoney(item.ratedBalance, { maxPrecision: 0 })}</span>
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
  <tbody />
  <tfoot>
    <tr>
      <td />
      <td>
        <div class="text-right">{$translate('analytics.accounts.total')}:</div>
      </td>
      <td>
        <div class="flex gap-0.25 items-baseline justify-end">
          <span>{formatMoney(totalBalance, { maxPrecision: 0 })}</span>
        </div>
      </td>
      <td>{mainCurrency} </td>
    </tr>
  </tfoot>
</table>

<style>
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
  .number-cell {
    position: relative;
  }
  .color-badge {
    width: 8px;
    height: 8px;
    border-radius: 100%;
  }
  .name-cell {
    word-break: break-all;
    padding-right: 1rem;
  }
  .account-name {
    text-align: left;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
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
    display: inline-block;
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
